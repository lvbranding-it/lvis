'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon } from 'lucide-react'
import { LvisLogoFull } from '@/components/brand/LvisLogoFull'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const purposes = [
  { value: 'competition', label: 'Photography Competition' },
  { value: 'legal', label: 'Legal / Investigative' },
  { value: 'editorial', label: 'Editorial / Media' },
  { value: 'photographer', label: 'Professional Photographer' },
  { value: 'other', label: 'Other' },
]

export default function WelcomePage() {
  const router = useRouter()
  const [purpose, setPurpose] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, company_name: company || null }),
      })
    } catch {
      // Non-blocking — proceed even if save fails
    }
    router.push('/app/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#60A5FA 1px, transparent 1px), linear-gradient(90deg, #60A5FA 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 flex justify-center">
          <LvisLogoFull width={180} className="text-white" />
        </div>

        <Card className="border border-[#1E293B] bg-[#0F1E33] shadow-2xl shadow-black/50">
          <CardHeader className="pb-4 border-b border-[#1E293B] text-center">
            <CardTitle className="text-xl font-bold text-white">
              Welcome to LVIS™
            </CardTitle>
            <CardDescription className="text-[#64748B] text-sm">
              Your account is ready. Tell us a bit about yourself — this helps us tailor your experience.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Purpose */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]">
                What brings you to LVIS™? <span className="text-[#334155] font-normal normal-case tracking-normal">(optional)</span>
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {purposes.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPurpose(purpose === p.value ? null : p.value)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors',
                      purpose === p.value
                        ? 'border-[#2D5A8E] bg-[#1E3A5F]/50 text-white'
                        : 'border-[#1E293B] text-[#64748B] hover:border-[#1E3A5F] hover:text-[#94A3B8]'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <Label
                htmlFor="company"
                className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]"
              >
                Company / Organization <span className="text-[#334155] font-normal normal-case tracking-normal">(optional)</span>
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="e.g. Acme Media, Law Office of…"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="
                  bg-[#0F172A] border-[#1E293B] text-white placeholder:text-[#334155]
                  focus-visible:ring-[#2D5A8E] focus-visible:border-[#2D5A8E]
                  h-10 text-sm
                "
              />
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleContinue}
                disabled={loading}
                className="w-full h-10 text-sm font-semibold bg-[#1D4ED8] hover:bg-[#2563EB] text-white border border-[#2D5A8E] shadow-md shadow-blue-950/30 transition-all duration-150 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up…
                  </span>
                ) : (
                  <>
                    Enter Dashboard
                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className="w-full text-center text-xs text-[#475569] hover:text-[#64748B] transition-colors disabled:opacity-40"
              >
                Skip for now
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
