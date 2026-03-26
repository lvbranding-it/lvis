import Link from 'next/link'
import { CheckIcon, ArrowRightIcon, ZapIcon, BuildingIcon, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — LVIS™',
  description:
    'LVIS™ pricing: free single analysis, Pro subscription, and Enterprise agreements for high-volume and institutional use.',
}

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: null,
    description: 'For individuals needing a single integrity evaluation.',
    icon: StarIcon,
    highlight: false,
    badge: null,
    cta: 'Get Started Free',
    ctaHref: '/auth/signup',
    ctaVariant: 'outline' as const,
    features: [
      '1 analysis per month',
      'Standard LV Authenticity Index™ report',
      'Five-dimension scoring',
      'PDF report download',
      'Standard turnaround (5–7 business days)',
      'Email support',
    ],
    notIncluded: [
      'Branded PDF reports',
      'Priority processing',
      'Expert opinion letters',
      'API access',
      'White-label output',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For professionals and organizations with regular analysis needs.',
    icon: ZapIcon,
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Pro',
    ctaHref: '/auth/signup?plan=pro',
    ctaVariant: 'default' as const,
    features: [
      '10 analyses per month',
      'Full branded PDF report',
      'Five-dimension scoring with evidence maps',
      'Priority processing (2–3 business days)',
      'Case management dashboard',
      'PDF archive and re-download',
      'Priority email support',
      'Rollover of unused analyses (up to 5)',
    ],
    notIncluded: [
      'Expert opinion letters',
      'API access',
      'White-label output',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: null,
    description: 'For institutions, law firms, media organizations, and competition bodies.',
    icon: BuildingIcon,
    highlight: false,
    badge: null,
    cta: 'Contact Us',
    ctaHref: '/request',
    ctaVariant: 'outline' as const,
    features: [
      'Unlimited analyses',
      'White-label branded reports',
      'Expert opinion letters included',
      'Dedicated analyst assignment',
      'API access (bulk submission)',
      'SLA with guaranteed turnaround',
      'Priority processing (24–48 hours)',
      'Custom reporting templates',
      'Institutional billing and invoicing',
      'Dedicated support contact',
    ],
    notIncluded: [],
  },
]

const faqs = [
  {
    q: 'What is included in an "analysis"?',
    a: 'Each analysis covers one image file evaluated across all five LVIS™ dimensions (provenance, file integrity, visual consistency, manipulation detection, and synthetic risk assessment), producing a complete LV Authenticity Index™ report.',
  },
  {
    q: 'Can I request an Expert Opinion Report on the Pro plan?',
    a: 'Expert Opinion Reports — formal letters structured for legal evidentiary use — are available on Enterprise plans or as a standalone add-on on Pro. Contact us for pricing.',
  },
  {
    q: 'When will payment processing be available?',
    a: 'Stripe payment integration is under active development. To subscribe to a paid plan today, contact us directly and we will arrange billing.',
  },
  {
    q: 'Is analysis available for bulk or batch submissions?',
    a: 'Yes. Enterprise plans support API-based bulk submission. Competition organizers can also contact us for per-submission batch pricing.',
  },
  {
    q: 'How is the report delivered?',
    a: 'Reports are delivered as secured PDF documents through the LVIS™ dashboard. All reports include the LV Authenticity Index™ score, dimension breakdown, methodology summary, and analyst certification.',
  },
]

