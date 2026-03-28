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
import { Users, ExternalLink } from 'lucide-react'
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

// Tier monthly / per-use rates for invested estimate
const TIER_RATE: Record<SubscriptionTier, number> = {
  free:       0,
  unit:       9.99, // per analysis
  pro:        49,
  enterprise: 199,
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents)
}

function estimateInvested(tier: SubscriptionTier, totalAnalyses: number, createdAt: string): string {
  if (tier === 'free') return '$0'
  if (tier === 'unit') return formatUSD(totalAnalyses * 9.99)
  // Pro / Enterprise: months since account created × monthly rate
  const months = Math.max(1, Math.round(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  ))
  return formatUSD(months * TIER_RATE[tier])
}

export default async function AdminClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const serviceClient = createServiceClient()

  // Fetch all clients
  const { data: clients } = await serviceClient
    .from('profiles')
    .select('id, full_name, company_name, subscription_tier, analyses_override, created_at, cases(count)')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  const rows = (clients ?? []) as ClientRow[]

  // ── Last active from auth.users ──────────────────────────────────────────────
  const lastActiveMap: Record<string, string | null> = {}
  if (rows.length > 0) {
    const { data: { users: authUsers } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
    const clientIds = new Set(rows.map(r => r.id))
    for (const au of authUsers ?? []) {
      if (clientIds.has(au.id)) {
        lastActiveMap[au.id] = au.last_sign_in_at ?? null
      }
    }
  }

  // ── Total analyses (all time) per client ────────────────────────────────────
  const totalAnalysesMap: Record<string, number> = {}
  const monthAnalysesMap: Record<string, number> = {}

  if (rows.length > 0) {
    const clientIds = rows.map(r => r.id)
    const { data: allCases } = await serviceClient
      .from('cases')
      .select('id, client_id')
      .in('client_id', clientIds)

    if (allCases && allCases.length > 0) {
      const caseIds = allCases.map(c => c.id)
      const caseClientMap: Record<string, string> = {}
      for (const c of allCases) caseClientMap[c.id] = c.client_id

      // All-time analyses
      const { data: allReviews } = await serviceClient
        .from('forensic_reviews')
        .select('id, case_id')
        .in('case_id', caseIds)
        .eq('analysis_status', 'complete')

      for (const r of allReviews ?? []) {
        const cId = caseClientMap[r.case_id]
        if (cId) totalAnalysesMap[cId] = (totalAnalysesMap[cId] ?? 0) + 1
      }

      // This month
      const periodStart = (() => {
        const d = new Date(); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); return d.toISOString()
      })()
      const { data: monthReviews } = await serviceClient
        .from('forensic_reviews')
        .select('id, case_id')
        .in('case_id', caseIds)
        .gte('created_at', periodStart)

      for (const r of monthReviews ?? []) {
        const cId = caseClientMap[r.case_id]
        if (cId) monthAnalysesMap[cId] = (monthAnalysesMap[cId] ?? 0) + 1
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
                <TableHead>Client</TableHead>
                <TableHead>Plan · Usage · Override</TableHead>
                <TableHead className="text-right">Total Analyses</TableHead>
                <TableHead className="text-right">Est. Invested</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-center">Cases</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((client) => {
                const caseCount = client.cases?.[0]?.count ?? 0
                const usedMonth = monthAnalysesMap[client.id] ?? 0
                const totalAnalyses = totalAnalysesMap[client.id] ?? 0
                const lastActive = lastActiveMap[client.id]
                const invested = estimateInvested(client.subscription_tier, totalAnalyses, client.created_at)

                return (
                  <TableRow key={client.id}>
                    {/* Client name + company */}
                    <TableCell>
                      <Link href={`/app/admin/clients/${client.id}`} className="group">
                        <p className="text-xs font-medium group-hover:text-primary transition-colors">
                          {client.full_name ?? '—'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {client.company_name ?? 'No company'}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 font-mono">
                          {client.id.slice(0, 8)}…
                        </p>
                      </Link>
                    </TableCell>

                    {/* Tier selector + monthly usage + override */}
                    <TableCell>
                      <ClientTierControls
                        userId={client.id}
                        currentTier={client.subscription_tier ?? 'free'}
                        currentOverride={client.analyses_override ?? null}
                        analysesUsed={usedMonth}
                      />
                    </TableCell>

                    {/* Total analyses all time */}
                    <TableCell className="text-right">
                      <span className="text-xs tabular-nums font-medium">{totalAnalyses}</span>
                      {usedMonth > 0 && (
                        <p className="text-[10px] text-muted-foreground">{usedMonth} this month</p>
                      )}
                    </TableCell>

                    {/* Estimated invested */}
                    <TableCell className="text-right">
                      <span className="text-xs tabular-nums text-emerald-400 font-medium">
                        {invested}
                      </span>
                      {client.subscription_tier !== 'free' && client.subscription_tier !== 'unit' && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatUSD(TIER_RATE[client.subscription_tier])}/mo est.
                        </p>
                      )}
                    </TableCell>

                    {/* Last active */}
                    <TableCell>
                      {lastActive ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(lastActive)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">Never</span>
                      )}
                    </TableCell>

                    {/* Joined */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(client.created_at)}
                      </span>
                    </TableCell>

                    {/* Cases + chain of custody */}
                    <TableCell className="text-center">
                      <Link
                        href={`/app/cases?client=${client.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        title="View cases & chain of custody"
                      >
                        {caseCount} <ExternalLink className="size-3" />
                      </Link>
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
