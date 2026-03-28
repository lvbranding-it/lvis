import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CaseTable } from '@/components/app/CaseTable'
import { CASE_STATUS_LABELS } from '@/lib/constants'
import type { Case, Profile, ForensicReview, CaseStatus } from '@/types'

interface Props {
  searchParams: Promise<{ status?: string; q?: string; client?: string }>
}

const ALL_STATUSES = Object.keys(CASE_STATUS_LABELS) as CaseStatus[]

export default async function AdminCasesPage({ searchParams }: Props) {
  const { status, q, client: clientFilter } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let query = supabase
    .from('cases')
    .select(
      `*, profiles!cases_client_id_fkey(id, full_name, company_name, role), forensic_reviews(id, total_score, analysis_status, classification, confidence_level, analyzed_at, created_at)`
    )
    .order('created_at', { ascending: false })

  if (status && ALL_STATUSES.includes(status as CaseStatus)) {
    query = query.eq('status', status)
  }
  if (q?.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,case_number.ilike.%${q.trim()}%`)
  }
  if (clientFilter?.trim()) {
    query = query.eq('client_id', clientFilter.trim())
  }

  const { data: cases } = await query

  const normalizedCases = (cases ?? []).map((c) => ({
    ...c,
    client: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
    forensic_review: Array.isArray(c.forensic_reviews) ? c.forensic_reviews[0] ?? null : c.forensic_reviews,
  })) as Array<Case & { client?: Profile; forensic_review?: ForensicReview | null }>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Cases</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {normalizedCases.length} case{normalizedCases.length !== 1 ? 's' : ''}
            {clientFilter ? ` · client filter active` : ''}
            {status ? ` · "${CASE_STATUS_LABELS[status as CaseStatus]}"` : ''}
            {q ? ` · "${q}"` : ''}
          </p>
        </div>

        {/* Filters */}
        <form method="GET" className="flex flex-wrap gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search title or case #…"
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-44"
          />
          <select
            name="status"
            defaultValue={status ?? ''}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{CASE_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Filter
          </button>
          {(status || q) && (
            <a
              href="/app/admin/cases"
              className="rounded-lg border border-input px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </a>
          )}
        </form>
      </div>

      <CaseTable cases={normalizedCases} />
    </div>
  )
}
