import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CaseTable } from '@/components/app/CaseTable'
import type { Case, Profile, ForensicReview } from '@/types'

export default async function AdminCasesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: cases } = await supabase
    .from('cases')
    .select(
      `*, profiles!cases_client_id_fkey(id, full_name, company_name, role), forensic_reviews(id, total_score, analysis_status, classification, confidence_level, analyzed_at, created_at)`
    )
    .order('created_at', { ascending: false })

  const normalizedCases = (cases ?? []).map((c) => ({
    ...c,
    client: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
    forensic_review: Array.isArray(c.forensic_reviews) ? c.forensic_reviews[0] ?? null : c.forensic_reviews,
  })) as Array<Case & { client?: Profile; forensic_review?: ForensicReview | null }>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Cases</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {normalizedCases.length} total case{normalizedCases.length !== 1 ? 's' : ''} across all clients.
        </p>
      </div>
      <CaseTable cases={normalizedCases} />
    </div>
  )
}
