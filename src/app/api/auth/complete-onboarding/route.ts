import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { purpose, company_name } = body

    const update: Record<string, unknown> = { onboarding_completed: true }
    if (purpose) update.purpose = purpose
    if (company_name) update.company_name = company_name

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)

    if (error) {
      console.error('Onboarding update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('complete-onboarding error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
