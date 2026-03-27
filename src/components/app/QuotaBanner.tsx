import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface QuotaBannerProps {
  used: number
  limit: number
  tier: string
}

export function QuotaBanner({ used, limit, tier }: QuotaBannerProps) {
  const atLimit = used >= limit
  if (!atLimit) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          You&apos;ve used all <strong>{used} of {limit}</strong> analyse{limit !== 1 ? 's' : ''} on the{' '}
          <span className="font-semibold capitalize">{tier}</span> plan this month.
        </p>
      </div>
      {tier === 'free' && (
        <Link
          href="/app/billing"
          className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          Upgrade to Pro →
        </Link>
      )}
    </div>
  )
}
