import Link from 'next/link'
import {
  FileSearchIcon,
  TrophyIcon,
  ScissorsIcon,
  BotIcon,
  FileTextIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services — LVIS™',
  description:
    'Professional forensic image analysis services: integrity analysis, competition verification, manipulation detection, AI assessment, and expert opinion reports.',
}

const services = [
  {
    id: 'integrity-analysis',
    icon: FileSearchIcon,
    title: 'Image Integrity Analysis',
    subtitle: 'Comprehensive five-dimension forensic evaluation',
    description:
      'The flagship LVIS™ service. A complete forensic examination covering all five analysis dimensions: provenance, file integrity, visual consistency, manipulation detection, and synthetic risk assessment. Produces a full LV Authenticity Index™ report with scored findings, supporting evidence maps, and methodology documentation.',
    deliverables: [
      'Scored LV Authenticity Index™ report (0–100)',
      'Five-dimension breakdown with individual scores',
      'Visual evidence annotations where applicable',
      'Methodology documentation and chain of analysis',
      'Analyst certification signature',
    ],
    useCases: ['Legal proceedings', 'Insurance claims', 'Institutional review', 'General professional use'],
    turnaround: '5–7 business days (standard) / 2–3 days (priority)',
  },
  {
    id: 'competition-verification',
    icon: TrophyIcon,
    title: 'Competition Submission Verification',
    subtitle: 'Structured analysis against competition standards',
    description:
      'Purpose-built for photography competitions and awards. Evaluates submissions against stated competition rules with particular emphasis on manipulation detection and synthetic content identification. Delivers a determination-ready assessment report that supports fair, consistent judging decisions.',
    deliverables: [
      'Competition-specific evaluation report',
      'Manipulation and synthetic risk scoring',
      'Rule compliance assessment summary',
      'Recommendation for acceptance, flagging, or disqualification',
      'Bulk submission processing available',
    ],
    useCases: ['Photography competitions', 'Awards programs', 'Portfolio reviews', 'Guild certification'],
    turnaround: '3–5 business days per submission (bulk pricing available)',
  },
  {
    id: 'manipulation-detection',
    icon: ScissorsIcon,
    title: 'Retouching and Manipulation Detection',
    subtitle: 'Focused analysis for suspected alteration',
    description:
      'A targeted investigation for images where manipulation is the primary concern. Applies Error Level Analysis, frequency domain inspection, clone stamp detection, and compositing analysis to identify and spatially map specific areas of alteration. Ideal when provenance analysis is already established and the question is whether and where manipulation occurred.',
    deliverables: [
      'Manipulation probability score',
      'Spatial annotation map of affected regions',
      'ELA visualization and frequency domain analysis',
      'Clone and healing detection report',
      'Compositing edge analysis',
    ],
    useCases: ['Insurance fraud investigation', 'Editorial verification', 'Legal evidence review'],
    turnaround: '3–5 business days',
  },
  {
    id: 'ai-assessment',
    icon: BotIcon,
    title: 'AI-Generated Image Assessment',
    subtitle: 'Identification of generative AI signatures',
    description:
      'Specialized forensic evaluation for images submitted as photographic when AI generation is suspected. Examines noise distribution, texture regularity, semantic coherence, and known generative model fingerprints. Produces a synthetic probability score with supporting technical evidence.',
    deliverables: [
      'Synthetic probability score',
      'Noise pattern distribution analysis',
      'Texture regularity evaluation',
      'Generative model fingerprint assessment',
      'Visual evidence documentation',
    ],
    useCases: ['Social media verification', 'Editorial screening', 'Competition review', 'Insurance investigation'],
    turnaround: '3–5 business days',
  },
  {
    id: 'expert-opinion',
    icon: FileTextIcon,
    title: 'Expert Opinion Reports',
    subtitle: 'Formal written expert opinion for legal and institutional use',
    description:
      'A formal written expert opinion prepared for use in legal proceedings, insurance claim disputes, institutional review processes, or regulatory matters. Produced under professional methodology, structured for evidentiary reference, and suitable for expert consultation and deposition support. Requires prior engagement agreement.',
    deliverables: [
      'Formal expert opinion letter or report',
      'Full technical methodology documentation',
      'Evidentiary-standard analysis chain',
      'Analyst CV and qualification statement',
      'Deposition or testimony support (by arrangement)',
    ],
    useCases: ['Civil litigation', 'Criminal proceedings', 'Insurance dispute resolution', 'Regulatory review'],
    turnaround: 'By arrangement — contact for timeline',
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Page hero */}
      <div className="bg-[#060E1A] border-b border-white/5 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#60A5FA] text-xs font-semibold uppercase tracking-widest mb-4">
            What We Offer
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Services
          </h1>
          <p className="text-[#64748B] text-base leading-relaxed max-w-2xl mx-auto">
            Professional forensic image analysis delivered with the rigor demanded by legal, editorial, and competitive contexts. Every service is grounded in the LVIS™ methodology and produces structured, defensible documentation.
          </p>
        </div>
      </div>

      {/* Services list */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        {services.map((service, index) => {
          const Icon = service.icon
          return (
            <div
              key={service.id}
              id={service.id}
              className="bg-[#0A1628] border border-white/5 rounded-2xl overflow-hidden"
            >
              {/* Service header */}
              <div className="p-6 sm:p-8 border-b border-white/5">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#1E3A5F]/50 border border-[#2D5A8E]/30 shrink-0">
                    <Icon className="size-5 text-[#60A5FA]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[#1E3A5F] text-xs font-mono font-bold">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2 className="text-white font-bold text-lg sm:text-xl">{service.title}</h2>
                    </div>
                    <p className="text-[#60A5FA] text-sm">{service.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Service body */}
              <div className="p-6 sm:p-8">
                <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
                  {service.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Deliverables */}
                  <div>
                    <h3 className="text-[#64748B] text-[10px] font-semibold uppercase tracking-widest mb-3">
                      Deliverables
                    </h3>
                    <ul className="space-y-2">
                      {service.deliverables.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckIcon className="size-3.5 text-[#22C55E] mt-0.5 shrink-0" />
                          <span className="text-[#64748B] text-xs leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Use cases + turnaround */}
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-[#64748B] text-[10px] font-semibold uppercase tracking-widest mb-3">
                        Common Use Cases
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {service.useCases.map((uc) => (
                          <span
                            key={uc}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E3A5F]/30 text-[#93C5FD] border border-[#2D5A8E]/20"
                          >
                            {uc}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[#64748B] text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                        Typical Turnaround
                      </h3>
                      <p className="text-[#475569] text-xs">{service.turnaround}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/5">
                  <Link href="/request">
                    <Button
                      size="sm"
                      className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium"
                    >
                      Request This Service
                      <ArrowRightIcon className="size-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pricing teaser */}
      <div className="border-t border-white/5 bg-[#060E1A] py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Pricing</h2>
          <p className="text-[#64748B] text-base leading-relaxed mb-6">
            LVIS™ offers flexible access tiers — from a free single analysis to enterprise-volume agreements with white-label reporting.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pricing">
              <Button
                variant="outline"
                className="border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-white/5 hover:border-[#2D5A8E] bg-transparent"
              >
                View Pricing
                <ChevronRightIcon className="size-3.5 ml-1" />
              </Button>
            </Link>
            <Link href="/request">
              <Button className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium">
                Request an Analysis
                <ArrowRightIcon className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
