import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewCaseForm } from '@/components/app/NewCaseForm'
import type { SubscriptionTier } from '@/types'

export const metadata = {
  title: 'Submit New Case — LVIS™',
}

export default async function NewCasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const userTier = (profile?.subscription_tier ?? 'free') as SubscriptionTier

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Submit New Case</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide case details and upload an image for forensic analysis.
        </p>
      </div>
      <NewCaseForm userTier={userTier} />
    </div>
  )
}
