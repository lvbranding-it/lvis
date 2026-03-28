'use client'

import { useEffect } from 'react'
import { useAnalysis } from '@/hooks/useAnalysis'
import type { AnalysisStatus } from '@/types'
import { CheckCircle2, XCircle, ScanSearch, FileSearch, Eye, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisProgressProps {
  caseId: string
  initialStatus: AnalysisStatus
  onComplete?: () => void
}

const STEPS = [
  {
    id: 'metadata',
    label: 'EXIF Extraction',
    description: 'Provenance chain, timestamps, software history',
    Icon: FileSearch,
    activeAfter: 0,
  },
  {
    id: 'technical',
    label: 'ELA Forensics',
    description: 'Error level analysis, noise variance, clone detection',
    Icon: ScanSearch,
    activeAfter: 8,
  },
  {
    id: 'ai',
    label: 'Vision Analysis',
    description: 'Lighting coherence, compositing artifacts, synthetic risk',
    Icon: Eye,
    activeAfter: 25,
  },
  {
    id: 'scoring',
    label: 'LV Index™ Score',
    description: 'Synthesising evidence into weighted authenticity score',
    Icon: BarChart3,
    activeAfter: 50,
  },
]

function deriveCurrentStep(status: AnalysisStatus | null, elapsed: number): number {
  if (status === 'complete') return STEPS.length
  if (status === 'failed') return -1
  if (status === 'pending') return 0
  let step = 0
  for (let i = 0; i < STEPS.length; i++) {
    if (elapsed >= STEPS[i].activeAfter) step = i
  }
  return step
}

type StepState = 'complete' | 'active' | 'pending' | 'failed'

function getStepState(stepIndex: number, currentStep: number, status: AnalysisStatus | null): StepState {
  if (status === 'failed') return stepIndex <= currentStep ? 'failed' : 'pending'
  if (currentStep === STEPS.length) return 'complete'
  if (stepIndex < currentStep) return 'complete'
  if (stepIndex === currentStep) return 'active'
  return 'pending'
}

function formatElapsed(secs: number): string {
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

// SVG circular progress ring
function ProgressRing({ progress, failed }: { progress: number; failed: boolean }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(progress, 1))
  const color = failed ? '#EF4444' : progress >= 1 ? '#22C55E' : '#3B82F6'
  const pct = Math.round(Math.min(progress, 1) * 100)

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      {/* Outer glow ring */}
      <circle cx="70" cy="70" r={r + 6} fill="none" stroke={color} strokeWidth="1" opacity="0.12" />
      {/* Track */}
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1E293B" strokeWidth="8" />
      {/* Progress arc */}
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s ease' }}
      />
      {/* Percentage label */}
      <text x="70" y="64" textAnchor="middle" fill="#F8FAFC" fontSize="26" fontWeight="700" fontFamily="monospace">
        {pct}%
      </text>
      <text x="70" y="82" textAnchor="middle" fill="#475569" fontSize="10" fontFamily="sans-serif" letterSpacing="2">
        COMPLETE
      </text>
    </svg>
  )
}

