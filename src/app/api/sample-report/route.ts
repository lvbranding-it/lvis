import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/sample-report
 * Generates a short-lived signed URL for the sample PDF in Supabase Storage
 * (case-reports/sample/sample-report.pdf) and redirects the browser to it.
 * Returns 404 if the file hasn't been uploaded yet.
 */
export async function GET() {
  const supabase = createServiceClient()

  const { data, error } = await supabase.storage
    .from('case-reports')
    .createSignedUrl('sample/Sample-report.pdf', 3600) // 1-hour link

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: 'Sample report not available yet.' },
      { status: 404 }
    )
  }

  return NextResponse.redirect(data.signedUrl)
}
