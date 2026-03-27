import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  // Verify the requesting user is an admin
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

  const body = await request.json()
  // override: null clears the override (reverts to tier default), number sets it
  const { override } = body as { override: number | null }

  if (override !== null && (typeof override !== 'number' || override < 0 || !Number.isInteger(override))) {
    return Response.json({ error: 'Override must be a non-negative integer or null.' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from('profiles')
    .update({ analyses_override: override })
    .eq('id', userId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, override })
}
