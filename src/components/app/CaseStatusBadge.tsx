import { cn } from '@/lib/utils'
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS } from '@/lib/constants'
import type { CaseStatus } from '@/types'

interface CaseStatusBadgeProps {
  status: CaseStatus
  className?: string
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const label = CASE_STATUS_LABELS[status] ?? status
  const colorClass = CASE_STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
