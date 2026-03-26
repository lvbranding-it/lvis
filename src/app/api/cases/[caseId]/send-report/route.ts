import { type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendReportReadyEmail } from '@/lib/email/resend'

type RouteContext = { params: Promise<{ caseId: string }> }

// POST — (admin only) send the report email to the client
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { caseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const serviceClient = createServiceClient()

  // Fetch case + client profile + latest report + review
  const { data: caseData, error: caseError } = await serviceClient
    .from('cases')
    .select(`
      id, case_number, title, client_id,
      profiles!cases_client_id_fkey(id, full_name),
      forensic_reviews(total_score, classification, analysis_status),
      reports(storage_path, version)
    `)
    .eq('id', caseId)
    .single()

  if (caseError || !caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const reports = Array.isArray(caseData.reports) ? caseData.reports : caseData.reports ? [caseData.reports] : []
  const report = reports[0]

  if (!report?.storage_path) {
    return Response.json({ error: 'No report generated yet. Generate the PDF first.' }, { status: 422 })
  }

  const reviews = Array.isArray(caseData.forensic_reviews) ? caseData.forensic_reviews : caseData.forensic_reviews ? [caseData.forensic_reviews] : []
  const review = reviews[0]

  if (review?.analysis_status !== 'complete') {
    return Response.json({ error: 'Analysis is not complete' }, { status: 422 })
  }

  // Get 24-hour signed URL
  const { data: signedData, error: signedError } = await serviceClient.storage
    .from('case-reports')
    .createSignedUrl(report.storage_path, 86_400)

  if (signedError || !signedData?.signedUrl) {
    return Response.json({ error: 'Could not generate download URL' }, { status: 500 })
  }

  // Get client email from Supabase Auth
  const { data: authUser } = await serviceClient.auth.admin.getUserById(caseData.client_id)
  const clientEmail = authUser?.user?.email

  if (!clientEmail) {
    return Response.json({ error: 'Client email not found' }, { status: 422 })
  }

  const clientProfile = caseData.profiles as { full_name?: string | null } | null
  const clientName = clientProfile?.full_name ?? clientEmail.split('@')[0]

  try {
    await sendReportReadyEmail({
      to: clientEmail,
      clientName,
      caseNumber: caseData.case_number,
      caseTitle: caseData.title,
      reportUrl: signedData.signedUrl,
      totalScore: review.total_score,
      classification: review.classification,
    })
  } catch (err) {
    console.error('[send-report] Email error:', err)
    return Response.json({ error: `Email failed: ${String(err)}` }, { status: 500 })
  }

  return Response.json({ sent: true, to: clientEmail })
}
