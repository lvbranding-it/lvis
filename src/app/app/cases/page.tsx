import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CaseCard } from '@/components/app/CaseCard'
import { buttonVariants } from '@/components/ui/button-variants'
import { FolderPlus, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CASE_STATUS_LABELS } from '@/lib/constants'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cases?.length ?? 0} case{cases?.length !== 1 ? 's' : ''}{' '}
            {statusFilter !== 'all' ? `· ${CASE_STATUS_LABELS[statusFilter] ?? statusFilter}` : ''}
          </p>
        </div>
        <Link href="/app/cases/new" className={buttonVariants({ size: 'sm' }) + ' flex items-center gap-1.5 shrink-0'}>
          <FolderPlus className="size-4" />
          <span className="hidden sm:inline">New Case</span>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/app/cases?status=${f.value}${searchQuery ? `&search=${searchQuery}` : ''}`}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              statusFilter === f.value
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Cases grid */}
      {cases && cases.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <CaseCard key={c.id} case={c as Case} thumbnailUrl={thumbnailUrls[c.id]} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-20 text-center">
          <FolderOpen className="mb-3 size-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium">
            {statusFilter !== 'all'
              ? `No ${CASE_STATUS_LABELS[statusFilter] ?? statusFilter} cases`
              : 'No cases yet'}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
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
