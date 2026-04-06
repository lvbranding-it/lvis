import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/marketing/HeroSection'
import { TheProblemSection } from '@/components/marketing/TheProblemSection'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { AuthenticityIndexScale } from '@/components/marketing/AuthenticityIndexScale'
import { WhoUsesLVIS } from '@/components/marketing/WhoUsesLVIS'
import { ServicesSection } from '@/components/marketing/ServicesSection'
import { CTASection } from '@/components/marketing/CTASection'

export const metadata: Metadata = {
  title: 'LVIS™ — LV Image Integrity System™',
  description:
    'Professional forensic photography analysis. The LV Authenticity Index™ delivers structured risk assessment and evidence-based image integrity evaluation for legal, insurance, and investigative professionals.',
  alternates: { canonical: 'https://www.thelvis.com' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LVIS™ — LV Image Integrity System™',
  url: 'https://www.thelvis.com',
  applicationCategory: 'BusinessApplication',
  description:
    'Forensic image analysis platform. The LV Authenticity Index™ evaluates photographic images across provenance, file integrity, visual consistency, manipulation likelihood, and synthetic risk.',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'By Unit', price: '9.99', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro', price: '49', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Enterprise', price: '199', priceCurrency: 'USD' },
  ],
  publisher: {
    '@type': 'Organization',
    name: 'LV Branding',
    url: 'https://www.lvbranding.com',
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/app/dashboard')
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">LVIS™ — LV Image Integrity System™ — Professional Forensic Image Analysis</h1>
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
