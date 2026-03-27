import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CaseTable } from '@/components/app/CaseTable'
import { FolderOpen, Clock, Cpu, CheckCircle2, Users, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'
import type { Case, Profile, ForensicReview } from '@/types'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const serviceClient = createServiceClient()

  // Fetch recent 10 cases
  const { data: cases } = await supabase
    .from('cases')
    .select(
      `*, profiles!cases_client_id_fkey(id, full_name, company_name, role), forensic_reviews(total_score, analysis_status, classification)`
    )
    .order('created_at', { ascending: false })
    .limit(10)

  // Case status counts
  const { data: allStatuses } = await supabase.from('cases').select('status, created_at')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let totalCases = 0, pendingCount = 0, analyzingCount = 0, completedThisMonth = 0
  for (const row of allStatuses ?? []) {
    totalCases++
    if (row.status === 'pending' || row.status === 'in_review') pendingCount++
    if (row.status === 'analyzing') analyzingCount++
    if (row.status === 'completed' && row.created_at >= startOfMonth) completedThisMonth++
  }

  // Tier distribution + revenue
  const { data: tierRows } = await serviceClient
    .from('profiles')
    .select('subscription_tier')
    .eq('role', 'client')

  let freeCount = 0, proCount = 0, enterpriseCount = 0
  for (const row of tierRows ?? []) {
    if (row.subscription_tier === 'pro') proCount++
    else if (row.subscription_tier === 'enterprise') enterpriseCount++
    else freeCount++
  }
  const totalClients = freeCount + proCount + enterpriseCount
  const estimatedRevenue = proCount * 49 + enterpriseCount * 199

  // Failed analyses count
  const { count: failedCount } = await serviceClient
    .from('forensic_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('analysis_status', 'failed')

  const casesStats = [
    { label: 'Total Cases',           value: totalCases,          icon: FolderOpen,      color: 'text-blue-500',   bg: 'bg-blue-500/10' },
    { label: 'Pending / In Review',   value: pendingCount,        icon: Clock,           color: 'text-amber-500',  bg: 'bg-amber-500/10' },
    { label: 'Analyzing',             value: analyzingCount,      icon: Cpu,             color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Completed This Month',  value: completedThisMonth,  icon: CheckCircle2,    color: 'text-green-500',  bg: 'bg-green-500/10' },
  ]

  const platformStats = [
    { label: 'Total Clients',         value: totalClients,        icon: Users,           color: 'text-blue-500',   bg: 'bg-blue-500/10' },
    { label: 'Pro Subscribers',       value: proCount,            icon: TrendingUp,      color: 'text-primary',    bg: 'bg-primary/10' },
    { label: 'Est. Monthly Revenue',  value: `$${estimatedRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Failed Analyses',       value: failedCount ?? 0,    icon: AlertTriangle,   color: 'text-red-500',    bg: 'bg-red-500/10' },
  ]

  const normalizedCases = (cases ?? []).map((c) => ({
    ...c,
    client: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
    forensic_review: Array.isArray(c.forensic_reviews) ? c.forensic_reviews[0] ?? null : c.forensic_reviews,
  })) as Array<Case & { client?: Profile; forensic_review?: ForensicReview | null }>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of all cases and platform activity.
        </p>
      </div>

      {/* Case stats */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cases</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {casesStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <div className={`rounded-lg p-1.5 ${stat.bg}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight">{stat.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Platform stats */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platform</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {platformStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <div className={`rounded-lg p-1.5 ${stat.bg}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Tier breakdown bar */}
        {totalClients > 0 && (
          <div className="mt-4 rounded-xl border bg-card p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Tier Distribution</p>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full">
              {freeCount > 0 && (
                <div
                  className="bg-muted-foreground/30"
                  style={{ width: `${(freeCount / totalClients) * 100}%` }}
                  title={`Free: ${freeCount}`}
                />
              )}
              {proCount > 0 && (
                <div
                  className="bg-primary"
                  style={{ width: `${(proCount / totalClients) * 100}%` }}
                  title={`Pro: ${proCount}`}
                />
              )}
              {enterpriseCount > 0 && (
                <div
                  className="bg-purple-500"
                  style={{ width: `${(enterpriseCount / totalClients) * 100}%` }}
                  title={`Enterprise: ${enterpriseCount}`}
                />
              )}
            </div>
            <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground/30 inline-block" /> Free ({freeCount})</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary inline-block" /> Pro ({proCount})</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-purple-500 inline-block" /> Enterprise ({enterpriseCount})</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent cases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Cases</h2>
          <a href="/app/admin/cases" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </a>
        </div>
        <CaseTable cases={normalizedCases} />
      </div>
    </div>
  )
}
