import Stripe from 'stripe'

// Lazily initialised so the build doesn't fail when STRIPE_SECRET_KEY is absent.
let _stripe: Stripe | null = null

function getStripeInstance(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}

// Proxy so callers can use `stripe.xxx` without change
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeInstance()[prop as keyof Stripe]
  },
})

export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
} as const
