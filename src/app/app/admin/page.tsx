import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CaseTable } from '@/components/app/CaseTable'
import { FolderOpen, Clock, Cpu, CheckCircle2 } from 'lucide-react'
import type { Case, Profile, ForensicReview } from '@/types'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch recent 10 cases with client and review data
  const { data: cases } = await supabase
    .from('cases')
    .select(
      `*, profiles!cases_client_id_fkey(id, full_name, company_name, role), forensic_reviews(total_score, analysis_status, classification)`
    )
    .order('created_at', { ascending: false })
    .limit(10)

  // Status counts (all cases, no limit)
  const { data: allStatuses } = await supabase.from('cases').select('status, created_at')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let totalCases = 0
  let pendingCount = 0
  let analyzingCount = 0
  let completedThisMonth = 0

  for (const row of allStatuses ?? []) {
    totalCases++
    if (row.status === 'pending' || row.status === 'in_review') pendingCount++
    if (row.status === 'analyzing') analyzingCount++
    if (row.status === 'completed' && row.created_at >= startOfMonth) completedThisMonth++
  }

  const stats = [
    {
      label: 'Total Cases',
      value: totalCases,
      icon: FolderOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Pending / In Review',
      value: pendingCount,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Analyzing',
      value: analyzingCount,
      icon: Cpu,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Completed This Month',
      value: completedThisMonth,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ]

  const normalizedCases = (cases ?? []).map((c) => ({
    ...c,
    client: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
    forensic_review: Array.isArray(c.forensic_reviews) ? c.forensic_reviews[0] ?? null : c.forensic_reviews,
  })) as Array<Case & { client?: Profile; forensic_review?: ForensicReview | null }>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of all cases and platform activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <div className={`rounded-lg p-1.5 ${stat.bg}`}>
                  <Icon className={`size-4 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Recent cases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Cases</h2>
          <a
            href="/app/admin/cases"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </a>
        </div>
        <CaseTable cases={normalizedCases} />
      </div>
    </div>
  )
}
