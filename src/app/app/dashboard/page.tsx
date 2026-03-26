import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CaseCard } from '@/components/app/CaseCard'
import { buttonVariants } from '@/components/ui/button-variants'
import { FolderPlus, FolderOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Case, CaseStatus } from '@/types'

interface StatusCount {
  status: CaseStatus
  count: number
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Count cases by status
  const { data: statusCounts } = await supabase
    .from('cases')
    .select('status')
    .eq('client_id', user.id)

  const counts: Record<string, number> = {}
  if (statusCounts) {
    for (const row of statusCounts) {
      counts[row.status] = (counts[row.status] ?? 0) + 1
    }
  }
  const totalCases = statusCounts?.length ?? 0
  const activeCases = (counts['pending'] ?? 0) + (counts['in_review'] ?? 0) + (counts['analyzing'] ?? 0)
  const completedCases = counts['completed'] ?? 0
  const pendingCases = counts['pending'] ?? 0

  // Recent 5 cases
  const { data: recentCases } = await supabase
    .from('cases')
    .select('*, case_files(*), forensic_review:forensic_reviews(*)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Batch-generate signed thumbnail URLs for all displayable primary files.
  // Must use the service client — the case-images bucket has no storage RLS
  // policies, so the user-scoped anon client silently returns null for signed URLs.
  const serviceClient = createServiceClient()
  const DISPLAYABLE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
  const thumbnailUrls: Record<string, string> = {}

  if (recentCases && recentCases.length > 0) {
    const entries: { caseId: string; path: string }[] = []
    for (const c of recentCases) {
      const primaryFile = c.case_files?.[0]
      if (primaryFile?.storage_path && DISPLAYABLE_TYPES.has(primaryFile.file_type)) {
        entries.push({ caseId: c.id, path: primaryFile.storage_path })
      }
    }
    if (entries.length > 0) {
      const { data: signedData } = await serviceClient.storage
        .from('case-images')
        .createSignedUrls(entries.map((e) => e.path), 3600)
      if (signedData) {
        for (let i = 0; i < entries.length; i++) {
          if (signedData[i]?.signedUrl) {
            thumbnailUrls[entries[i].caseId] = signedData[i].signedUrl
          }
        }
      }
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const stats = [
    {
      label: 'Total Cases',
      value: totalCases,
      icon: FolderOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Active Cases',
      value: activeCases,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Completed',
      value: completedCases,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Pending Review',
      value: pendingCases,
      icon: AlertCircle,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s an overview of your image integrity cases.
          </p>
        </div>
        <Link href="/app/cases/new" className={buttonVariants({ size: 'sm' }) + ' flex items-center gap-1.5'}>
          <FolderPlus className="size-4" />
          New Case
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
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
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Cases</h2>
          {totalCases > 0 && (
            <Link
              href="/app/cases"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          )}
        </div>

        {recentCases && recentCases.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentCases.map((c) => (
              <CaseCard key={c.id} case={c as Case} thumbnailUrl={thumbnailUrls[c.id]} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-16 text-center">
            <FolderOpen className="mb-3 size-10 text-muted-foreground/40" />
            <h3 className="text-sm font-medium">No cases yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Submit your first image for forensic analysis.
            </p>
            <Link href="/app/cases/new" className={buttonVariants({ size: 'sm' }) + ' mt-4'}>
              Submit Your First Case
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
