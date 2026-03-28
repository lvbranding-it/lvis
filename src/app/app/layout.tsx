import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/hooks/useAuth'
import { AppShell } from '@/components/app/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/app/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // First-time users: show welcome / onboarding screen
  if (profile && !profile.onboarding_completed) {
    redirect('/auth/welcome')
  }

  return (
    <AuthProvider>
      <AppShell profile={profile}>
        {children}
      </AppShell>
    </AuthProvider>
  )
}
