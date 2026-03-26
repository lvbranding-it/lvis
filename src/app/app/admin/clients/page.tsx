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
import { formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'

interface ClientRow {
  id: string
  full_name: string | null
  company_name: string | null
  subscription_tier: string
  created_at: string
  cases: { count: number }[]
}

const TIER_BADGE: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

export default async function AdminClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('profiles')
    .select('*, cases(count)')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  const rows = (clients ?? []) as ClientRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} registered client{rows.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-16 text-center">
          <Users className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">No clients yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clients will appear here once they sign up.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((client) => {
                const caseCount = client.cases?.[0]?.count ?? 0
                const tier = client.subscription_tier ?? 'free'
                const badgeClass = TIER_BADGE[tier] ?? TIER_BADGE.free

                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <p className="text-xs font-medium">{client.full_name ?? '—'}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{client.id.slice(0, 8)}…</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {client.company_name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
                      >
                        {tier}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs tabular-nums">{caseCount}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(client.created_at)}
                      </span>
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
