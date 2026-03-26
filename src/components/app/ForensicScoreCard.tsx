'use client'

import { getScoreColorClass, getScoreBand } from '@/lib/scoring/authenticity-index'
import { cn } from '@/lib/utils'

interface ForensicScoreCardProps {
  totalScore: number
  classification: string
  confidence: 'low' | 'medium' | 'high'
  categoryScores: {
    provenance: number
    file_integrity: number
    visual_consistency: number
    manipulation: number
    synthetic_risk: number
  }
  analyzedAt: string
  caseNumber: string
  compact?: boolean
}

const SCORE_COLOR_MAP: Record<string, string> = {
  'score-authentic': '#22c55e',
  'score-edited': '#84cc16',
  'score-retouched': '#f59e0b',
  'score-manipulated': '#f97316',
  'score-synthetic': '#ef4444',
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const CATEGORIES = [
  { key: 'provenance' as const, label: 'Provenance Analysis', weight: 25 },
  { key: 'file_integrity' as const, label: 'File Integrity', weight: 20 },
  { key: 'visual_consistency' as const, label: 'Visual Consistency', weight: 20 },
  { key: 'manipulation' as const, label: 'Manipulation Detection', weight: 20 },
  { key: 'synthetic_risk' as const, label: 'Synthetic Risk', weight: 15 },
]

function ScoreGauge({
  score,
  size = 200,
}: {
  score: number
  size?: number
}) {
  const band = getScoreBand(score)
  const hex = SCORE_COLOR_MAP[band.color] ?? '#6b7280'

  // Arc parameters — full circle
  const cx = size / 2
  const cy = size / 2
  const radius = (size - 24) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG arc gauge */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 absolute inset-0"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/30"
        />
        {/* Score arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={hex}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-0.5">
          <span
            className="text-5xl font-black leading-none tabular-nums"
            style={{ color: hex }}
          >
            {Math.round(score)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">/100</span>
        </div>
      </div>
    </div>
  )
}

function CategoryRow({
  label,
  weight,
  score,
}: {
  label: string
  weight: number
  score: number
}) {
  const band = getScoreBand(score)
  const hex = SCORE_COLOR_MAP[band.color] ?? '#6b7280'
  const colorClass = getScoreColorClass(score)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-foreground truncate">{label}</span>
          <span className="shrink-0 rounded px-1 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
            {weight}%
          </span>
        </div>
        <span className={cn('font-mono text-xs font-bold tabular-nums shrink-0', colorClass)}>
          {Math.round(score)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: hex }}
        />
      </div>
    </div>
  )
}

export function ForensicScoreCard({
  totalScore,
  classification,
  confidence,
  categoryScores,
  analyzedAt,
  caseNumber,
  compact = false,
}: ForensicScoreCardProps) {
  const colorClass = getScoreColorClass(totalScore)

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(analyzedAt))

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4">
        <ScoreGauge score={totalScore} size={120} />
        <div className="text-center">
          <p className={cn('text-sm font-bold leading-snug', colorClass)}>{classification}</p>
          <span
            className={cn(
              'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              CONFIDENCE_STYLES[confidence]
            )}
          >
            {confidence} confidence
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Forensic Assessment
          </p>
          <h2 className="mt-0.5 text-sm font-bold tracking-tight text-foreground">
            LV Authenticity Index™
          </h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{caseNumber}</span>
      </div>

      {/* Score section */}
      <div className="flex flex-col items-center gap-3 px-5 py-6">
        <ScoreGauge score={totalScore} size={200} />

        {/* Classification */}
        <div className="text-center">
          <p className={cn('text-base font-bold leading-snug', colorClass)}>
            {classification}
          </p>
          <span
            className={cn(
              'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
              CONFIDENCE_STYLES[confidence]
            )}
          >
            {confidence} confidence
          </span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="border-t px-5 py-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Category Breakdown
        </p>
        {CATEGORIES.map((cat) => (
          <CategoryRow
            key={cat.key}
            label={cat.label}
            weight={cat.weight}
            score={categoryScores[cat.key]}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3">
        <span className="text-[10px] text-muted-foreground">
          Analyzed: {formattedDate}
        </span>
        <a
          href="/disclaimer"
          className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Disclaimer
        </a>
      </div>
    </div>
  )
}
