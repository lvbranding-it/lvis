import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AdminCaseDetailView } from '@/components/app/admin/AdminCaseDetailView'

interface Props {
  params: Promise<{ caseId: string }>
}

export default async function AdminCaseDetailPage({ params }: Props) {
  const { caseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: caseData, error } = await supabase
    .from('cases')
    .select(`
      *,
      profiles!cases_client_id_fkey(id, full_name, company_name, role),
      case_files(*),
      forensic_reviews(
        id, case_id, case_file_id,
        provenance_score, file_integrity_score,
        visual_consistency_score, manipulation_score, synthetic_risk_score,
        total_score, classification, confidence_level,
        analysis_status, error_message, analyzed_at, created_at,
        technical_evidence, claude_findings
      ),
      reports(id, storage_path, version, delivered_at, created_at)
    `)
    .eq('id', caseId)
    .single()

  if (error || !caseData) notFound()

  const caseFile = caseData.case_files?.[0]
  let metadata = null
  if (caseFile) {
    const { data: metaData } = await supabase
      .from('metadata_reports')
      .select('*')
      .eq('case_file_id', caseFile.id)
      .single()
    metadata = metaData
  }

  // Fetch client email via service client (auth admin API)
  const serviceClient = createServiceClient()
  const { data: { user: clientUser } } = await serviceClient.auth.admin.getUserById(caseData.client_id)
  const clientEmail = clientUser?.email ?? null

  // Normalise joined profile
  const client = Array.isArray(caseData.profiles) ? caseData.profiles[0] : caseData.profiles

  return (
    <AdminCaseDetailView
      caseData={{ ...caseData, client } as any}
      metadata={metadata}
      clientEmail={clientEmail}
    />
  )
}
