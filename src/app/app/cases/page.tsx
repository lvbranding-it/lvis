import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CaseCard } from '@/components/app/CaseCard'
import { QuotaBanner } from '@/components/app/QuotaBanner'
import { buttonVariants } from '@/components/ui/button-variants'
import { FolderPlus, FolderOpen, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CASE_STATUS_LABELS, TIER_LIMITS } from '@/lib/constants'
import type { Case, CaseStatus } from '@/types'

const STATUS_FILTERS = [
  { value: 'all', label: 'All Cases' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
] as const

interface CasesPageProps {
  searchParams: Promise<{ status?: string; search?: string }>
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const params = await searchParams
  const statusFilter = params.status ?? 'all'
  const searchQuery = params.search ?? ''

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Admins see all cases; clients see their own
  let query = supabase
    .from('cases')
    .select('*, case_files(*), forensic_review:forensic_reviews(*)')
    .order('created_at', { ascending: false })

  if (profile?.role !== 'admin') {
    query = query.eq('client_id', user.id)
  }

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%`
    )
  }

  const { data: cases } = await query

  // Batch-generate signed thumbnail URLs for all displayable primary files.
  // Must use the service client — the case-images bucket has no storage RLS
  // policies, so the user-scoped anon client silently returns null for signed URLs.
  const serviceClient = createServiceClient()
  const DISPLAYABLE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
  const thumbnailUrls: Record<string, string> = {}

  if (cases && cases.length > 0) {
    const entries: { caseId: string; path: string }[] = []
    for (const c of cases) {
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

  // ── Quota computation ────────────────────────────────────────────────────
  const { data: profileQuota } = await supabase
    .from('profiles')
    .select('subscription_tier, analyses_override')
    .eq('id', user.id)
    .single()

  const { data: activeSub } = await supabase
    .from('subscriptions')
    .select('current_period_start')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const tier = (profileQuota?.subscription_tier ?? 'free') as keyof typeof TIER_LIMITS
  const tierLimit = TIER_LIMITS[tier]?.analyses_per_month ?? 1
  const effectiveLimit = profileQuota?.analyses_override ?? tierLimit

  const periodStart = activeSub?.current_period_start ?? (() => {
    const d = new Date(); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); return d.toISOString()
  })()

  // Count analyses this period
  const allCaseIds = (cases ?? []).map((c) => c.id)
  const { count: analysesUsed } = allCaseIds.length > 0
    ? await serviceClient
        .from('forensic_reviews')
        .select('id', { count: 'exact', head: true })
        .in('case_id', allCaseIds)
        .gte('created_at', periodStart)
    : { count: 0 }

  const usedCount = analysesUsed ?? 0
  const atLimit = effectiveLimit !== Infinity && usedCount >= effectiveLimit

  return (
    <div className="space-y-6">
      {/* Quota banner — shown when limit is reached */}
      {atLimit && effectiveLimit !== Infinity && (
        <QuotaBanner used={usedCount} limit={effectiveLimit} tier={tier} />
      )}

      {/* Sample report banner — free tier only */}
      {tier === 'free' && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <FileText className="size-4 shrink-0 text-blue-400" />
          <p className="flex-1 text-sm text-[#93C5FD]">
            Curious what a full forensic report looks like?{' '}
            <a
              href="/api/sample-report"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:text-white transition-colors"
            >
              View a sample report →
            </a>
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cases?.length ?? 0} case{cases?.length !== 1 ? 's' : ''}{' '}
            {statusFilter !== 'all' ? `· ${CASE_STATUS_LABELS[statusFilter] ?? statusFilter}` : ''}{' '}
            {effectiveLimit !== Infinity && (
              <span className={cn('font-medium', atLimit ? 'text-amber-600 dark:text-amber-400' : '')}>
                · {usedCount}/{effectiveLimit} analyses used
              </span>
            )}
          </p>
        </div>
        {atLimit ? (
          <span
            className={cn(buttonVariants({ size: 'sm' }), 'flex items-center gap-1.5 shrink-0 opacity-40 cursor-not-allowed pointer-events-none')}
            title="Monthly analysis limit reached. Upgrade to continue."
          >
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New Case</span>
          </span>
        ) : (
          <Link href="/app/cases/new" className={buttonVariants({ size: 'sm' }) + ' flex items-center gap-1.5 shrink-0'}>
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New Case</span>
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-[#1E293B] bg-[#0A1628] p-1">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/app/cases?status=${f.value}${searchQuery ? `&search=${searchQuery}` : ''}`}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              statusFilter === f.value
                ? 'bg-[#1E293B] text-white shadow-sm'
                : 'text-[#64748B] hover:text-white'
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Cases grid — 4 columns on large screens */}
      {cases && cases.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cases.map((c) => (
            <CaseCard key={c.id} case={c as Case} thumbnailUrl={thumbnailUrls[c.id]} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#1E293B] bg-[#0A1628]/50 py-20 text-center">
          <FolderOpen className="mb-3 size-10 text-[#334155]" />
          <h3 className="text-sm font-medium text-white">
            {statusFilter !== 'all'
              ? `No ${CASE_STATUS_LABELS[statusFilter] ?? statusFilter} cases`
              : 'No cases yet'}
          </h3>
          <p className="mt-1 text-xs text-[#64748B]">
            {statusFilter !== 'all'
              ? 'Try a different filter or submit a new case.'
              : 'Submit your first image for forensic analysis.'}
          </p>
          <Link href="/app/cases/new" className={buttonVariants({ size: 'sm' }) + ' mt-4'}>
            Submit New Case
          </Link>
        </div>
      )}
    </div>
  )
}
