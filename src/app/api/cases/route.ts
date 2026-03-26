import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { TIER_LIMITS } from '@/lib/constants'

const createCaseSchema = z.object({
  title: z.string().min(3).max(200),
  purpose: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  description: z.string().optional(),
  client_notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createCaseSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Check tier limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = (profile?.subscription_tier ?? 'free') as keyof typeof TIER_LIMITS
  const limit = TIER_LIMITS[tier]?.analyses_per_month ?? 1

  if (limit !== Infinity) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .gte('created_at', startOfMonth)

    if ((count ?? 0) >= limit) {
      return Response.json(
        {
          error: `Monthly case limit reached. Your ${tier} plan allows ${limit} case${limit === 1 ? '' : 's'} per month.`,
          code: 'TIER_LIMIT_EXCEEDED',
        },
        { status: 403 }
      )
    }
  }

  const { data: caseData, error } = await supabase
    .from('cases')
    .insert({
      client_id: user.id,
      ...parsed.data,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(caseData, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('cases')
    .select('*, case_files(*), forensic_reviews(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (profile?.role !== 'admin') {
    query = query.eq('client_id', user.id)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ cases: data, total: count })
}
