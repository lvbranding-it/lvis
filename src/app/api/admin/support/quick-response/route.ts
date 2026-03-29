import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendReportReadyEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ticketId, resend, grantCredit } = body as {
    ticketId: string
    resend?: { caseId: string; recipientEmail: string; recipientName: string }
    grantCredit?: { userId: string; amount: number }
  }

  if (!ticketId) {
    return NextResponse.json({ error: 'ticketId required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const results: { sentTo?: string; creditsGranted?: number; errors: string[] } = { errors: [] }

  // ── Action 1: Resend report ──────────────────────────────────────────────
  if (resend) {
    const { caseId, recipientEmail, recipientName } = resend

    try {
      // Fetch case + latest report
      const { data: caseData, error: caseErr } = await supabase
        .from('cases')
        .select('case_number, title')
        .eq('id', caseId)
        .single()

      if (caseErr || !caseData) throw new Error('Case not found')

      const { data: report, error: reportErr } = await supabase
        .from('reports')
        .select('storage_path')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (reportErr || !report?.storage_path) throw new Error('Report not found for this case')

      // Create 24-hour signed URL
      const { data: signedData, error: signErr } = await supabase.storage
        .from('case-reports')
        .createSignedUrl(report.storage_path, 60 * 60 * 24)

      if (signErr || !signedData?.signedUrl) throw new Error('Failed to generate download link')

      // Fetch score from forensic_review
      const { data: review } = await supabase
        .from('forensic_reviews')
        .select('total_score, classification')
        .eq('case_id', caseId)
        .eq('analysis_status', 'complete')
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single()

      await sendReportReadyEmail({
        to: recipientEmail,
        clientName: recipientName || recipientEmail,
        caseNumber: caseData.case_number,
        caseTitle: caseData.title,
        reportUrl: signedData.signedUrl,
        totalScore: review?.total_score ?? 0,
        classification: review?.classification ?? 'Unknown',
      })

      results.sentTo = recipientEmail

      // Mark report as delivered
      await supabase
        .from('reports')
        .update({ delivered_at: new Date().toISOString() })
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
    } catch (e) {
      results.errors.push(`Report send failed: ${(e as Error).message}`)
    }
  }

  // ── Action 2: Grant credit ───────────────────────────────────────────────
  if (grantCredit) {
    const { userId, amount } = grantCredit
    const safeAmount = Math.max(1, Math.min(10, Math.floor(amount)))

    try {
      const { error } = await supabase.rpc('increment_analysis_credits', {
        p_user_id: userId,
        p_amount: safeAmount,
      })

      if (error) throw new Error(error.message)
      results.creditsGranted = safeAmount
    } catch (e) {
      results.errors.push(`Credit grant failed: ${(e as Error).message}`)
    }
  }

  // ── Update ticket admin notes ────────────────────────────────────────────
  const notes: string[] = []
  if (results.sentTo) notes.push(`Report resent to ${results.sentTo}`)
  if (results.creditsGranted) notes.push(`${results.creditsGranted} free credit(s) granted`)
  if (notes.length > 0) {
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    const noteEntry = `[${timestamp}] Quick Response: ${notes.join('; ')}`
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('admin_notes')
      .eq('id', ticketId)
      .single()

    const updatedNotes = ticket?.admin_notes
      ? `${ticket.admin_notes}\n${noteEntry}`
      : noteEntry

    await supabase
      .from('support_tickets')
      .update({ admin_notes: updatedNotes, status: 'in_progress' })
      .eq('id', ticketId)
  }

  if (results.errors.length > 0 && !results.sentTo && results.creditsGranted === undefined) {
    return NextResponse.json({ error: results.errors.join('; ') }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ...results })
}
