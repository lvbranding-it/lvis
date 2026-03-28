'use client'

import Link from 'next/link'
import { Lock, Zap, FileText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

interface SampleReportGateProps {
  isGated: boolean
  children: React.ReactNode
}

/**
 * Wraps forensic analysis content for free-tier users.
 * When gated: blurs the content and overlays an upgrade CTA.
 * When not gated: renders children directly with zero overhead.
 */
export function SampleReportGate({ isGated, children }: SampleReportGateProps) {
  if (!isGated) return <>{children}</>

  return (
    <div className="relative">
      {/* Blurred preview — free users see the shape of content but not the details */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border bg-card shadow-lg p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="size-5 text-primary" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-base">Full Report Locked</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upgrade to access the complete forensic analysis: evidence breakdown,
              metadata findings, AI observations, and downloadable PDF.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/app/billing"
              className={cn(buttonVariants({ size: 'sm' }), 'w-full justify-center')}
            >
              <Zap className="size-3.5 mr-1.5" />
              Upgrade to Pro — $49/mo
            </Link>
            <Link
              href="/app/billing?plan=unit"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-center')}
            >
              <FileText className="size-3.5 mr-1.5" />
              Buy Single Report — $9.99
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
