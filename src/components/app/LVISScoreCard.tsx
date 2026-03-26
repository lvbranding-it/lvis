'use client'

import { FileSearchIcon } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { indexColor, getIndexColor } from '@/lib/scoring/index-colors'

// ─── Score helpers ──────────────────────────────────────────────────────────
// All band colours flow through getIndexColor() — consistent with PDF, certificates, charts.

/** Returns the brand colour for a given score (gauge ring, bar fill, badge bg). */
function scoreStrokeColor(score: number): string {
  return indexColor(score)
}

/** Alias kept for bar-fill calls — same underlying function. */
const scoreBarColor = scoreStrokeColor

/** One-line confidence subtitle shown under the classification text. */
function scoreSubtitle(score: number, confidence: string): string {
  const { classification } = getIndexColor(score)
  if (score <= 20) return confidence === 'high' ? `Verified ${classification}` : `Likely ${classification}`
  if (score <= 40) return confidence === 'high' ? `Confirmed: ${classification}` : `Likely ${classification}`
  return classification
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'completed': return '#22C55E'
    case 'analyzing': return '#60A5FA'
    case 'in_review': return '#F59E0B'
    default: return '#64748B'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Complete'
    case 'analyzing': return 'Analyzing'
    case 'in_review': return 'In Review'
    default: return status
  }
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface LVISScoreCardProps {
  caseNumber: string
  status: string
  totalScore: number
  classification: string
  confidenceLevel: string
  analyzedAt: string | null
  categories: Array<{ label: string; score: number }>
}

// ─── Component ─────────────────────────────────────────────────────────────

export function LVISScoreCard({
  caseNumber,
  status,
  totalScore,
  classification,
  confidenceLevel,
  analyzedAt,
  categories,
}: LVISScoreCardProps) {
  const score = Math.round(totalScore)
  // Primary band colour — drives all dynamic colour transitions
  const bandColor = scoreStrokeColor(totalScore)
  const subtitle = scoreSubtitle(totalScore, confidenceLevel)
  const dotColor = statusDotColor(status)
  const circumference = 2 * Math.PI * 34

  // CSS transition applied to every color-bearing inline style
  const colorTransition = 'color 0.5s ease-out, background-color 0.5s ease-out, stroke 0.5s ease-out, border-color 0.5s ease-out'

  return (
    <div className="relative w-full">
      {/* Ambient glow — tinted to band colour */}
      <div
        className="absolute -inset-px rounded-xl pointer-events-none transition-opacity duration-500"
        style={{ background: `linear-gradient(to bottom, ${bandColor}22, transparent)` }}
      />

      <div className="relative bg-[#0A1628] border border-[#1E3A5F]/60 rounded-xl overflow-hidden shadow-2xl">
        {/* Header bar — macOS traffic lights + title */}
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
          {/* Case reference + status badge */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[#60A5FA] text-[10px] font-mono tracking-widest uppercase mb-1">
                Case Reference
              </p>
              <p className="text-white font-mono text-sm font-semibold tracking-wide">
                {caseNumber}
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-md px-2 py-1"
              style={{
                background: `${dotColor}18`,
                border: `1px solid ${dotColor}40`,
                transition: colorTransition,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: dotColor, transition: colorTransition }}
              />
              <span className="text-[10px] font-medium" style={{ color: dotColor, transition: colorTransition }}>
                {statusLabel(status)}
              </span>
            </div>
          </div>

          {/* Score gauge + classification */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-[#060E1A] rounded-lg border border-white/5">
            {/* SVG circular gauge — outer ring + progress arc */}
            <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1E3A5F" strokeWidth="6" />
                {/* Animated arc — colour transitions via CSS on the SVG element */}
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={bandColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(totalScore / 100) * circumference} ${circumference}`}
                  style={{ transition: `stroke 0.5s ease-out, stroke-dasharray 0.5s ease-out` }}
                />
              </svg>
              {/* Centre index number — coloured to band */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-bold text-2xl leading-none"
                  style={{ color: bandColor, transition: colorTransition }}
                >
                  {score}
                </span>
                <span className="text-[#64748B] text-[9px]">/100</span>
              </div>
            </div>

            {/* Classification text block */}
            <div className="flex-1 min-w-0">
              <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest font-medium mb-1">
                LV Authenticity Index™
              </p>
              {/* Classification label — band colour */}
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color: bandColor, transition: colorTransition }}
              >
                {classification}
              </p>
              {/* Subtitle / confidence hint */}
              <p
                className="text-xs mt-0.5 opacity-80"
                style={{ color: bandColor, transition: colorTransition }}
              >
                {subtitle}
              </p>
              <p className="text-[#475569] text-[10px] mt-1 capitalize">
                Confidence: {confidenceLevel}
              </p>
            </div>

            {/* Classification badge pill */}
            <div
              className="hidden sm:flex shrink-0 items-center rounded-full px-2.5 py-1"
              style={{
                backgroundColor: `${bandColor}22`,
                border: `1px solid ${bandColor}55`,
                transition: colorTransition,
              }}
            >
              <span
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: bandColor, transition: colorTransition }}
              >
                {score}/100
              </span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-2.5">
            <p className="text-[#475569] text-[10px] uppercase tracking-widest font-medium">
              Category Analysis
            </p>
            {categories.map((cat) => {
              const barColor = scoreBarColor(cat.score)
              return (
                <div key={cat.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8] text-[11px] font-medium">{cat.label}</span>
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: barColor, transition: colorTransition }}
                    >
                      {Math.round(cat.score)}/100
                    </span>
                  </div>
                  <div className="h-1 bg-[#1E3A5F] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.score}%`,
                        backgroundColor: barColor,
                        transition: `width 0.5s ease-out, background-color 0.5s ease-out`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[#334155] text-[10px] font-mono">
              {analyzedAt ? `Analyzed: ${formatDate(analyzedAt)}` : 'Analysis complete'}
            </span>
            <span className="text-[#334155] text-[10px]">LVIS™ v1.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
