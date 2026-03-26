import Link from 'next/link'
import { ArrowRightIcon, FileSearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LvisLogoFull } from '@/components/brand/LvisLogoFull'
import { QualitySeal } from '@/components/brand/QualitySeal'
import { LVAuthenticityIndexLogo } from '@/components/brand/LVAuthenticityIndexLogo'

function ForensicScoreCard() {
  const categories = [
    { label: 'Provenance', score: 82, color: '#22C55E' },
    { label: 'File Integrity', score: 91, color: '#22C55E' },
    { label: 'Visual Consistency', score: 76, color: '#84CC16' },
    { label: 'Manipulation', score: 14, color: '#EF4444' },
    { label: 'Synthetic Risk', score: 9, color: '#EF4444' },
  ]

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
      {/* Glow effect */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-[#2D5A8E]/30 to-transparent pointer-events-none" />
      <div className="absolute -inset-6 bg-[#1D4ED8]/5 rounded-2xl blur-2xl pointer-events-none" />

      <div className="relative bg-[#0A1628] border border-[#1E3A5F]/60 rounded-xl overflow-hidden shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#060E1A] border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]/60" />
          </div>
          <div className="flex items-center gap-1.5">
            <FileSearchIcon className="size-3 text-[#64748B]" />
            <span className="text-[#64748B] text-[10px] font-mono tracking-wider">LVIS Analysis Report</span>
          </div>
          <div className="w-12" />
        </div>

        <div className="p-5">
          {/* Case header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[#60A5FA] text-[10px] font-mono tracking-widest uppercase mb-1">
                Case Reference
              </p>
              <p className="text-white font-mono text-sm font-semibold tracking-wide">
                LVIS-2026-0412-0021
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#166534]/30 border border-[#166534]/40 rounded-md px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[#22C55E] text-[10px] font-medium">Complete</span>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-[#060E1A] rounded-lg border border-white/5">
            <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1E3A5F" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(37 / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-2xl leading-none">37</span>
                <span className="text-[#64748B] text-[9px]">/100</span>
              </div>
            </div>
            <div>
              <div className="mb-1">
                <LVAuthenticityIndexLogo width={160} className="text-[#94A3B8]" />
              </div>
              <p className="text-white text-sm font-semibold leading-tight">
                Authentic Photograph
              </p>
              <p className="text-[#84CC16] text-xs">
                Standard Professional Editing
              </p>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-2.5">
            <p className="text-[#475569] text-[10px] uppercase tracking-widest font-medium">
              Category Analysis
            </p>
            {categories.map((cat) => (
              <div key={cat.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8] text-[11px] font-medium">{cat.label}</span>
                  <span className="text-[#64748B] text-[11px] font-mono">{cat.score}/100</span>
                </div>
                <div className="h-1 bg-[#1E3A5F] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.score}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[#334155] text-[10px] font-mono">
              Analyst: LV / 2026-04-12
            </span>
            <span className="text-[#334155] text-[10px]">LVIS™ v2.1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center bg-[#0F172A] overflow-hidden"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 39px,
            rgba(255,255,255,0.03) 39px,
            rgba(255,255,255,0.03) 40px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 39px,
            rgba(255,255,255,0.03) 39px,
            rgba(255,255,255,0.03) 40px
          )
        `,
      }}
    >
      {/* Radial glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse at center, #1D4ED8 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-[#1E3A5F]/50 border border-[#2D5A8E]/40 rounded-full px-4 py-1.5 mb-8">
              <QualitySeal size={24} sealColor="#1E3A5F" detailColor="#60A5FA" />
              <span className="text-[#93C5FD] text-xs font-medium tracking-wide">
                Professional Forensic Photography Platform
              </span>
            </div>

            {/* Logo wordmark — replaces plain text H1 */}
            <div className="mb-3 flex justify-center lg:justify-start">
              <LvisLogoFull
                width={320}
                className="text-white"
              />
            </div>

            {/* Tagline */}
            <p className="text-white text-2xl italic mb-6">
              Integrity you can verify.
            </p>

            {/* Description */}
            <p className="text-[#94A3B8] text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-10">
              LVIS™ delivers structured, evidence-based forensic analysis of photographic images. Using the proprietary{' '}
              <strong className="text-[#CBD5E1] font-medium">LV Authenticity Index™</strong>, every image is evaluated
              across five critical dimensions — provenance, file integrity, visual consistency, manipulation likelihood,
              and synthetic risk — producing a defensible risk score for professional and legal contexts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/request">
                <Button
                  size="lg"
                  className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium px-6 h-11 text-sm w-full sm:w-auto"
                >
                  Request an Analysis
                  <ArrowRightIcon className="size-4 ml-1" />
                </Button>
              </Link>
              <Link href="#authenticity-index">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-white/5 hover:border-[#2D5A8E] font-medium px-6 h-11 text-sm w-full sm:w-auto bg-transparent"
                >
                  Learn About the LV Authenticity Index™
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Mock forensic score card */}
          <div className="flex justify-center lg:justify-end">
            <ForensicScoreCard />
          </div>
        </div>
      </div>
    </section>
  )
}
