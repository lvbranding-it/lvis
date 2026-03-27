import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
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
import { ClientTierControls } from '@/components/app/admin/ClientTierControls'
import type { SubscriptionTier } from '@/types'

interface ClientRow {
  id: string
  full_name: string | null
  company_name: string | null
  subscription_tier: SubscriptionTier
  analyses_override: number | null
  created_at: string
  cases: { count: number }[]
}

export default async function AdminClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const serviceClient = createServiceClient()

  const { data: clients } = await serviceClient
    .from('profiles')
    .select('id, full_name, company_name, subscription_tier, analyses_override, created_at, cases(count)')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  const rows = (clients ?? []) as ClientRow[]

  // Determine billing period start (1st of current month as fallback)
  const periodStart = (() => {
    const d = new Date(); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); return d.toISOString()
  })()

  // Batch-count analyses used this period for every client
  const usageMap: Record<string, number> = {}
  if (rows.length > 0) {
    // Fetch all cases for these clients
    const clientIds = rows.map((r) => r.id)
    const { data: allCases } = await serviceClient
      .from('cases')
      .select('id, client_id')
      .in('client_id', clientIds)

    if (allCases && allCases.length > 0) {
      const caseIds = allCases.map((c) => c.id)
      const { data: reviews } = await serviceClient
        .from('forensic_reviews')
        .select('id, case_id')
        .in('case_id', caseIds)
        .gte('created_at', periodStart)

      if (reviews) {
        // Build case→client map
        const caseClientMap: Record<string, string> = {}
        for (const c of allCases) caseClientMap[c.id] = c.client_id
        // Tally per client
        for (const r of reviews) {
          const cId = caseClientMap[r.case_id]
          if (cId) usageMap[cId] = (usageMap[cId] ?? 0) + 1
        }
      }
    }
  }

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
                <TableHead>Plan · Usage · Override</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((client) => {
                const caseCount = client.cases?.[0]?.count ?? 0
                const used = usageMap[client.id] ?? 0

                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/app/admin/clients/${client.id}`} className="group">
                        <p className="text-xs font-medium group-hover:text-primary transition-colors">{client.full_name ?? '—'}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{client.id.slice(0, 8)}…</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {client.company_name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {/* Tier selector + usage badge + override input */}
                      <ClientTierControls
                        userId={client.id}
                        currentTier={client.subscription_tier ?? 'free'}
                        currentOverride={client.analyses_override ?? null}
                        analysesUsed={used}
                      />
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
