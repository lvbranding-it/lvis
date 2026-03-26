import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tier } = body as { tier: 'pro' | 'enterprise' }

  if (!tier || !['pro', 'enterprise'].includes(tier)) {
    return Response.json({ error: 'Invalid tier. Must be "pro" or "enterprise".' }, { status: 400 })
  }

  const priceKey = tier === 'pro' ? 'pro_monthly' : 'enterprise_monthly'
  const priceId = STRIPE_PRICES[priceKey]

  if (!priceId) {
    return Response.json({ error: 'Price not configured for this tier.' }, { status: 500 })
  }

  // Get profile for stripe_customer_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return Response.json({ error: 'Failed to load profile.' }, { status: 500 })
  }

  let stripeCustomerId = profile?.stripe_customer_id

  // Create Stripe customer if none exists
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.full_name ?? undefined,
      metadata: { userId: user.id },
    })
    stripeCustomerId = customer.id

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: stripeCustomerId,
    success_url: `${appUrl}/app/billing?success=true`,
    cancel_url: `${appUrl}/app/billing?canceled=true`,
    metadata: { userId: user.id, tier },
  })

  return Response.json({ url: session.url })
}
