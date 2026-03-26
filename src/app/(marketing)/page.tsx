import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/marketing/HeroSection'
import { TheProblemSection } from '@/components/marketing/TheProblemSection'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { AuthenticityIndexScale } from '@/components/marketing/AuthenticityIndexScale'
import { WhoUsesLVIS } from '@/components/marketing/WhoUsesLVIS'
import { ServicesSection } from '@/components/marketing/ServicesSection'
import { CTASection } from '@/components/marketing/CTASection'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/app/dashboard')
  return (
    <>
      <HeroSection />
      <TheProblemSection />
      <HowItWorks />
      <AuthenticityIndexScale />
      <WhoUsesLVIS />
      <ServicesSection />
      <CTASection />
    </>
  )
}
