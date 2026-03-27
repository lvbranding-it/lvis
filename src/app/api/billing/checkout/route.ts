import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { waveCreateCustomer, waveCreateInvoice } from '@/lib/wave/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tier } = body as { tier: 'pro' | 'enterprise' }

  if (!tier || !['pro', 'enterprise'].includes(tier)) {
    return Response.json({ error: 'Invalid tier. Must be "pro" or "enterprise".' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Fetch profile for Wave customer ID + name
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('wave_customer_id, full_name')
    .eq('id', user.id)
    .single()

  let waveCustomerId = profile?.wave_customer_id ?? null

  // Create Wave customer if this is their first time
  if (!waveCustomerId) {
    try {
      waveCustomerId = await waveCreateCustomer(
        user.email ?? '',
        profile?.full_name ?? user.email ?? 'LVIS Customer'
      )
      await serviceClient
        .from('profiles')
        .update({ wave_customer_id: waveCustomerId })
        .eq('id', user.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return Response.json({ error: `Failed to create Wave customer: ${msg}` }, { status: 500 })
    }
  }

  // Create and approve a Wave invoice
  let invoiceId: string
  let viewUrl: string
  try {
    ;({ invoiceId, viewUrl } = await waveCreateInvoice(waveCustomerId, tier))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: `Failed to create Wave invoice: ${msg}` }, { status: 500 })
  }

  // Store the pending invoice so we can match it when the webhook fires
  await serviceClient.from('subscriptions').upsert(
    {
      user_id: user.id,
      tier,
      status: 'pending',
      wave_customer_id: waveCustomerId,
      wave_invoice_id: invoiceId,
      cancel_at_period_end: false,
    },
    { onConflict: 'user_id' }
  )

  // Return the Wave invoice URL — frontend redirects the customer there to pay
  return Response.json({ url: viewUrl })
}
