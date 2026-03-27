import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types'

const VALID_TIERS: SubscriptionTier[] = ['free', 'pro', 'enterprise']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  // Verify the requesting user is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { tier } = body as { tier: SubscriptionTier }

  if (!tier || !VALID_TIERS.includes(tier)) {
    return Response.json({ error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Update profile subscription_tier
  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId)

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  // Upsert subscriptions record — set period dates for paid tiers
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await serviceClient.from('subscriptions').upsert(
    {
      user_id: userId,
      tier,
      status: tier === 'free' ? 'canceled' : 'active',
      current_period_start: tier !== 'free' ? now.toISOString() : null,
      current_period_end: tier !== 'free' ? periodEnd.toISOString() : null,
      cancel_at_period_end: false,
    },
    { onConflict: 'user_id' }
  )

  return Response.json({ ok: true, tier })
}
