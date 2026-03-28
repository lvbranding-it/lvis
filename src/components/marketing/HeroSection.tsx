import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LvisLogoFull } from '@/components/brand/LvisLogoFull'
import { QualitySeal } from '@/components/brand/QualitySeal'

export function HeroSection() {
  return (
    <section className="relative h-screen flex overflow-hidden">
      {/* Keyframe definitions */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroImageIn {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .hero-badge  { animation: heroFadeUp 0.7s ease both; animation-delay: 0.05s; }
        .hero-logo   { animation: heroFadeUp 0.7s ease both; animation-delay: 0.15s; }
        .hero-tag    { animation: heroFadeUp 0.7s ease both; animation-delay: 0.25s; }
        .hero-desc   { animation: heroFadeUp 0.7s ease both; animation-delay: 0.35s; }
        .hero-ctas   { animation: heroFadeUp 0.7s ease both; animation-delay: 0.45s; }
        .hero-image  {
          animation:
            heroImageIn 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both,
            heroFloat   7s ease-in-out 1.3s infinite;
        }
      `}</style>

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
      <div className="absolute inset-0 bg-[#0F172A]/72 pointer-events-none z-10" />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div
          className="absolute top-1/3 left-1/3 w-[700px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse at center, #1D4ED8 0%, transparent 70%)' }}
        />
      </div>

      {/* Layout: flex row, left text 40%, right image 60% */}
      <div className="relative z-30 w-full flex items-center">

        {/* Left: text block */}
        <div className="flex-none w-full lg:w-[42%] flex flex-col justify-center
                        px-6 sm:px-10 lg:pl-16 xl:pl-24 lg:pr-10 py-24">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-3 self-center lg:self-start
                          bg-[#1E3A5F]/50 border border-[#2D5A8E]/40 rounded-full px-4 py-1.5 mb-8">
            <QualitySeal size={24} sealColor="#1E3A5F" detailColor="#60A5FA" />
            <span className="text-[#93C5FD] text-xs font-medium tracking-wide">
              Professional Forensic Photography Platform
            </span>
          </div>

          {/* Logo wordmark */}
          <div className="hero-logo mb-3 flex justify-center lg:justify-start">
            <LvisLogoFull width={340} className="text-white" />
          </div>

          {/* Tagline */}
          <p className="hero-tag text-white text-2xl italic mb-6 text-center lg:text-left">
            Integrity you can verify.
          </p>

          {/* Description */}
          <p className="hero-desc text-[#94A3B8] text-base leading-relaxed mb-10 text-center lg:text-left">
            LVIS™ delivers structured, evidence-based forensic analysis of photographic images. Using the proprietary{' '}
            <strong className="text-[#CBD5E1] font-medium">LV Authenticity Index™</strong>, every image is evaluated
            across five critical dimensions — provenance, file integrity, visual consistency, manipulation likelihood,
            and synthetic risk — producing a defensible risk score for professional and legal contexts.
          </p>

          {/* CTA Buttons */}
          <div className="hero-ctas flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
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

        {/* Right: image — fills remaining 60%, aligned to bottom */}
        <div className="hidden lg:flex flex-1 h-full items-end justify-center pr-8 xl:pr-12">
          <Image
            src="/marketing/lvis-hero.png"
            alt="LV Authenticity Index™ sample report"
            width={900}
            height={1125}
            className="hero-image w-full max-w-[680px] object-contain object-bottom"
            priority
          />
        </div>

      </div>
    </section>
  )
}
