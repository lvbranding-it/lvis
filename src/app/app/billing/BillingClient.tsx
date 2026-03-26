'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Zap, Building2, Loader2 } from 'lucide-react'
import type { SubscriptionTier } from '@/types'

interface BillingClientProps {
  currentTier: SubscriptionTier
  hasStripeCustomer: boolean
}

export function BillingClient({ currentTier, hasStripeCustomer }: BillingClientProps) {
  const [loadingCheckout, setLoadingCheckout] = useState<'pro' | 'enterprise' | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(tier: 'pro' | 'enterprise') {
    setLoadingCheckout(tier)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to start checkout.')
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoadingCheckout(null)
    }
  }

  async function handlePortal() {
    setLoadingPortal(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to open billing portal.')
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pro plan card */}
        {currentTier !== 'pro' && currentTier !== 'enterprise' && (
          <div className="relative rounded-xl border-2 border-primary/30 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Zap className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Pro</p>
                <p className="text-xs text-muted-foreground">$49 / month</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>10 analyses per month</li>
              <li>Branded PDF reports</li>
              <li>Priority support</li>
            </ul>
            <Button
              className="w-full"
              size="sm"
              onClick={() => handleCheckout('pro')}
              disabled={loadingCheckout !== null || loadingPortal}
            >
              {loadingCheckout === 'pro' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Redirecting…
                </>
              ) : (
                'Upgrade to Pro'
              )}
            </Button>
          </div>
        )}

        {/* Enterprise plan card */}
        {currentTier !== 'enterprise' && (
          <div className="relative rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Building2 className="size-4 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold">Enterprise</p>
                <p className="text-xs text-muted-foreground">$199 / month</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>Unlimited analyses</li>
              <li>Dedicated support</li>
              <li>Custom SLA</li>
            </ul>
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={() => handleCheckout('enterprise')}
              disabled={loadingCheckout !== null || loadingPortal}
            >
              {loadingCheckout === 'enterprise' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Redirecting…
                </>
              ) : (
                'Upgrade to Enterprise'
              )}
            </Button>
          </div>
        )}

        {/* Manage billing — shown when they have a paying subscription */}
        {(currentTier === 'pro' || currentTier === 'enterprise') && hasStripeCustomer && (
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-muted p-2">
                <CreditCard className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Billing Portal</p>
                <p className="text-xs text-muted-foreground">Manage invoices & payment methods</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={handlePortal}
              disabled={loadingCheckout !== null || loadingPortal}
            >
              {loadingPortal ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Opening portal…
                </>
              ) : (
                'Manage Billing'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
