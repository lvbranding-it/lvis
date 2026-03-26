import { NewCaseForm } from '@/components/app/NewCaseForm'

export const metadata = {
  title: 'Submit New Case — LVIS™',
}

export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Submit New Case</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide case details and upload an image for forensic analysis.
        </p>
      </div>
      <NewCaseForm />
    </div>
  )
}
