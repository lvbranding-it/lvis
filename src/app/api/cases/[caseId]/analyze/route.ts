import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculateLVIndex } from '@/lib/scoring/authenticity-index'
import { buildReportProps, generateAndStoreReport } from '@/lib/pdf/generator'
import { sendReportReadyEmail } from '@/lib/email/resend'
import sharp from 'sharp'
import type { ClaudeFindings, TechnicalEvidence, CategoryScores, ForensicReview } from '@/types'
import { RAW_EXTENSIONS } from '@/lib/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  // ── Chain-of-custody: capture request origin metadata ─────────────────────
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'Unknown'
  const userAgent = request.headers.get('user-agent') ?? 'Unknown'

  let geoCity = '', geoCountry = '', geoTimezone = 'UTC'
  try {
    const geo = await fetch(`https://ipapi.co/${clientIp}/json/`, { signal: AbortSignal.timeout(4000) })
      .then((r) => r.json())
    geoCity = geo.city ?? ''
    geoCountry = geo.country_name ?? ''
    geoTimezone = geo.timezone ?? 'UTC'
  } catch { /* non-fatal — geo lookup failure does not block analysis */ }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify case ownership or admin
  const serviceClient = createServiceClient()
  const { data: caseData } = await serviceClient
    .from('cases')
    .select('*, case_files(*), profiles!cases_client_id_fkey(id, role, full_name, company_name)')
    .eq('id', caseId)
    .single()

  if (!caseData) return Response.json({ error: 'Case not found' }, { status: 404 })

  const isAdmin = (caseData.profiles as { role: string })?.role === 'admin'
  if (caseData.client_id !== user.id && !isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const caseFile = caseData.case_files?.[0]
  if (!caseFile) return Response.json({ error: 'No file uploaded for this case' }, { status: 400 })

  // Check subscription tier limits
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'free'
  if (tier === 'free') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { count } = await serviceClient
      .from('forensic_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', caseId)
      .gte('created_at', thirtyDaysAgo.toISOString())
    // Free tier: check if user already has an analysis this month
    const { count: userCount } = await serviceClient
      .from('forensic_reviews')
      .select('forensic_reviews.id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
    if ((userCount ?? 0) >= 1) {
      return Response.json({ error: 'Free tier limit reached. Upgrade to Pro for more analyses.' }, { status: 402 })
    }
  }

  // Create forensic_review record in 'running' state
  const { data: review, error: reviewError } = await serviceClient
    .from('forensic_reviews')
    .insert({
      case_id: caseId,
      case_file_id: caseFile.id,
      analysis_status: 'running',
    })
    .select()
    .single()

  if (reviewError || !review) {
    return Response.json({ error: 'Failed to create review record' }, { status: 500 })
  }

  // Update case status
  await serviceClient.from('cases').update({ status: 'analyzing' }).eq('id', caseId)

  try {
    // 1. Download image from Supabase Storage
    const { data: imageData, error: downloadError } = await serviceClient.storage
      .from('case-images')
      .download(caseFile.storage_path)

    if (downloadError || !imageData) {
      throw new Error(`Storage download failed: ${downloadError?.message}`)
    }

    const imageBuffer = Buffer.from(await imageData.arrayBuffer())

    // Check if the file is a RAW camera format (sharp cannot decode RAW)
    const fileExt = '.' + (caseFile.file_name.split('.').pop() ?? '').toLowerCase()
    const isRawFile = RAW_EXTENSIONS.includes(fileExt)

    // Original bytes — always sent to the Python engine so ExifTool reads real metadata.
    // Sharp strips EXIF by default, so we must use the untouched buffer here.
    const engineImageBase64 = imageBuffer.toString('base64')

    // Pre-resize non-RAW images for Claude right away (sharp can decode JPEG/PNG/TIFF/HEIC)
    // RAW files cannot be decoded by sharp — conversion is done by the Python engine via rawpy
    let standardImageBase64: string | null = null
    if (!isRawFile) {
      const claudeBuffer = await sharp(imageBuffer)
        .resize(1568, 1568, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
      standardImageBase64 = claudeBuffer.toString('base64')
    }

    // 2. Call Python forensic engine (always with original bytes so ExifTool sees full metadata)
    let technicalFindings: TechnicalEvidence | null = null

    const engineUrl = process.env.LVIS_ENGINE_URL
    if (engineUrl) {
      try {
        const engineResponse = await fetch(`${engineUrl}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.LVIS_ENGINE_API_KEY ?? '',
          },
          body: JSON.stringify({
            image_base64: engineImageBase64,
            file_name: caseFile.file_name,
            file_type: caseFile.file_type,
            case_purpose: caseData.purpose,
          }),
          signal: AbortSignal.timeout(120_000),
        })
        if (engineResponse.ok) {
          technicalFindings = await engineResponse.json()
        } else {
          console.warn('[analyze] Python engine returned non-OK, proceeding without technical analysis')
        }
      } catch (engineErr) {
        // Engine not running or unreachable — gracefully skip technical analysis
        console.warn('[analyze] Python engine unreachable, proceeding without technical analysis:', (engineErr as Error).message)
      }
    }

    // Store metadata report from ExifTool
    if (technicalFindings?.exiftool?.raw) {
      const raw = technicalFindings.exiftool.raw as Record<string, unknown>
      await serviceClient.from('metadata_reports').insert({
        case_file_id: caseFile.id,
        exif_json: filterMetadataGroup(raw, 'EXIF'),
        xmp_json: filterMetadataGroup(raw, 'XMP'),
        iptc_json: filterMetadataGroup(raw, 'IPTC'),
        raw_metadata: raw,
      })
    }

    // Build the image payload for Claude:
    //   - Standard images: already resized JPEG (standardImageBase64)
    //   - RAW files: use the JPEG returned by the Python engine (converted via rawpy),
    //     then resize with sharp to stay under Claude's 5 MB base64 limit.
    //     If the engine isn't running, Claude visual analysis is skipped gracefully.
    type FindingsWithJpeg = TechnicalEvidence & { converted_jpeg_base64?: string }
    const engineConvertedJpeg = (technicalFindings as FindingsWithJpeg | null)?.converted_jpeg_base64 ?? null

    let claudeImageBase64: string | null = null
    if (isRawFile) {
      if (engineConvertedJpeg) {
        // Resize the engine-converted JPEG — full-res RAW → JPEG can be 10-30 MB
        const convertedBuf = Buffer.from(engineConvertedJpeg, 'base64')
        const resized = await sharp(convertedBuf)
          .resize(1568, 1568, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
        claudeImageBase64 = resized.toString('base64')
      } else {
        // Engine offline or rawpy conversion failed — skip visual analysis
        console.warn('[analyze] RAW file with no engine conversion — Claude visual analysis skipped')
      }
    } else {
      claudeImageBase64 = standardImageBase64
    }

    // 3. Call Claude API directly (avoids Supabase edge function Cloudflare timeout)
    // Skip if we have no usable image (RAW without engine conversion)
    const claudeFindings = claudeImageBase64
      ? await runClaudeAnalysis(claudeImageBase64, 'image/jpeg', technicalFindings, caseData.purpose)
      : buildRawFallbackFindings()

    // 4. Calculate LV Authenticity Index
    const claudeScores: CategoryScores = {
      provenance: claudeFindings.provenance.score,
      file_integrity: claudeFindings.file_integrity.score,
      visual_consistency: claudeFindings.visual_consistency.score,
      manipulation: claudeFindings.manipulation.score,
      synthetic_risk: claudeFindings.synthetic_risk.score,
    }

    const technicalFloors: Partial<CategoryScores> = technicalFindings ? {
      provenance: technicalFindings.technical_provenance_floor ?? 0,
      file_integrity: technicalFindings.technical_integrity_floor ?? 0,
      manipulation: technicalFindings.technical_manipulation_floor ?? 0,
    } : {}

    const lvIndex = calculateLVIndex(claudeScores, technicalFloors)

    // Determine overall confidence
    const confidences = [
      claudeFindings.provenance.confidence,
      claudeFindings.file_integrity.confidence,
      claudeFindings.visual_consistency.confidence,
      claudeFindings.manipulation.confidence,
      claudeFindings.synthetic_risk.confidence,
    ]
    const confMap = { low: 0, medium: 1, high: 2 }
    const avgConf = confidences.reduce((s, c) => s + (confMap[c] ?? 1), 0) / confidences.length
    const finalConfidence = avgConf >= 1.5 ? 'high' : avgConf >= 0.5 ? 'medium' : 'low'

    // Build analysis_context (chain-of-custody metadata)
    const analysisContext = {
      ip: clientIp,
      city: geoCity,
      country: geoCountry,
      timezone: geoTimezone,
      user_agent: userAgent,
    }

    // 5. Update forensic_review with results
    await serviceClient.from('forensic_reviews').update({
      technical_evidence: { ...(technicalFindings ?? {}), analysis_context: analysisContext },
      claude_findings: claudeFindings,
      provenance_score: Math.max(claudeScores.provenance, technicalFloors?.provenance ?? 0),
      file_integrity_score: claudeScores.file_integrity,
      visual_consistency_score: claudeScores.visual_consistency,
      manipulation_score: Math.max(claudeScores.manipulation, technicalFloors.manipulation ?? 0),
      synthetic_risk_score: claudeScores.synthetic_risk,
      total_score: lvIndex.total_score,
      classification: lvIndex.classification,
      confidence_level: finalConfidence,
      analysis_status: 'complete',
      analyzed_at: new Date().toISOString(),
    }).eq('id', review.id)

    // 6. Update case to completed
    await serviceClient.from('cases').update({ status: 'completed' }).eq('id', caseId)

    // 7. Generate PDF inline and email client (async — don't block the response)
    void (async () => {
      try {
        // Build review object for the PDF generator
        const completedReview: ForensicReview = {
          ...review,
          technical_evidence: { ...(technicalFindings ?? {}), analysis_context: analysisContext } as TechnicalEvidence,
          claude_findings: claudeFindings,
          provenance_score: Math.max(claudeScores.provenance, technicalFloors?.provenance ?? 0),
          file_integrity_score: claudeScores.file_integrity,
          visual_consistency_score: claudeScores.visual_consistency,
          manipulation_score: Math.max(claudeScores.manipulation, technicalFloors.manipulation ?? 0),
          synthetic_risk_score: claudeScores.synthetic_risk,
          total_score: lvIndex.total_score,
          classification: lvIndex.classification,
          confidence_level: finalConfidence,
          analysis_status: 'complete',
          analyzed_at: new Date().toISOString(),
        }

        const clientProfile = caseData.profiles as {
          id?: string; role?: string; full_name?: string | null; company_name?: string | null
        } | null

        const reportProps = buildReportProps(
          { ...caseData, client: clientProfile },
          completedReview
        )

        const storagePath = await generateAndStoreReport({
          caseId,
          forensicReviewId: review.id,
          reportData: reportProps,
        })

        if (storagePath && process.env.RESEND_API_KEY) {
          // Get 24-hour signed URL for email
          const { data: signedData } = await serviceClient.storage
            .from('case-reports')
            .createSignedUrl(storagePath, 86_400)

          if (signedData?.signedUrl) {
            // Get client's email from Supabase Auth
            const { data: authUser } = await serviceClient.auth.admin.getUserById(caseData.client_id)
            const clientEmail = authUser?.user?.email
            const clientName = clientProfile?.full_name ?? authUser?.user?.email?.split('@')[0] ?? 'Client'

            if (clientEmail) {
              await sendReportReadyEmail({
                to: clientEmail,
                clientName,
                caseNumber: caseData.case_number,
                caseTitle: caseData.title,
                reportUrl: signedData.signedUrl,
                totalScore: lvIndex.total_score,
                classification: lvIndex.classification,
              })
              console.log(`[analyze] Report emailed to ${clientEmail} for case ${caseData.case_number}`)
            }
          }
        }
      } catch (pdfErr) {
        console.error('[analyze] PDF/email generation failed:', pdfErr)
      }
    })()

    return Response.json({
      forensicReviewId: review.id,
      totalScore: lvIndex.total_score,
      classification: lvIndex.classification,
    })

  } catch (error) {
    console.error('[analyze] Pipeline error:', error)
    // Mark review as failed
    await serviceClient.from('forensic_reviews').update({
      analysis_status: 'failed',
      error_message: String(error),
    }).eq('id', review.id)

    await serviceClient.from('cases').update({ status: 'in_review' }).eq('id', caseId)

    return Response.json({ error: String(error) }, { status: 500 })
  }
}

function filterMetadataGroup(raw: Record<string, unknown>, prefix: string): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(raw).filter(([k]) => k.startsWith(prefix + ':') || k.startsWith(prefix + '_'))
  )
}

/**
 * Fallback Claude findings used when the Python engine is offline and the file
 * is a RAW format that cannot be decoded by sharp.  Scores are neutral/unknown
 * with 'low' confidence so the final index is not artificially inflated.
 */
function buildRawFallbackFindings(): ClaudeFindings {
  const neutral = {
    score: 10,
    confidence: 'low' as const,
    findings: ['Visual analysis unavailable — forensic engine required to convert RAW format.'],
    narrative: 'Visual analysis could not be performed because the file is a RAW camera format and the Python forensic engine was not available to convert it. Please ensure the engine is running and re-analyze.',
  }
  return {
    provenance: neutral,
    file_integrity: neutral,
    visual_consistency: neutral,
    manipulation: neutral,
    synthetic_risk: neutral,
    overall_observations: 'Visual analysis was skipped. Only technical metadata analysis (ExifTool) results are available for this RAW file.',
    recommended_actions: ['Ensure the LVIS forensic engine is running and re-trigger analysis to obtain full visual assessment.'],
  }
}

const CLAUDE_SYSTEM_PROMPT = `You are the visual analysis layer of LVIS™ (Luis Velasquez Image Integrity System), a professional forensic photography analysis platform.

The technical forensic engine (ExifTool + OpenCV + Pillow) has already performed objective analysis. Your role is to assess VISUAL evidence that technical tools cannot detect: lighting coherence, physical consistency, compositing artifacts, depth-of-field behavior, and synthetic generation indicators.

IMPORTANT: Do NOT contradict objective technical evidence. Your visual scores supplement — not override — the technical analysis.

Respond with ONLY a valid JSON object. No markdown, no commentary, no code fences.

{"provenance":{"score":<0-100>,"confidence":"<low|medium|high>","findings":["..."],"narrative":"..."},"file_integrity":{"score":<0-100>,"confidence":"<low|medium|high>","findings":["..."],"narrative":"..."},"visual_consistency":{"score":<0-100>,"confidence":"<low|medium|high>","findings":["..."],"narrative":"..."},"manipulation":{"score":<0-100>,"confidence":"<low|medium|high>","findings":["..."],"narrative":"..."},"synthetic_risk":{"score":<0-100>,"confidence":"<low|medium|high>","findings":["..."],"narrative":"..."},"overall_observations":"...","recommended_actions":["..."]}

SCORE: 0–20 authentic, 21–50 minor adjustments, 51–80 significant manipulation, 81–100 strong manipulation/AI.`

async function runClaudeAnalysis(
  imageBase64: string,
  fileType: string,
  technicalFindings: unknown,
  casePurpose: string | null,
): Promise<ClaudeFindings> {
  const mediaType = fileType.includes('png') ? 'image/png'
    : fileType.includes('gif') ? 'image/gif'
    : fileType.includes('webp') ? 'image/webp'
    : 'image/jpeg'

  const userMessage = `Technical forensic findings from our analysis engine:

=== TECHNICAL FINDINGS ===
${JSON.stringify(technicalFindings, null, 2)}

=== CASE PURPOSE ===
${casePurpose || 'General forensic evaluation'}

Analyze the attached image visually and provide your forensic assessment as JSON.`

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      temperature: 0,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: userMessage },
        ],
      }],
    }),
    signal: AbortSignal.timeout(180_000), // 3 min — Node.js has no Cloudflare limit
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Claude API error: ${errText}`)
  }

  const data = await resp.json()
  const raw = data.content?.[0]?.text ?? ''
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned) as ClaudeFindings
}
