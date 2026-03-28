import { createClient } from 'jsr:@supabase/supabase-js@2'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'

const SYSTEM_PROMPT = `You are the visual analysis layer of LVIS™ (LV Image Integrity System), a professional forensic photography analysis platform.

The technical forensic engine (ExifTool + OpenCV + Pillow) has already performed objective analysis. Your role is to assess VISUAL evidence that technical tools cannot detect: lighting coherence, physical consistency, compositing artifacts, depth-of-field behavior, and synthetic generation indicators.

IMPORTANT: You will receive the technical findings. Do NOT contradict objective technical evidence. Your visual scores should supplement — not override — the technical analysis.

Respond with ONLY a valid JSON object matching this schema. No markdown, no commentary, no code fences.

{
  "provenance": {
    "score": <integer 0-100>,
    "confidence": "<low|medium|high>",
    "findings": ["<specific observation>", ...],
    "narrative": "<2-3 sentence professional summary>"
  },
  "file_integrity": {
    "score": <integer 0-100>,
    "confidence": "<low|medium|high>",
    "findings": ["<specific observation>", ...],
    "narrative": "<2-3 sentence professional summary>"
  },
  "visual_consistency": {
    "score": <integer 0-100>,
    "confidence": "<low|medium|high>",
    "findings": ["<specific observation>", ...],
    "narrative": "<2-3 sentence professional summary>"
  },
  "manipulation": {
    "score": <integer 0-100>,
    "confidence": "<low|medium|high>",
    "findings": ["<specific observation>", ...],
    "narrative": "<2-3 sentence professional summary>"
  },
  "synthetic_risk": {
    "score": <integer 0-100>,
    "confidence": "<low|medium|high>",
    "findings": ["<specific observation>", ...],
    "narrative": "<2-3 sentence professional summary>"
  },
  "overall_observations": "<professional paragraph summarizing the complete visual forensic assessment>",
  "recommended_actions": ["<specific recommendation>", ...]
}

SCORE INTERPRETATION: Higher scores (0–100) = higher concern level.
  0–20: Consistent with authentic, unmanipulated photography
  21–50: Minor adjustments or uncertainty
  51–80: Significant indicators of manipulation/generation
  81–100: Strong evidence of manipulation or AI generation

VISUAL CONSISTENCY scoring criteria:
- Lighting direction consistency across all objects
- Shadow behavior and directionality
- Specular highlight positions
- Depth of field coherence
- Perspective geometry (natural lens distortion vs warped)
- Edge quality (natural film grain vs sharp compositing edges)
- Color temperature consistency across the frame

MANIPULATION scoring criteria (visual only — technical analysis handles file-level):
- Cloning artifacts: repeated textures in background areas
- Healing brush traces: unnaturally smooth patches
- Content-aware fill artifacts: geometric inconsistencies at fill edges
- Layer blending visible in feathered edges between elements
- Frequency domain artifacts in smooth areas

SYNTHETIC RISK scoring criteria:
- Skin texture: AI tends toward unnaturally smooth, plastic-looking skin
- Hair and fine detail: AI struggles with individual strands, frayed edges
- Hand/finger rendering: extra or missing fingers, unnaturally perfect hands
- Background coherence: AI often has dreamlike, inconsistent backgrounds
- Text in scene: AI-generated text is usually garbled or illegible
- Perceptual uniformity: camera sensors introduce natural variation; AI images can be too "clean"
- Eye rendering: glass-like, unnaturally detailed or symmetrical eyes are AI indicators`

interface RequestBody {
  imageBase64: string
  fileType: string
  technicalFindings: unknown
  casePurpose?: string
  caseFileId: string
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST',
      }
    })
  }

  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return Response.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY'))!
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')!

    // Accept service role key (called from Next.js API route — auth already verified server-side)
    // or verify user JWT for direct calls
    const token = authHeader.replace('Bearer ', '')
    if (token !== serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body: RequestBody = await req.json()
    const { imageBase64, fileType, technicalFindings, casePurpose, caseFileId } = body

    // Determine media type for Claude
    const mediaType = fileType.includes('png') ? 'image/png' :
                      fileType.includes('gif') ? 'image/gif' :
                      fileType.includes('webp') ? 'image/webp' :
                      'image/jpeg'

    // Build user message with technical context
    const userMessage = `The following technical forensic findings have been extracted from this image by our analysis engine. Use these as objective evidence to inform your visual analysis.

=== TECHNICAL FINDINGS ===
${JSON.stringify(technicalFindings, null, 2)}

=== CASE PURPOSE ===
${casePurpose || 'General forensic evaluation'}

Please analyze the attached image visually and provide your forensic assessment. Your analysis should complement the technical evidence, focusing on visual indicators that technical tools cannot detect.`

    // Call Claude API (synchronous, not streaming)
    const claudeResponse = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64,
                }
              },
              {
                type: 'text',
                text: userMessage,
              }
            ]
          }
        ]
      })
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      return Response.json({ error: `Claude API error: ${errText}` }, { status: 500 })
    }

    const claudeData = await claudeResponse.json()
    const rawContent = claudeData.content?.[0]?.text

    if (!rawContent) {
      return Response.json({ error: 'Empty response from Claude' }, { status: 500 })
    }

    // Parse JSON from Claude (strip any markdown fences if present)
    let findings
    try {
      const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      findings = JSON.parse(cleaned)
    } catch (parseError) {
      return Response.json({
        error: `Failed to parse Claude response as JSON: ${parseError}`,
        raw: rawContent
      }, { status: 422 })
    }

    return Response.json({
      findings,
      model: MODEL,
      usage: claudeData.usage,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('claude-analyze error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
})
