import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { CaseStatusBadge } from '@/components/app/CaseStatusBadge'
import { formatDate } from '@/lib/utils'
import { PRIORITY_COLORS } from '@/lib/constants'
import type { Case, Profile, ForensicReview } from '@/types'
import { ExternalLink } from 'lucide-react'

interface CaseTableProps {
  cases: Array<Case & { client?: Profile; forensic_review?: ForensicReview | null }>
}

export function CaseTable({ cases }: CaseTableProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-16 text-center">
        <p className="text-sm font-medium">No cases found</p>
        <p className="mt-1 text-xs text-muted-foreground">Cases will appear here once submitted.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((c) => {
            const review = Array.isArray(c.forensic_review)
              ? c.forensic_review[0]
              : c.forensic_review
            const isComplete = c.status === 'completed' && review?.total_score !== undefined

            return (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {c.case_number}
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium leading-tight">
                      {c.client?.full_name ?? '—'}
                    </p>
                    {c.client?.company_name && (
                      <p className="text-[10px] text-muted-foreground">{c.client.company_name}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="max-w-[180px] truncate text-xs font-medium">{c.title}</p>
                </TableCell>
                <TableCell>
                  <CaseStatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  {isComplete ? (
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums bg-muted"
                    >
                      {review!.total_score}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[c.priority] ?? ''}`}>
                    {c.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/app/admin/cases/${c.id}`}
                    title="View case"
                    className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                  >
                    <ExternalLink className="size-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