export default function PricingPage() {
  const stripeConfigured = !!(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Page hero */}
      <div className="bg-[#060E1A] border-b border-white/5 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#60A5FA] text-xs font-semibold uppercase tracking-widest mb-4">
            Pricing
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Simple, Professional Pricing
          </h1>
          <p className="text-[#64748B] text-base leading-relaxed max-w-xl mx-auto">
            Start with a free analysis, or subscribe for regular access to the full LVIS™ platform. Enterprise agreements are available for institutional and high-volume clients.
          </p>

          {!stripeConfigured && (
            <div className="mt-6 inline-flex items-center gap-2 bg-[#78350F]/20 border border-[#92400E]/30 rounded-full px-4 py-1.5">
              <span className="text-[#FCD34D] text-xs font-medium">
                Stripe payments coming soon — contact us to activate a paid plan
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tier cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => {
            const Icon = tier.icon
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border overflow-hidden flex flex-col ${
                  tier.highlight
                    ? 'border-[#2D5A8E] bg-[#0A1628] shadow-[0_0_60px_rgba(29,78,216,0.12)]'
                    : 'border-white/5 bg-[#0A1628]'
                }`}
              >
                {/* Popular badge */}
                {tier.badge && (
                  <div className="absolute top-0 inset-x-0 flex justify-center">
                    <div className="bg-[#1D4ED8] text-white text-[10px] font-semibold uppercase tracking-widest px-4 py-1 rounded-b-lg">
                      {tier.badge}
                    </div>
                  </div>
                )}

                <div className={`p-6 sm:p-8 ${tier.badge ? 'pt-10' : ''}`}>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-lg border ${
                        tier.highlight
                          ? 'bg-[#1D4ED8]/30 border-[#2D5A8E]/50'
                          : 'bg-[#1E3A5F]/40 border-[#2D5A8E]/30'
                      }`}
                    >
                      <Icon
                        className={`size-4 ${tier.highlight ? 'text-[#60A5FA]' : 'text-[#60A5FA]'}`}
                      />
                    </div>
                    <span className="text-white font-bold text-lg">{tier.name}</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-white font-black text-4xl tracking-tight">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-[#64748B] text-sm font-medium">{tier.period}</span>
                    )}
                  </div>

                  <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                    {tier.description}
                  </p>

                  {/* CTA */}
                  <Link href={tier.ctaHref} className="block">
                    {tier.highlight ? (
                      <Button className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium h-10">
                        {tier.cta}
                        <ArrowRightIcon className="size-3.5 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-white/5 hover:border-[#2D5A8E] bg-transparent font-medium h-10"
                      >
                        {tier.cta}
                        <ArrowRightIcon className="size-3.5 ml-1" />
                      </Button>
                    )}
                  </Link>
                </div>

                {/* Features */}
                <div className="px-6 sm:px-8 pb-8 pt-0 flex-1">
                  <div className="border-t border-white/5 pt-6">
                    <p className="text-[#475569] text-[10px] font-semibold uppercase tracking-widest mb-4">
                      Included
                    </p>
                    <ul className="space-y-2.5">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <CheckIcon className="size-3.5 text-[#22C55E] mt-0.5 shrink-0" />
                          <span className="text-[#94A3B8] text-xs leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {tier.notIncluded.length > 0 && (
                      <>
                        <p className="text-[#334155] text-[10px] font-semibold uppercase tracking-widest mt-5 mb-3">
                          Not Included
                        </p>
                        <ul className="space-y-2">
                          {tier.notIncluded.map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <span className="mt-1 w-3 h-px bg-[#1E3A5F] shrink-0" />
                              <span className="text-[#334155] text-xs leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Enterprise note */}
        <div className="mt-8 p-5 bg-[#0A1628] border border-white/5 rounded-xl text-center">
          <p className="text-[#64748B] text-sm">
            Need bulk pricing for competition submissions or institutional review?{' '}
            <Link href="/request" className="text-[#60A5FA] hover:text-[#93C5FD] font-medium underline underline-offset-2">
              Contact us
            </Link>{' '}
            for a custom quote.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-white/5 bg-[#060E1A] py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-5 bg-[#0A1628] border border-white/5 rounded-xl"
              >
                <h3 className="text-white font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="border-t border-white/5 bg-[#0F172A] py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Start with a Free Analysis
          </h2>
          <p className="text-[#64748B] text-sm leading-relaxed mb-6">
            No payment required to get started. Create an account and submit your first image for forensic analysis — free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup">
              <Button className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium px-8 h-10">
                Create Free Account
                <ArrowRightIcon className="size-3.5 ml-1" />
              </Button>
            </Link>
            <Link href="/request">
              <Button
                variant="outline"
                className="border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-white/5 hover:border-[#2D5A8E] bg-transparent font-medium px-8 h-10"
              >
                Request Without Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
