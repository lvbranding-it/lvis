/**
 * Monthly subscription renewal cron — runs on the 1st of every month.
 * Vercel invokes this via the schedule defined in vercel.json and
 * attaches `Authorization: Bearer <CRON_SECRET>` automatically.
 *
 * For each active pro/enterprise subscription:
 *  1. Creates a new Wave invoice for the upcoming period
 *  2. Sets subscription status → 'pending' with new period dates
 *  3. Customer receives the Wave invoice email and pays
 *  4. The existing /api/webhooks/wave handler reactivates them on payment
 */

import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { waveCreateInvoice } from '@/lib/wave/client'

export const runtime = 'nodejs'
export const maxDuration = 60 // seconds — allow time to process many subscribers

export async function GET(request: NextRequest) {
  // ── Auth: verify Vercel cron secret ───────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // ── Fetch all active paid subscriptions ───────────────────────────────────
  const { data: subscriptions, error: fetchError } = await serviceClient
    .from('subscriptions')
    .select('id, user_id, tier, wave_customer_id, current_period_end')
    .eq('status', 'active')
    .in('tier', ['pro', 'enterprise'])

  if (fetchError) {
    console.error('[renew-subscriptions] fetch error:', fetchError.message)
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return Response.json({ message: 'No active subscriptions to renew.', renewed: 0, failed: 0 })
  }

  // ── New billing period: today → today + 30 days ───────────────────────────
  const now = new Date()
  const periodStart = now.toISOString()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const results: { userId: string; status: 'ok' | 'failed'; error?: string }[] = []

  for (const sub of subscriptions) {
    const waveCustomerId = sub.wave_customer_id
    if (!waveCustomerId) {
      results.push({ userId: sub.user_id, status: 'failed', error: 'No wave_customer_id on record' })
      continue
    }

    const tier = sub.tier as 'pro' | 'enterprise'

    try {
      // Create and approve the renewal invoice in Wave
      const { invoiceId, viewUrl } = await waveCreateInvoice(waveCustomerId, tier)

      // Move subscription to pending — reactivated by webhook on payment
      const { error: updateError } = await serviceClient
        .from('subscriptions')
        .update({
          status: 'pending',
          wave_invoice_id: invoiceId,
          current_period_start: periodStart,
          current_period_end: periodEnd,
        })
        .eq('id', sub.id)

      if (updateError) throw new Error(updateError.message)

      console.log(`[renew-subscriptions] ✓ ${sub.user_id} (${tier}) — invoice ${invoiceId}`)
      results.push({ userId: sub.user_id, status: 'ok' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[renew-subscriptions] ✗ ${sub.user_id}: ${msg}`)
      results.push({ userId: sub.user_id, status: 'failed', error: msg })
    }
  }

  const renewed = results.filter((r) => r.status === 'ok').length
  const failed  = results.filter((r) => r.status === 'failed').length

  console.log(`[renew-subscriptions] Done — ${renewed} renewed, ${failed} failed`)
  return Response.json({ renewed, failed, results })
}
