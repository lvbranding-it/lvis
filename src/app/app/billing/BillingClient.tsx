'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Zap, Building2, Loader2, Mail, FileText } from 'lucide-react'
import type { SubscriptionTier } from '@/types'

interface BillingClientProps {
  currentTier: SubscriptionTier
  hasWaveCustomer: boolean
  pendingInvoiceUrl?: string
  highlightPlan?: string
}

export function BillingClient({ currentTier, pendingInvoiceUrl, highlightPlan }: BillingClientProps) {
  const [loadingCheckout, setLoadingCheckout] = useState<'unit' | 'pro' | 'enterprise' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const unitCardRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to highlighted plan when arriving via deep link (?plan=unit)
  useEffect(() => {
    if (highlightPlan === 'unit' && unitCardRef.current) {
      unitCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightPlan])

  async function handleCheckout(tier: 'unit' | 'pro' | 'enterprise') {
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
        {/* By Unit plan card — always visible unless already on a higher tier */}
        {currentTier !== 'pro' && currentTier !== 'enterprise' && (
          <div
            ref={unitCardRef}
            className={`relative rounded-xl bg-card p-5 shadow-sm space-y-4 transition-all ${
              highlightPlan === 'unit'
                ? 'border-2 border-amber-400 ring-2 ring-amber-400/20'
                : 'border-2 border-amber-400/30'
            }`}
          >
            {highlightPlan === 'unit' && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                  Recommended
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <FileText className="size-4 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold">By Unit</p>
                <p className="text-xs text-muted-foreground">$9.99 / report</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>1 analysis credit</li>
              <li>All priority levels</li>
              <li>Branded PDF report</li>
              <li>Credit never expires</li>
            </ul>
            <Button
              variant="outline"
              className="w-full border-amber-400/50 hover:border-amber-400"
              size="sm"
              onClick={() => handleCheckout('unit')}
              disabled={loadingCheckout !== null}
            >
              {loadingCheckout === 'unit' ? (
                <><Loader2 className="size-3.5 animate-spin" />Redirecting to invoice…</>
              ) : (
                <><ExternalLink className="size-3.5" />Buy 1 Report</>
              )}
            </Button>
          </div>
        )}

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

        {/* Unit tier: allow buying more credits; also show manage */}
        {currentTier === 'unit' && (
          <div className="relative rounded-xl border-2 border-amber-400/30 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <FileText className="size-4 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold">Buy More Credits</p>
                <p className="text-xs text-muted-foreground">$9.99 per report</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Each purchase adds 1 analysis credit that never expires.
            </p>
            <Button
              variant="outline"
              className="w-full border-amber-400/50 hover:border-amber-400"
              size="sm"
              onClick={() => handleCheckout('unit')}
              disabled={loadingCheckout !== null}
            >
              {loadingCheckout === 'unit' ? (
                <><Loader2 className="size-3.5 animate-spin" />Redirecting to invoice…</>
              ) : (
                <><ExternalLink className="size-3.5" />Buy 1 More Credit</>
              )}
            </Button>
          </div>
        )}

        {/* Manage subscription (pro/enterprise tiers) */}
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
