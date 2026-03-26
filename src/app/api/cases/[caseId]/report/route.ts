import { type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateAndStoreReport, buildReportProps } from '@/lib/pdf/generator'

type RouteContext = {
  params: Promise<{ caseId: string }>
}

// ─── GET — return a fresh 1-hour signed URL for the existing report ───────────

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { caseId } = await params
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the case to verify ownership / admin access
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select('id, client_id')
    .eq('id', caseId)
    .single()

  if (caseError || !caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin && caseData.client_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch the report record
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id, storage_path, version')
    .eq('case_id', caseId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (reportError || !report) {
    return Response.json({ error: 'Report not found' }, { status: 404 })
  }

  if (!report.storage_path) {
    return Response.json({ error: 'Report storage path not available' }, { status: 404 })
  }

  // Use service client to create signed URL (bypasses RLS on storage)
  const serviceClient = createServiceClient()
  const { data: signedData, error: signedError } = await serviceClient.storage
    .from('case-reports')
    .createSignedUrl(report.storage_path, 3600)

  if (signedError || !signedData?.signedUrl) {
    console.error('[report/route] createSignedUrl error:', signedError)
    return Response.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  return Response.json({ url: signedData.signedUrl })
}

// ─── POST — (admin only) regenerate the PDF and upload fresh copy ─────────────

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { caseId } = await params
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin-only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  // Fetch case with profile + latest forensic review
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select(`
      *,
      profiles!cases_client_id_fkey(id, full_name, company_name, role),
      forensic_reviews(
        id, case_id, case_file_id,
        provenance_score, file_integrity_score,
        visual_consistency_score, manipulation_score, synthetic_risk_score,
        total_score, classification, confidence_level,
        analysis_status, error_message, analyzed_at, created_at,
        technical_evidence, claude_findings
      )
    `)
    .eq('id', caseId)
    .single()

  if (caseError || !caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const reviews = Array.isArray(caseData.forensic_reviews)
    ? caseData.forensic_reviews
    : caseData.forensic_reviews
      ? [caseData.forensic_reviews]
      : []

  const review = reviews.find((r: { analysis_status: string }) => r.analysis_status === 'complete') ?? reviews[0]

  if (!review) {
    return Response.json({ error: 'No forensic review available for this case' }, { status: 422 })
  }

  if (review.analysis_status !== 'complete') {
    return Response.json(
      { error: 'Forensic review is not yet complete', status: review.analysis_status },
      { status: 422 }
    )
  }

  const client = caseData.profiles ?? null

  const reportData = buildReportProps(
    { ...caseData, client } as Parameters<typeof buildReportProps>[0],
    review as Parameters<typeof buildReportProps>[1]
  )

  const storagePath = await generateAndStoreReport({
    caseId,
    forensicReviewId: review.id,
    reportData,
  })

  if (!storagePath) {
    return Response.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  return Response.json({ storage_path: storagePath }, { status: 201 })
}
