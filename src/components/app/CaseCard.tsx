import Link from 'next/link'
import Image from 'next/image'
import { cn, formatDate } from '@/lib/utils'
import { PRIORITY_COLORS, SCORE_BANDS } from '@/lib/constants'
import { CaseStatusBadge } from '@/components/app/CaseStatusBadge'
import type { Case } from '@/types'
import { AlertTriangle, Clock, FileImage } from 'lucide-react'

interface CaseCardProps {
  case: Case
  className?: string
  thumbnailUrl?: string
}

function getScoreBand(score: number) {
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ?? SCORE_BANDS[0]
}

function ScoreCircle({ score }: { score: number }) {
  const band = getScoreBand(score)
  const colorMap: Record<string, string> = {
    'score-authentic': '#22c55e',
    'score-edited': '#84cc16',
    'score-retouched': '#f59e0b',
    'score-manipulated': '#f97316',
    'score-synthetic': '#ef4444',
  }
  const hex = colorMap[band.color] ?? '#6b7280'

  // SVG circle progress
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-muted/40"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={hex}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative z-10 font-mono text-xs font-bold leading-none" style={{ color: hex }}>
        {score}
      </span>
    </div>
  )
}

export function CaseCard({ case: c, className, thumbnailUrl }: CaseCardProps) {
  const primaryFile = c.case_files?.[0]
  const review = c.forensic_review ?? null
  const score =
    review && 'total_score' in review ? (review as { total_score: number }).total_score : null
  const isComplete = c.status === 'completed'
  const hasScore = isComplete && score !== null

  const priorityColor = PRIORITY_COLORS[c.priority] ?? 'text-foreground'

  return (
    <Link
      href={`/app/cases/${c.id}`}
      className={cn(
        'group flex flex-col rounded-xl border border-[#1E293B] bg-[#0F1E33] transition-all duration-200',
        'hover:scale-[1.01] hover:border-blue-500/40 hover:shadow-lg hover:shadow-black/30',
        className
      )}
    >
      {/* Thumbnail — 16:9 aspect ratio (shorter for 4-column grid) */}
      {thumbnailUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-[#0A1628]">
          <Image
            src={thumbnailUrl}
            alt={primaryFile?.file_name ?? 'Case specimen'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : primaryFile ? (
        <div className="flex aspect-video items-center justify-center rounded-t-xl bg-[#0A1628]">
          <div className="flex flex-col items-center gap-1 text-[#334155]">
            <FileImage className="size-6" />
            <span className="text-[10px] font-mono truncate max-w-[80%]">{primaryFile.file_name}</span>
          </div>
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-t-xl bg-[#0A1628]">
          <div className="flex flex-col items-center gap-1 text-[#334155]">
            <AlertTriangle className="size-6" />
            <span className="text-[10px]">No image</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] text-[#475569] tracking-wider uppercase">
              {c.case_number}
            </p>
            <h3 className="mt-0.5 line-clamp-1 text-xs font-semibold leading-snug text-white">
              {c.title}
            </h3>
          </div>
          {hasScore && <ScoreCircle score={score!} />}
        </div>

        <div className="flex items-center justify-between gap-2">
          <CaseStatusBadge status={c.status} />
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide', priorityColor)}>
            {c.priority}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
          <Clock className="size-3" />
          <span>{formatDate(c.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
