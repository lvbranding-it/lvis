import { createClient } from '@/lib/supabase/server'

// Wave does not have a self-service billing portal equivalent to Stripe's.
// Returns a message directing the customer to contact support, or provides the
// Wave invoice URL stored at checkout time so they can view / re-pay.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('wave_invoice_id, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub?.wave_invoice_id) {
    return Response.json(
      { message: 'No active subscription found. Upgrade from the Billing page.' },
      { status: 200 }
    )
  }

  return Response.json({
    message: 'To manage your subscription or request a cancellation, please email support@thelvis.com.',
  })
}
