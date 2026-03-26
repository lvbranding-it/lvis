import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.arrayBuffer()
  const rawBody = Buffer.from(body)
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier as 'pro' | 'enterprise' | undefined

        if (!userId || !tier || !session.subscription) break

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id

        // Fetch subscription details
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = stripeSub.items.data[0]?.price.id ?? null

        const firstItem = stripeSub.items.data[0]
        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            tier,
            status: 'active',
            current_period_start: firstItem?.current_period_start
              ? new Date(firstItem.current_period_start * 1000).toISOString()
              : null,
            current_period_end: firstItem?.current_period_end
              ? new Date(firstItem.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: stripeSub.cancel_at_period_end,
          },
          { onConflict: 'user_id' }
        )

        await supabase
          .from('profiles')
          .update({ subscription_tier: tier })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        const item = sub.items.data[0]
        await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            current_period_start: item?.current_period_start
              ? new Date(item.current_period_start * 1000).toISOString()
              : null,
            current_period_end: item?.current_period_end
              ? new Date(item.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq('user_id', profile.id)

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('user_id', profile.id)

        await supabase
          .from('profiles')
          .update({ subscription_tier: 'free' })
          .eq('id', profile.id)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

        if (!customerId) break

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('user_id', profile.id)

        break
      }

      default:
        // Unhandled event — return 200 to acknowledge receipt
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook handler error for ${event.type}:`, message)
    return new Response(`Webhook handler error: ${message}`, { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
