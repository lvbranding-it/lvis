'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Zap, Building2, Loader2, Mail } from 'lucide-react'
import type { SubscriptionTier } from '@/types'

interface BillingClientProps {
  currentTier: SubscriptionTier
  hasWaveCustomer: boolean
  pendingInvoiceUrl?: string
}

export function BillingClient({ currentTier, pendingInvoiceUrl }: BillingClientProps) {
  const [loadingCheckout, setLoadingCheckout] = useState<'pro' | 'enterprise' | null>(null)
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
        // Redirect to Wave invoice payment page
        window.location.href = data.url
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoadingCheckout(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {pendingInvoiceUrl && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400">
          Your invoice is awaiting payment. Complete your payment to activate your plan.
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
              disabled={loadingCheckout !== null}
            >
              {loadingCheckout === 'pro' ? (
                <><Loader2 className="size-3.5 animate-spin" />Redirecting to invoice…</>
              ) : (
                <><ExternalLink className="size-3.5" />Upgrade to Pro</>
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
              disabled={loadingCheckout !== null}
            >
              {loadingCheckout === 'enterprise' ? (
                <><Loader2 className="size-3.5 animate-spin" />Redirecting to invoice…</>
              ) : (
                <><ExternalLink className="size-3.5" />Upgrade to Enterprise</>
              )}
            </Button>
          </div>
        )}

        {/* Manage subscription (paid tiers) */}
        {(currentTier === 'pro' || currentTier === 'enterprise') && (
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-muted p-2">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Manage Subscription</p>
                <p className="text-xs text-muted-foreground">Renewals, cancellations & invoices</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              To modify or cancel your subscription, contact us at{' '}
              <a href="mailto:support@thelvis.com" className="underline hover:text-foreground">
                support@thelvis.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
