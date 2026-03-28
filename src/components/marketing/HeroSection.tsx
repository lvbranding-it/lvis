import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LvisLogoFull } from '@/components/brand/LvisLogoFull'
import { QualitySeal } from '@/components/brand/QualitySeal'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video background */}
      <video
        src="/marketing/lvis-hero-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0F172A]/70 pointer-events-none z-10" />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse at center, #1D4ED8 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
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

            {/* Logo wordmark */}
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

          {/* Right: Hero image */}
          <div className="flex justify-center lg:justify-end">
            <Image
              src="/marketing/lvis-hero.png"
              alt="LV Authenticity Index™ sample report"
              width={560}
              height={700}
              className="w-full max-w-lg rounded-2xl shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
