import Link from 'next/link'
import { AlertTriangle, FileText, Zap } from 'lucide-react'

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
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/app/billing?plan=unit"
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-900/30"
          >
            <FileText className="size-3" />
            Buy 1 Report — $9.99
          </Link>
          <Link
            href="/app/billing"
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            <Zap className="size-3" />
            Upgrade to Pro →
          </Link>
        </div>
      )}
    </div>
  )
}
