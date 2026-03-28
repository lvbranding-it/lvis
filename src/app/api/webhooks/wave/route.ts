import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Wave sends HMAC-SHA256 signature in the Wave-Signature header:
// format: "t=<timestamp>,v1=<hex-signature>"
function verifyWaveSignature(rawBody: string, header: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')))
    const timestamp = parts['t']
    const signature = parts['v1']
    if (!timestamp || !signature) return false

    // Reject events older than 5 minutes
    if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) return false

    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

    return expected === signature
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sigHeader = request.headers.get('wave-signature') ?? ''
  const secret = process.env.WAVE_WEBHOOK_SECRET ?? ''

  if (secret && !verifyWaveSignature(rawBody, sigHeader, secret)) {
    return new Response('Invalid Wave signature', { status: 400 })
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    // Wave fires different event names depending on configuration.
    // We handle the invoice paid / payment received events.
    if (
      event.type === 'invoice.paid' ||
      event.type === 'merchant.payment_received'
    ) {
      const invoiceId =
        (event.data?.invoice as { id?: string })?.id ??
        (event.data?.invoice_id as string | undefined)

      if (!invoiceId) {
        console.warn('[wave-webhook] invoice.paid received with no invoice ID')
        return new Response('OK', { status: 200 })
      }

      // Find the subscription record with this Wave invoice ID
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id, tier')
        .eq('wave_invoice_id', invoiceId)
        .single()

      if (!sub) {
        // Could be a manual/unrelated invoice — log and ignore
        console.warn(`[wave-webhook] No subscription found for wave_invoice_id=${invoiceId}`)
        return new Response('OK', { status: 200 })
      }

      // Activate subscription for 30 days
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + 30)

      await supabase.from('subscriptions').update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      }).eq('wave_invoice_id', invoiceId)

      await supabase.from('profiles').update({
        subscription_tier: sub.tier,
      }).eq('id', sub.user_id)

      // Unit purchases add 1 analysis credit instead of a recurring period
      if (sub.tier === 'unit') {
        await supabase.rpc('increment_analysis_credits', { p_user_id: sub.user_id, p_amount: 1 })
      }

      console.log(`[wave-webhook] Activated ${sub.tier} for user ${sub.user_id}`)
    }

    if (event.type === 'invoice.overdue') {
      const invoiceId =
        (event.data?.invoice as { id?: string })?.id ??
        (event.data?.invoice_id as string | undefined)

      if (!invoiceId) return new Response('OK', { status: 200 })

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('wave_invoice_id', invoiceId)
        .single()

      if (sub) {
        await supabase.from('subscriptions').update({ status: 'past_due' })
          .eq('wave_invoice_id', invoiceId)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[wave-webhook] Handler error:', msg)
    return new Response(`Webhook error: ${msg}`, { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
