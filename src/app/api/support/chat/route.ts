import { NextRequest } from 'next/server'

const SUPPORT_SYSTEM_PROMPT = `You are the LVIS™ support assistant for LV Branding's LV Image Integrity System™ — a professional forensic photography analysis platform.

Help users with:
- Using the platform (submitting cases, understanding results, downloading PDF reports)
- Interpreting forensic scores: the LV Authenticity Index™ ranges from 0 (fully authentic) to 100 (highly manipulated). It is composed of EXIF Analysis, ELA (Error Level Analysis), and Vision Analysis.
- Subscription plans: Free (1 analysis/month), By Unit ($9.99/report, pay-as-you-go), Pro ($49/month, 10 analyses), Enterprise ($199/month, unlimited)
- Account, billing, and general technical questions

Guidelines:
- Keep responses concise, professional, and helpful
- Use plain language; avoid excessive jargon
- If you cannot resolve the issue or the user needs human support, tell them to click "Contact Support" below to send a ticket directly to the team
- Do not make up information — if unsure, recommend contacting support
- Do not discuss topics unrelated to LVIS™ or LV Branding`

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Invalid messages', { status: 400 })
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      stream: true,
      system: SUPPORT_SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!resp.ok) {
    return new Response('AI service unavailable', { status: 502 })
  }

  // Transform Anthropic SSE → plain incremental text stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (
                parsed.type === 'content_block_delta' &&
                parsed.delta?.type === 'text_delta'
              ) {
                controller.enqueue(encoder.encode(parsed.delta.text))
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
