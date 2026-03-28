import Link from 'next/link'
import { FileSearchIcon, TrophyIcon, ScissorsIcon, BotIcon, FileTextIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const services = [
  {
    icon: FileSearchIcon,
    title: 'Image Integrity Analysis',
    description:
      'Full five-dimension forensic analysis of a photographic image. Covers provenance, file integrity, visual consistency, manipulation detection, and synthetic risk. Produces a complete LV Authenticity Index™ report with scored findings and supporting documentation.',
    badge: 'Core Service',
  },
  {
    icon: TrophyIcon,
    title: 'Competition Submission Verification',
    description:
      'Structured analysis designed for photography competitions. Evaluates submissions against stated competition rules with a focus on manipulation detection and synthetic content identification. Delivers a determination-ready assessment report.',
    badge: 'Competition',
  },
  {
    icon: ScissorsIcon,
    title: 'Retouching and Manipulation Detection',
    description:
      'Focused analysis for images where manipulation is the primary concern. Applies Error Level Analysis, frequency domain inspection, and cloning detection to identify and map specific areas of alteration.',
    badge: 'Focused',
  },
  {
    icon: BotIcon,
    title: 'AI-Generated Image Assessment',
    description:
      'Specialized evaluation for identifying generative AI signatures in images submitted as photographs. Examines noise patterns, texture regularity, semantic coherence, and known model fingerprints.',
    badge: 'AI Detection',
  },
  {
    icon: FileTextIcon,
    title: 'Expert Opinion Reports',
    description:
      'Formal written expert opinion prepared for legal proceedings, insurance claims, or institutional review. Produced under professional methodology, structured for evidentiary reference and expert consultation use.',
    badge: 'Legal / Expert',
  },
]

export function ServicesSection() {
  return (
    <section
      id="services"
      className="bg-[#0F172A] py-24 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-[#60A5FA] text-xs font-semibold uppercase tracking-widest mb-4">
            What We Offer
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Services
          </h2>
          <p className="text-[#64748B] text-base leading-relaxed">
            Professional forensic image analysis delivered at the level of rigor demanded by legal, editorial, and competitive contexts.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {services.slice(0, 3).map((service) => {
            const Icon = service.icon
            return <ServiceCard key={service.title} service={service} Icon={Icon} />
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 max-w-4xl mx-auto">
          {services.slice(3).map((service) => {
            const Icon = service.icon
            return <ServiceCard key={service.title} service={service} Icon={Icon} />
          })}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <p className="text-[#64748B] text-sm mb-4">
            Ready to request a forensic analysis?
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium px-8 h-11"
            >
              Request an Analysis
              <ArrowRightIcon className="size-4 ml-1" />
            </Button>
          </Link>
          <p className="text-[#334155] text-xs mt-4">
            View{' '}
            <Link href="/pricing" className="text-[#475569] hover:text-[#64748B] underline underline-offset-2">
              pricing
            </Link>{' '}
            for plan details.
          </p>
        </div>
      </div>
    </section>
  )
}

function ServiceCard({
  service,
  Icon,
}: {
  service: (typeof services)[0]
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link href="/auth/signup" className="group block">
      <div className="h-full p-6 bg-[#0A1628] border border-white/5 rounded-xl hover:border-[#1E3A5F]/60 transition-all group-hover:bg-[#0A1628]/80">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#1E3A5F]/50 border border-[#2D5A8E]/30">
            <Icon className="size-4.5 text-[#60A5FA]" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E3A5F]/40 text-[#93C5FD] border border-[#2D5A8E]/20">
            {service.badge}
          </span>
        </div>

        <h3 className="text-white font-semibold text-base mb-2 group-hover:text-[#E2E8F0] transition-colors">
          {service.title}
        </h3>
        <p className="text-[#64748B] text-sm leading-relaxed mb-4">
          {service.description}
        </p>

        <div className="flex items-center gap-1 text-[#60A5FA] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Get started</span>
          <ArrowRightIcon className="size-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
