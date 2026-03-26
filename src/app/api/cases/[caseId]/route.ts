import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { NextRequest } from 'next/server'

const patchCaseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  purpose: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  description: z.string().optional(),
  client_notes: z.string().optional(),
  // Admin-only fields
  status: z.enum(['pending', 'in_review', 'analyzing', 'completed', 'rejected']).optional(),
  assigned_to: z.string().uuid().optional(),
  admin_notes: z.string().optional(),
})

type RouteContext = {
  params: Promise<{ caseId: string }>
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const { caseId } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: caseData, error } = await supabase
    .from('cases')
    .select(
      `
      *,
      case_files (*),
      forensic_reviews (*),
      reports (*)
      `
    )
    .eq('id', caseId)
    .single()

  if (error || !caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  // Non-admin users can only see their own cases
  if (profile?.role !== 'admin' && caseData.client_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return Response.json(caseData)
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { caseId } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: existingCase, error: fetchError } = await supabase
    .from('cases')
    .select('id, client_id, status')
    .eq('id', caseId)
    .single()

  if (fetchError || !existingCase) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const isAdmin = profile?.role === 'admin'
  const isOwner = existingCase.client_id === user.id

  if (!isAdmin && !isOwner) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Clients can only update pending cases
  if (!isAdmin && existingCase.status !== 'pending') {
    return Response.json(
      { error: 'Case can only be edited while in pending status.' },
      { status: 409 }
    )
  }

  const body = await request.json()
  const parsed = patchCaseSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Strip admin-only fields for non-admins
  const updateData: Record<string, unknown> = { ...parsed.data }
  if (!isAdmin) {
    delete updateData.status
    delete updateData.assigned_to
    delete updateData.admin_notes
  }

  const { data: updated, error: updateError } = await supabase
    .from('cases')
    .update(updateData)
    .eq('id', caseId)
    .select()
    .single()

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  return Response.json(updated)
}
