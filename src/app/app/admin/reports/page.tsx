import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { FileText, Download } from 'lucide-react'

interface ReportRow {
  id: string
  storage_path: string | null
  version: number
  delivered_at: string | null
  created_at: string
  cases: {
    case_number: string
    title: string
    profiles: { full_name: string | null } | null
  } | null
}

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: reports } = await supabase
    .from('reports')
    .select('*, cases(case_number, title, profiles!cases_client_id_fkey(full_name))')
    .order('created_at', { ascending: false })

  const rows = (reports ?? []) as ReportRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} report{rows.length !== 1 ? 's' : ''} generated.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-16 text-center">
          <FileText className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">No reports yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Reports will appear here once cases are completed and analyzed.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>PDF Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((report) => {
                const isReady = !!report.storage_path
                const clientName = report.cases?.profiles?.full_name ?? '—'

                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {report.cases?.case_number ?? '—'}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[180px] truncate text-xs font-medium">
                        {report.cases?.title ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{clientName}</span>
                    </TableCell>
                    <TableCell>
                      {isReady ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <span>✓</span> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(report.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isReady && report.storage_path ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Download report"
                          onClick={undefined}
                          // Storage URL is resolved server-side; link is rendered as anchor
                        >
                          <a
                            href={`/api/reports/${report.id}/download`}
                            download
                            className="flex items-center justify-center"
                          >
                            <Download className="size-3.5" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
