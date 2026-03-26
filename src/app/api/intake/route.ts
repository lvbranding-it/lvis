import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { fullName, email, purpose, imageDescription, reference } = body

    if (!fullName || !email || !purpose || !imageDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // TODO: Insert into Supabase intake_requests table when schema migration is added.
    // For now this is a functional stub that acknowledges receipt.
    // When the DB is ready, replace this block with:
    //
    // const { createClient } = await import('@supabase/supabase-js')
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY!
    // )
    // await supabase.from('intake_requests').insert({
    //   full_name: fullName,
    //   email,
    //   organization: body.organization || null,
    //   purpose,
    //   image_description: imageDescription,
    //   urgency: body.urgency || 'standard',
    //   reference_number: reference,
    //   status: 'pending',
    //   created_at: new Date().toISOString(),
    // })

    console.log('[LVIS intake]', {
      reference,
      email,
      purpose,
      urgency: body.urgency,
      submittedAt: new Date().toISOString(),
    })

    return NextResponse.json(
      { success: true, reference },
      { status: 200 }
    )
  } catch (error) {
    console.error('[LVIS intake error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
