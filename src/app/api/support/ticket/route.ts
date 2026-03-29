import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSupportTicketEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, subject, message, conversation, user_id } = body

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'name, email, and message are required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || null,
      message: message.trim(),
      conversation: conversation ?? [],
      user_id: user_id ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('support_tickets insert error:', error)
    return NextResponse.json({ error: 'Failed to save ticket' }, { status: 500 })
  }

  // Send admin email notification (non-blocking)
  sendSupportTicketEmail({
    ticketId: ticket.id,
    name,
    email,
    subject,
    message,
    conversationLength: Array.isArray(conversation) ? conversation.length : 0,
  }).catch((e) => console.error('Support email failed:', e))

  return NextResponse.json({ ok: true, ticketId: ticket.id })
}

export async function GET(req: NextRequest) {
  // Admin: list all tickets
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('support_tickets')
    .select('id, created_at, name, email, subject, message, status, user_id, conversation')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tickets: data })
}

export async function PATCH(req: NextRequest) {
  // Admin: update ticket status / notes
  const { id, status, admin_notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createServiceClient()
  const update: Record<string, unknown> = {}
  if (status) {
    update.status = status
    if (status === 'resolved') update.resolved_at = new Date().toISOString()
  }
  if (admin_notes !== undefined) update.admin_notes = admin_notes

  const { error } = await supabase.from('support_tickets').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