export function AnalysisProgress({ caseId, initialStatus, onComplete }: AnalysisProgressProps) {
  const { status, error, elapsedSeconds } = useAnalysis(caseId)
  const effectiveStatus = status ?? initialStatus

  useEffect(() => {
    if (status === 'complete') {
      const t = setTimeout(() => onComplete?.(), 1200)
      return () => clearTimeout(t)
    }
  }, [status, onComplete])

  const currentStep = deriveCurrentStep(effectiveStatus, elapsedSeconds)
  const isFailed = effectiveStatus === 'failed'
  const isComplete = effectiveStatus === 'complete'
  const isPending = effectiveStatus === 'pending'

  const progress = isComplete
    ? 1
    : isFailed
    ? 0
    : isPending
    ? 0
    : Math.min((currentStep + 0.5) / STEPS.length, 0.95)

  const headerLabel = isComplete
    ? 'Analysis Complete'
    : isFailed
    ? 'Analysis Failed'
    : isPending
    ? 'Queued for Analysis'
    : 'Analysis In Progress'

  const headerSub = isComplete
    ? 'LV Authenticity Index™ computed — loading results…'
    : isFailed
    ? (error ?? 'An unexpected error occurred during analysis.')
    : isPending
    ? 'Your case is in the queue. Processing will begin shortly.'
    : 'Three-layer forensic pipeline running — do not close this page.'

  return (
    <>
      {/* Custom keyframe for scan sweep animation */}
      <style>{`
        @keyframes lvis-scan {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes lvis-pulse-border {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div className="rounded-xl border border-[#1E293B] bg-[#0A1628] overflow-hidden shadow-2xl shadow-black/40">

        {/* ── Header strip ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 px-8 py-6 border-b border-[#1E293B]">
          <ProgressRing progress={progress} failed={isFailed} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {/* Status dot */}
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full shrink-0',
                  isComplete && 'bg-green-500',
                  isFailed  && 'bg-red-500',
                  !isComplete && !isFailed && 'bg-blue-500',
                )}
                style={
                  !isComplete && !isFailed
                    ? { animation: 'lvis-pulse-border 1.6s ease-in-out infinite' }
                    : undefined
                }
              />
              <h3 className="text-base font-bold text-white tracking-tight">{headerLabel}</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed max-w-md">{headerSub}</p>

            {/* Elapsed + case ID row */}
            <div className="flex items-center gap-4 mt-3">
              {elapsedSeconds > 0 && !isComplete && !isFailed && (
                <span className="font-mono text-[11px] text-[#3B82F6] tabular-nums bg-[#0F2040] px-2 py-0.5 rounded">
                  ⏱ {formatElapsed(elapsedSeconds)}
                </span>
              )}
              {isComplete && (
                <span className="font-mono text-[11px] text-green-400 bg-[#0D2416] px-2 py-0.5 rounded">
                  ✓ Completed in {formatElapsed(elapsedSeconds)}
                </span>
              )}
              <span className="text-[10px] text-[#334155] font-mono uppercase tracking-widest">
                LVIS Forensic Pipeline v3
              </span>
            </div>
          </div>
        </div>

        {/* ── Step cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#1E293B]">
          {STEPS.map((step, i) => {
            const state = getStepState(i, currentStep, effectiveStatus)
            const { Icon } = step

            return (
              <div
                key={step.id}
                className="relative overflow-hidden p-5"
                style={
                  state === 'active'
                    ? { animation: 'lvis-pulse-border 2s ease-in-out infinite' }
                    : undefined
                }
              >
                {/* Scan sweep for active step */}
                {state === 'active' && (
                  <div
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-blue-500/15 to-transparent pointer-events-none"
                    style={{ animation: 'lvis-scan 2.2s ease-in-out infinite' }}
                  />
                )}

                {/* Active top border glow */}
                {state === 'active' && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                )}
                {state === 'complete' && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent" />
                )}

                {/* Step number + icon */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={cn(
                      'text-[10px] font-mono font-bold tracking-widest',
                      state === 'complete' && 'text-green-500',
                      state === 'active'   && 'text-blue-400',
                      state === 'pending'  && 'text-[#334155]',
                      state === 'failed'   && 'text-red-500',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-md',
                      state === 'complete' && 'bg-green-500/15',
                      state === 'active'   && 'bg-blue-500/15',
                      state === 'pending'  && 'bg-[#1E293B]',
                      state === 'failed'   && 'bg-red-500/15',
                    )}
                  >
                    {state === 'complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : state === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          state === 'active'  && 'text-blue-400',
                          state === 'pending' && 'text-[#334155]',
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Label */}
                <p
                  className={cn(
                    'text-xs font-semibold leading-tight mb-1',
                    state === 'complete' && 'text-green-400',
                    state === 'active'   && 'text-white',
                    state === 'pending'  && 'text-[#475569]',
                    state === 'failed'   && 'text-red-400',
                  )}
                >
                  {step.label}
                </p>

                {/* Description — only for active/complete */}
                <p
                  className={cn(
                    'text-[10px] leading-relaxed transition-opacity duration-300',
                    (state === 'active' || state === 'complete')
                      ? 'text-[#64748B] opacity-100'
                      : 'opacity-0 h-0 overflow-hidden',
                  )}
                >
                  {step.description}
                </p>

                {/* Active: pulsing indicator */}
                {state === 'active' && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse [animation-delay:0.4s]" />
                    <span className="text-[10px] text-blue-400 ml-0.5">Processing</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Bottom progress bar ───────────────────────────────────────────── */}
        <div className="h-1 w-full bg-[#1E293B]">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.round(progress * 100)}%`,
              background: isFailed
                ? '#EF4444'
                : isComplete
                ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                : 'linear-gradient(90deg, #1D4ED8, #3B82F6, #60A5FA)',
            }}
          />
        </div>

      </div>
    </>
  )
}
