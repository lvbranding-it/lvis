'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { TIER_LIMITS } from '@/lib/constants'

interface SubscriptionGateProps {
  children: React.ReactNode
  feature?: string
}

export function SubscriptionGate({ children, feature }: SubscriptionGateProps) {
  const { canAnalyze, tier, analysesUsedThisMonth, analysesLimit, loading } = useSubscription()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (canAnalyze) {
    return <>{children}</>
  }

  const isEnterprise = tier === 'enterprise'
  const limitDisplay = isEnterprise ? '∞' : analysesLimit

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Zap className="size-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold">
        {feature ? `${feature} requires an upgrade` : 'Analysis limit reached'}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        You&apos;ve used {analysesUsedThisMonth} of {limitDisplay} analyses on your{' '}
        <span className="font-medium capitalize">{tier}</span> plan this month. Upgrade to continue
        analyzing images.
      </p>

      <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row">
        <Link href="/app/billing" className={buttonVariants({ size: 'sm' }) + ' flex items-center gap-1.5'}>
          <Zap className="size-3.5" />
          Upgrade Plan
        </Link>
        <Link href="/app/billing" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          View Plans
        </Link>
      </div>

      {/* Mini tier comparison */}
      <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3 text-left">
        {(['pro', 'enterprise'] as const).map((t) => {
          const lim = TIER_LIMITS[t].analyses_per_month
          return (
            <div key={t} className="rounded-lg border bg-card p-3">
              <p className="text-xs font-semibold capitalize">{t}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lim === Infinity ? 'Unlimited' : lim} analyses / month
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
