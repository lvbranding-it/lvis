import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CaseDetailView } from '@/components/app/CaseDetailView'

interface Props {
  params: Promise<{ caseId: string }>
}

export default async function CaseDetailPage({ params }: Props) {
  const { caseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch case with all relations
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

  if (error || !caseData) {
    notFound()
  }

  // Ensure user owns the case or is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && caseData.client_id !== user.id) {
    redirect('/app/dashboard')
  }

  // Get metadata if available
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

  return (
    <CaseDetailView
      caseData={caseData as any}
      metadata={metadata}
      isAdmin={isAdmin}
    />
  )
}
