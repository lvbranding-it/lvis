import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ caseId: string }>
}

export default async function CaseReportPage({ params }: Props) {
  const { caseId } = await params
  const supabase = await createClient()

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch case — ownership check
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select('id, case_number, title, client_id')
    .eq('id', caseId)
    .single()

  if (caseError || !caseData) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin && caseData.client_id !== user.id) {
    redirect('/app/dashboard')
  }

  // Fetch the report record
  const { data: report } = await supabase
    .from('reports')
    .select('id, storage_path, version')
    .eq('case_id', caseId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  // No report or no storage path — show "not ready" card
  if (!report?.storage_path) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Report Not Ready</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The forensic analysis report for{' '}
            <span className="font-medium text-foreground">{caseData.title}</span>{' '}
            has not been generated yet. Reports are created automatically once the analysis is complete.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/app/cases/${caseId}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Back to Case
            </Link>
            <Link
              href="/app/cases"
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              All Cases
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Case No. {caseData.case_number}
          </p>
        </div>
      </div>
    )
  }

  // Report exists — generate a signed URL and redirect to it for download
  const serviceClient = createServiceClient()
  const { data: signedData, error: signedError } = await serviceClient.storage
    .from('case-reports')
    .createSignedUrl(report.storage_path, 3600)

  if (signedError || !signedData?.signedUrl) {
    // Signed URL generation failed — show error state
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Download Unavailable</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The report file could not be retrieved at this time. Please try again in a moment or contact support.
          </p>
          <Link
            href={`/app/cases/${caseId}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Back to Case
          </Link>
        </div>
      </div>
    )
  }

  // Redirect to the signed Supabase Storage URL — browser will trigger download
  redirect(signedData.signedUrl)
}
