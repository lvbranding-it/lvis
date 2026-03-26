'use client'

import { useEffect } from 'react'
import { useAnalysis } from '@/hooks/useAnalysis'
import type { AnalysisStatus } from '@/types'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisProgressProps {
  caseId: string
  initialStatus: AnalysisStatus
  onComplete?: () => void
}

const STEPS = [
  {
    id: 'metadata',
    label: 'Extracting Metadata',
    description: 'Running ExifTool — provenance chain, timestamps, software history',
    activeAfter: 0,   // seconds elapsed
  },
  {
    id: 'technical',
    label: 'Technical Forensics',
    description: 'OpenCV ELA, noise variance, clone stamp detection',
    activeAfter: 8,
  },
  {
    id: 'ai',
    label: 'AI Visual Analysis',
    description: 'Claude Vision — lighting coherence, compositing artifacts, synthetic risk',
    activeAfter: 25,
  },
  {
    id: 'scoring',
    label: 'Computing LV Index™',
    description: 'Synthesising evidence layers into weighted authenticity score',
    activeAfter: 50,
  },
]

function deriveCurrentStep(status: AnalysisStatus | null, elapsed: number): number {
  if (status === 'complete') return STEPS.length
  if (status === 'failed') return -1
  if (status === 'pending') return 0

  // status === 'running' — advance steps by elapsed time
  let step = 0
  for (let i = 0; i < STEPS.length; i++) {
    if (elapsed >= STEPS[i].activeAfter) step = i
  }
  return step
}

type StepState = 'complete' | 'active' | 'pending' | 'failed'

function getStepState(
  stepIndex: number,
  currentStep: number,
  status: AnalysisStatus | null,
): StepState {
  if (status === 'failed') return stepIndex <= currentStep ? 'failed' : 'pending'
  if (currentStep === STEPS.length) return 'complete'
  if (stepIndex < currentStep) return 'complete'
  if (stepIndex === currentStep) return 'active'
  return 'pending'
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'complete') return <CheckCircle2 className="h-5 w-5 text-green-500" />
  if (state === 'active') return <Loader2 className="h-5 w-5 text-primary animate-spin" />
  if (state === 'failed') return <XCircle className="h-5 w-5 text-red-500" />
  return <Circle className="h-5 w-5 text-muted-foreground/40" />
}

function formatElapsed(secs: number): string {
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

export function AnalysisProgress({ caseId, initialStatus, onComplete }: AnalysisProgressProps) {
  const { status, error, elapsedSeconds } = useAnalysis(caseId)

  // Fall back to initialStatus while hook hasn't loaded yet
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

  return (
    <div className="rounded-xl border border-dashed bg-muted/10 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            {isComplete ? 'Analysis Complete' : isFailed ? 'Analysis Failed' : 'Analysis In Progress'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isComplete
              ? 'LV Authenticity Index™ computed — loading results…'
              : isFailed
              ? error ?? 'An unexpected error occurred during analysis.'
              : 'Three-layer forensic pipeline running…'}
          </p>
        </div>
        {!isComplete && !isFailed && elapsedSeconds > 0 && (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const state = getStepState(i, currentStep, effectiveStatus)
          const isLast = i === STEPS.length - 1

          return (
            <div key={step.id} className="flex gap-4">
              {/* Left column: icon + connector */}
              <div className="flex flex-col items-center">
                <StepIcon state={state} />
                {!isLast && (
                  <div
                    className={cn(
                      'w-px flex-1 my-1 transition-colors duration-500',
                      state === 'complete' ? 'bg-green-500/40' : 'bg-border',
                    )}
                    style={{ minHeight: 24 }}
                  />
                )}
              </div>

              {/* Right column: content */}
              <div className={cn('pb-6', isLast && 'pb-0')}>
                <p
                  className={cn(
                    'text-sm font-medium leading-5',
                    state === 'complete' && 'text-green-500',
                    state === 'active' && 'text-foreground',
                    state === 'pending' && 'text-muted-foreground/60',
                    state === 'failed' && 'text-red-500',
                  )}
                >
                  {step.label}
                </p>
                {(state === 'active' || state === 'complete') && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      {!isFailed && (
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out',
              isComplete ? 'bg-green-500' : 'bg-primary',
            )}
            style={{
              width: isComplete
                ? '100%'
                : `${Math.min(((currentStep + 0.5) / STEPS.length) * 100, 95)}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}
