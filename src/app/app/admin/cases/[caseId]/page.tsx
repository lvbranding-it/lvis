import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CaseDetailView } from '@/components/app/CaseDetailView'
import { CaseAdminControls } from '@/components/app/admin/CaseAdminControls'
import { SendReportModal } from '@/components/app/admin/SendReportModal'

interface Props {
  params: Promise<{ caseId: string }>
}

export default async function AdminCaseDetailPage({ params }: Props) {
  const { caseId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  // Fetch client email (requires service client for auth admin API)
  const serviceClient = createServiceClient()
  const { data: { user: clientUser } } = await serviceClient.auth.admin.getUserById(
    caseData.client_id
  )
  const clientEmail = clientUser?.email ?? null

  const review = Array.isArray(caseData.forensic_reviews)
    ? caseData.forensic_reviews[0]
    : caseData.forensic_reviews
  const canSendReport = review?.analysis_status === 'complete'

  return (
    <div className="space-y-6">
      <CaseDetailView
        caseData={caseData as any}
        metadata={metadata}
        isAdmin={true}
      />

      {/* Admin-only controls */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CaseAdminControls
          caseId={caseId}
          initialStatus={caseData.status as any}
          initialPriority={caseData.priority as any}
          initialAdminNotes={caseData.admin_notes}
        />

        {/* Send Report panel */}
        <div className="rounded-xl border bg-card shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold">Send Report to Client</h3>
          <p className="text-xs text-muted-foreground">
            Generate and email the forensic PDF to the client with a custom message and optional expert note embedded in the PDF.
          </p>
          {canSendReport ? (
            <SendReportModal
              caseId={caseId}
              caseNumber={caseData.case_number}
              clientName={(caseData.profiles as any)?.full_name ?? 'Client'}
              clientEmail={clientEmail}
            />
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Analysis must be complete before a report can be sent.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
