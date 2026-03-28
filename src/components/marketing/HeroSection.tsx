import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LvisLogoFull } from '@/components/brand/LvisLogoFull'
import { QualitySeal } from '@/components/brand/QualitySeal'

export function HeroSection() {
  return (
    <section className="relative h-screen overflow-hidden">
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroImageIn {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .hero-badge { animation: heroFadeUp 0.7s ease both 0.05s; }
        .hero-logo  { animation: heroFadeUp 0.7s ease both 0.15s; }
        .hero-tag   { animation: heroFadeUp 0.7s ease both 0.25s; }
        .hero-desc  { animation: heroFadeUp 0.7s ease both 0.35s; }
        .hero-ctas  { animation: heroFadeUp 0.7s ease both 0.45s; }
        .hero-image {
          animation:
            heroImageIn 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both,
            heroFloat 7s ease-in-out 1.3s infinite;
        }
      `}</style>

      {/* Video background */}
      <video
        src="/marketing/lvis-hero-bg.mp4"
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0F172A]/72 pointer-events-none z-10" />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div
          className="absolute top-1/3 left-1/4 w-[700px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse at center, #1D4ED8 0%, transparent 70%)' }}
        />
      </div>

      {/* Right panel: image fills full height absolutely */}
      <div className="absolute inset-y-0 right-[6%] w-[52%] z-30 pointer-events-none">
        <div className="relative h-full w-full hero-image">
          <Image
            src="/marketing/lvis-hero.png"
            alt="LV Authenticity Index™ sample report"
            fill
            className="object-contain object-center"
            priority
          />
        </div>
      </div>

      {/* Left panel: text — same horizontal container as navbar */}
      <div className="relative z-30 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-full w-full lg:w-[48%] flex flex-col justify-center py-20">

          <div className="hero-badge inline-flex items-center gap-3 self-start
                          bg-[#1E3A5F]/50 border border-[#2D5A8E]/40 rounded-full px-4 py-1.5 mb-8">
            <QualitySeal size={24} sealColor="#1E3A5F" detailColor="#60A5FA" />
            <span className="text-[#93C5FD] text-xs font-medium tracking-wide">
              Professional Forensic Photography Platform
            </span>
          </div>

          <div className="hero-logo mb-3">
            <LvisLogoFull width={340} className="text-white" />
          </div>

          <p className="hero-tag text-white text-2xl italic mb-6">
            Integrity you can verify.
          </p>

          <p className="hero-desc text-[#94A3B8] text-base leading-relaxed mb-10">
            LVIS™ delivers structured, evidence-based forensic analysis of photographic images. Using the proprietary{' '}
            <strong className="text-[#CBD5E1] font-medium">LV Authenticity Index™</strong>, every image is evaluated
            across five critical dimensions — provenance, file integrity, visual consistency, manipulation likelihood,
            and synthetic risk — producing a defensible risk score for professional and legal contexts.
          </p>

          <div className="hero-ctas flex flex-col sm:flex-row gap-3">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium px-6 h-11 text-sm w-full sm:w-auto">
                Get Started Free
                <ArrowRightIcon className="size-4 ml-1" />
              </Button>
            </Link>
            <Link href="#authenticity-index">
              <Button variant="outline" size="lg" className="border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:bg-white/5 hover:border-[#2D5A8E] font-medium px-6 h-11 text-sm w-full sm:w-auto bg-transparent">
                Learn About the LV Authenticity Index™
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
