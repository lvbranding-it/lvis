// Server-only — never import from client components.
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { LVISReportDocument, type LVISReportDocumentProps } from '@/components/pdf/LVISReportDocument'
import { createServiceClient } from '@/lib/supabase/server'
import { LVIS_DISCLAIMER } from '@/lib/constants'
import type { Case, ForensicReview } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateReportOptions {
  caseId: string
  forensicReviewId: string
  reportData: LVISReportDocumentProps
}

// ─── Core generator ───────────────────────────────────────────────────────────

/**
 * Renders the LVIS PDF report, uploads it to Supabase Storage, upserts the
 * `reports` table row, and returns the storage path.
 *
 * Returns null on failure (errors are logged but not thrown so callers can
 * degrade gracefully).
 */
export async function generateAndStoreReport(
  options: GenerateReportOptions
): Promise<string | null> {
  const { caseId, forensicReviewId, reportData } = options

  try {
    // 1. Generate QR code linking to the public verification page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const verifyUrl = `${appUrl}/verify/${caseId}`
    let qrDataUrl: string | undefined
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 144,   // 2× for crisp rendering at 72px display size
        margin: 1,
        color: { dark: '#F8FAFC', light: '#1E293B' },  // white modules on dark bg
      })
    } catch (qrErr) {
      console.warn('[pdf/generator] QR generation failed (non-fatal):', qrErr)
    }

    // 2. Fetch specimen image for the Image Evidence page
    // For RAW camera files (CR2, CR3, NEF, etc.) sharp cannot decode the format.
    // The Python engine stores a JPEG-converted version in technical_evidence.converted_jpeg_base64.
    // We use that for RAW files; for standard images we download and resize with sharp.
    let specimenImageBase64: string | undefined
    try {
      const supabaseForImg = createServiceClient()
      const { data: caseFile } = await supabaseForImg
        .from('case_files')
        .select('storage_path, file_name')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (caseFile?.storage_path) {
        const RAW_EXTS = ['.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.raf']
        const ext = '.' + (caseFile.file_name?.split('.').pop() ?? '').toLowerCase()
        const isRaw = RAW_EXTS.includes(ext)

        if (isRaw) {
          // Fetch the engine-converted JPEG from the forensic_review's technical_evidence
          const { data: reviewRow } = await supabaseForImg
            .from('forensic_reviews')
            .select('technical_evidence')
            .eq('id', forensicReviewId)
            .single()
          const converted = (reviewRow?.technical_evidence as Record<string, unknown> | null)
            ?.converted_jpeg_base64 as string | undefined

          if (converted) {
            const buf = Buffer.from(converted, 'base64')
            const resized = await sharp(buf)
              .resize({ width: 900, withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toBuffer()
            specimenImageBase64 = `data:image/jpeg;base64,${resized.toString('base64')}`
          }
          // If engine wasn't running (no converted JPEG), specimenImageBase64 stays undefined
        } else {
          // Standard images: download from storage and resize with sharp
          const { data: fileBlob } = await supabaseForImg.storage
            .from('case-images')
            .download(caseFile.storage_path)

          if (fileBlob) {
            const arrayBuf = await fileBlob.arrayBuffer()
            const resized = await sharp(Buffer.from(arrayBuf))
              .resize({ width: 900, withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toBuffer()
            specimenImageBase64 = `data:image/jpeg;base64,${resized.toString('base64')}`
          }
        }
      }
    } catch (imgErr) {
      console.warn('[pdf/generator] Specimen image fetch failed (non-fatal):', imgErr)
    }

    // 3. Render PDF to buffer
    const finalProps: LVISReportDocumentProps = { ...reportData, qrDataUrl, specimenImageBase64 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(LVISReportDocument, finalProps) as any
    const pdfBuffer = await renderToBuffer(element)

    const supabase = createServiceClient()

    // 4. Determine version — look for existing reports for this case
    const { data: existingReports } = await supabase
      .from('reports')
      .select('version')
      .eq('case_id', caseId)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = existingReports && existingReports.length > 0
      ? (existingReports[0].version ?? 0) + 1
      : 1

    const storagePath = `${caseId}/report-v${nextVersion}.pdf`

    // 3. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('case-reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('[pdf/generator] Storage upload error:', uploadError)
      return null
    }

    // 4. Insert or update reports row (no unique constraint — do it manually)
    const reportPayload = {
      case_id: caseId,
      forensic_review_id: forensicReviewId,
      storage_path: storagePath,
      version: nextVersion,
      delivered_at: new Date().toISOString(),
    }

    let dbError
    if (existingReports && existingReports.length > 0) {
      // Update existing row
      const { error } = await supabase
        .from('reports')
        .update(reportPayload)
        .eq('case_id', caseId)
      dbError = error
    } else {
      // Insert new row
      const { error } = await supabase
        .from('reports')
        .insert(reportPayload)
      dbError = error
    }

    if (dbError) {
      console.error('[pdf/generator] DB write error:', dbError)
      return null
    }

    return storagePath
  } catch (err) {
    console.error('[pdf/generator] Unexpected error:', err)
    return null
  }
}

// ─── Props builder ────────────────────────────────────────────────────────────

/**
 * Maps raw Supabase `cases` + `forensic_reviews` rows to the props shape
 * expected by `LVISReportDocument`.
 */
export function buildReportProps(
  caseData: Case & { client?: { full_name?: string | null } | null },
  review: ForensicReview
): LVISReportDocumentProps {
  const findings = review.claude_findings
  const tech = review.technical_evidence

  const clientName =
    caseData.client?.full_name ??
    'Unknown Client'

  return {
    caseNumber: caseData.case_number,
    caseTitle: caseData.title,
    clientName,
    purpose: caseData.purpose ?? null,
    analyzedAt: review.analyzed_at ?? review.created_at,
    totalScore: review.total_score,
    classification: review.classification,
    confidenceLevel: review.confidence_level,
    categoryScores: {
      provenance: review.provenance_score,
      file_integrity: review.file_integrity_score,
      visual_consistency: review.visual_consistency_score,
      manipulation: review.manipulation_score,
      synthetic_risk: review.synthetic_risk_score,
    },
    claudeFindings: {
      provenance: {
        score: findings.provenance.score,
        narrative: findings.provenance.narrative,
        findings: findings.provenance.findings,
      },
      file_integrity: {
        score: findings.file_integrity.score,
        narrative: findings.file_integrity.narrative,
        findings: findings.file_integrity.findings,
      },
      visual_consistency: {
        score: findings.visual_consistency.score,
        narrative: findings.visual_consistency.narrative,
        findings: findings.visual_consistency.findings,
      },
      manipulation: {
        score: findings.manipulation.score,
        narrative: findings.manipulation.narrative,
        findings: findings.manipulation.findings,
      },
      synthetic_risk: {
        score: findings.synthetic_risk.score,
        narrative: findings.synthetic_risk.narrative,
        findings: findings.synthetic_risk.findings,
      },
      overall_observations: findings.overall_observations,
      recommended_actions: (findings.recommended_actions ?? []).slice(0, 6),
    },
    exiftoolFlags: tech?.exiftool?.flags ?? [],
    opencvSummary: {
      ela_score: tech?.opencv?.ela_score ?? 0,
      clone_score: tech?.opencv?.clone_score ?? 0,
      noise_uniformity_score: tech?.opencv?.noise_uniformity_score ?? 100,
      flagged_regions_count: tech?.opencv?.flagged_regions?.length ?? 0,
    },
    analysisContext: {
      ip: tech?.analysis_context?.ip ?? null,
      city: tech?.analysis_context?.city ?? null,
      country: tech?.analysis_context?.country ?? null,
      timezone: tech?.analysis_context?.timezone ?? null,
    },
    elaMapBase64: tech?.opencv?.ela_map_base64
      ? `data:image/jpeg;base64,${tech.opencv.ela_map_base64}`
      : null,
    exifDetails: (tech?.exiftool?.raw ?? null) as Record<string, unknown> | null,
    disclaimer: LVIS_DISCLAIMER,
  }
}
