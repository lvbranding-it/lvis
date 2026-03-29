import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/support/cases?userId=xxx  OR  ?email=xxx
// Returns completed cases that have a generated report, for the Quick Response dropdown
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const email = searchParams.get('email')

  if (!userId && !email) {
    return NextResponse.json({ error: 'userId or email required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  let clientId = userId

  // If no userId, look up profile by email
  if (!clientId && email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (!profile) {
      return NextResponse.json({ cases: [] })
    }
    clientId = profile.id
  }

  // Fetch completed cases for this client that have a report
  const { data: cases, error } = await supabase
    .from('cases')
    .select(`
      id,
      case_number,
      title,
      forensic_reviews!inner(total_score, classification, analysis_status),
      reports(id, storage_path, created_at)
    `)
    .eq('client_id', clientId!)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Normalize and filter to cases that actually have a report file
  const normalized = (cases ?? [])
    .map((c) => {
      const review = Array.isArray(c.forensic_reviews) ? c.forensic_reviews[0] : c.forensic_reviews
      const report = Array.isArray(c.reports) ? c.reports[0] : c.reports
      return {
        id: c.id,
        case_number: c.case_number,
        title: c.title,
        total_score: review?.total_score ?? null,
        classification: review?.classification ?? null,
        has_report: !!report?.storage_path,
        storage_path: report?.storage_path ?? null,
      }
    })
    .filter((c) => c.has_report)

  return NextResponse.json({ cases: normalized })
}
