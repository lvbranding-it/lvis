import { InfoIcon } from 'lucide-react'
import { LVAuthenticityIndexLogo } from '@/components/brand/LVAuthenticityIndexLogo'
import { QualitySeal } from '@/components/brand/QualitySeal'

const bands = [
  {
    range: '0–20',
    label: 'Authentic Capture',
    description:
      'Image exhibits all characteristics of an unaltered, original photograph. Metadata is consistent and intact. No evidence of file-level or visual manipulation detected.',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.20)',
    textColor: '#4ADE80',
    width: '20%',
    left: '0%',
  },
  {
    range: '21–40',
    label: 'Authentic — Standard Editing',
    description:
      'Authentic photograph with professional post-processing. Editing is consistent with industry-standard workflow: exposure, color grading, minor corrections. No evidence of structural manipulation.',
    color: '#84CC16',
    bgColor: 'rgba(132,204,22,0.08)',
    borderColor: 'rgba(132,204,22,0.20)',
    textColor: '#A3E635',
    width: '20%',
    left: '20%',
  },
  {
    range: '41–60',
    label: 'Significant Retouching',
    description:
      'Image shows evidence of significant content-aware editing, frequency-level retouching, or localized manipulation. May be acceptable depending on context and disclosed intent.',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.20)',
    textColor: '#FCD34D',
    width: '20%',
    left: '40%',
  },
  {
    range: '61–80',
    label: 'High Manipulation Likelihood',
    description:
      'Strong indicators of composite imagery, cloning, or structural alteration. Multiple forensic dimensions show inconsistency. Requires detailed disclosure and may be unsuitable for legal or competition contexts.',
    color: '#F97316',
    bgColor: 'rgba(249,115,22,0.08)',
    borderColor: 'rgba(249,115,22,0.20)',
    textColor: '#FB923C',
    width: '20%',
    left: '60%',
  },
  {
    range: '81–100',
    label: 'Synthetic / AI-Generated Risk',
    description:
      'High probability that the image is partially or entirely AI-generated, or has been manipulated to a degree that compromises evidentiary value. Not suitable for competition submission, publication, or legal use without full disclosure.',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.20)',
    textColor: '#F87171',
    width: '20%',
    left: '80%',
  },
]

export function AuthenticityIndexScale() {
  return (
    <section
      id="authenticity-index"
      className="bg-[#0F172A] py-24 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-[#60A5FA] text-xs font-semibold uppercase tracking-widest mb-4">
            Scoring Standard
          </p>
          {/* Brand logo + seal */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <QualitySeal size={72} sealColor="#0A1628" detailColor="#60A5FA" />
            <LVAuthenticityIndexLogo width={320} className="text-white" />
          </div>
          <p className="text-[#64748B] text-base leading-relaxed">
            A professional standard for evaluating photographic integrity — from authentic capture to synthetic generation, expressed as a single scored risk band.
          </p>
        </div>

        {/* Gradient scale bar */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2 px-0.5">
            <span className="text-[#64748B] text-[10px] font-mono">0</span>
            <span className="text-[#64748B] text-[10px] font-mono">20</span>
            <span className="text-[#64748B] text-[10px] font-mono">40</span>
            <span className="text-[#64748B] text-[10px] font-mono">60</span>
            <span className="text-[#64748B] text-[10px] font-mono">80</span>
            <span className="text-[#64748B] text-[10px] font-mono">100</span>
          </div>
          <div className="relative h-6 rounded-lg overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, #22C55E 0%, #84CC16 20%, #EAB308 40%, #F97316 60%, #EF4444 80%, #DC2626 100%)',
              }}
            />
            {/* Tick marks */}
            {[20, 40, 60, 80].map((tick) => (
              <div
                key={tick}
                className="absolute top-0 bottom-0 w-px bg-[#0F172A]/40"
                style={{ left: `${tick}%` }}
              />
            ))}
          </div>
          {/* Band labels below bar */}
          <div className="flex mt-2">
            {bands.map((band) => (
              <div key={band.range} className="flex-1 text-center">
                <span className="text-[9px] font-medium" style={{ color: band.textColor }}>
                  {band.range}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Band cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
          {bands.map((band, index) => (
            <div
              key={band.range}
              className="p-4 rounded-xl border transition-colors"
              style={{
                backgroundColor: band.bgColor,
                borderColor: band.borderColor,
              }}
            >
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full mb-3"
                style={{ backgroundColor: band.color }}
              />
              {/* Range */}
              <p
                className="text-xs font-mono font-bold mb-1"
                style={{ color: band.textColor }}
              >
                {band.range}
              </p>
              {/* Label */}
              <h4 className="text-white text-xs font-semibold leading-tight mb-2">
                {band.label}
              </h4>
              {/* Description */}
              <p className="text-[#475569] text-[11px] leading-relaxed">
                {band.description}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer box */}
        <div className="mt-10 p-5 bg-[#0A1628] border border-[#1E3A5F]/40 rounded-xl">
          <div className="flex items-start gap-3">
            <InfoIcon className="size-4 text-[#60A5FA] mt-0.5 shrink-0" />
            <div>
              <p className="text-[#60A5FA] text-xs font-semibold mb-1">
                Important Limitation
              </p>
              <p className="text-[#64748B] text-sm leading-relaxed">
                <strong className="text-[#94A3B8] font-medium">The LV Authenticity Index™ does not determine truth.</strong>{' '}
                It documents evidence and assigns risk based on measurable technical indicators. A score in any band is a structured forensic assessment — not a legal conclusion, not a statement of intent, and not a determination of deception. Results must be interpreted within professional and contextual frameworks by qualified practitioners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
