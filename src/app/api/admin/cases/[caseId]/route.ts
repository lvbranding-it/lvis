import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CaseStatus, CasePriority } from '@/types'

const VALID_STATUSES: CaseStatus[] = ['pending', 'in_review', 'analyzing', 'completed', 'rejected']
const VALID_PRIORITIES: CasePriority[] = ['low', 'normal', 'high', 'urgent']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    status?: CaseStatus
    priority?: CasePriority
    admin_notes?: string
    assigned_to?: string | null
  }

  // Validate fields if provided
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return Response.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }
  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
    return Response.json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.status !== undefined)      update.status = body.status
  if (body.priority !== undefined)    update.priority = body.priority
  if (body.admin_notes !== undefined) update.admin_notes = body.admin_notes
  if ('assigned_to' in body)          update.assigned_to = body.assigned_to

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('cases')
    .update(update)
    .eq('id', caseId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, case: data })
}
