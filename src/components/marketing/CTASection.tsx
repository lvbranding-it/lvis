import Link from 'next/link'
import { ShieldCheckIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="bg-[#060E1A] py-24 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E3A5F]/50 border border-[#2D5A8E]/40 mx-auto mb-6">
          <ShieldCheckIcon className="size-7 text-[#60A5FA]" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
          Ready to Verify Image Integrity?
        </h2>
        <p className="text-[#64748B] text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
          Whether you need forensic analysis for a legal proceeding, a competition review, or editorial publication — LVIS™ delivers structured, evidence-based results.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/request">
            <Button
              size="lg"
              className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium px-8 h-12 text-base w-full sm:w-auto"
            >
              Request an Analysis
              <ArrowRightIcon className="size-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button
              variant="outline"
              size="lg"
              className="border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-white/5 hover:border-[#2D5A8E] font-medium px-8 h-12 text-base w-full sm:w-auto bg-transparent"
            >
              Create a Free Account
            </Button>
          </Link>
        </div>

        <p className="text-[#334155] text-xs mt-6">
          No subscription required for a single analysis. See{' '}
          <Link href="/pricing" className="text-[#475569] hover:text-[#64748B] underline underline-offset-2">
            pricing
          </Link>{' '}
          for all options.
        </p>
      </div>
    </section>
  )
}
