import Link from 'next/link'
import { LvisLogoFull } from '@/components/brand/LvisLogoFull'
import { QualitySeal } from '@/components/brand/QualitySeal'

export function Footer() {
  return (
    <footer className="bg-[#060E1A] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo + tagline */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-start gap-4 mb-4">
              <QualitySeal
                size={64}
                sealColor="#0F172A"
                detailColor="#60A5FA"
              />
              <LvisLogoFull width={140} className="text-white mt-1" />
            </div>
            <p className="text-[#475569] text-sm leading-relaxed max-w-xs">
              Professional forensic photography analysis and evidence-based image integrity evaluation for legal, insurance, and investigative professionals.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[#94A3B8] text-xs font-semibold uppercase tracking-widest mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Services', href: '/services' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Request Analysis', href: '/request' },
                { label: 'Log In', href: '/auth/login' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#64748B] text-sm hover:text-[#94A3B8] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#94A3B8] text-xs font-semibold uppercase tracking-widest mb-4">
              Legal
            </h4>
            <p className="text-[#475569] text-xs leading-relaxed">
              LVIS™ analysis reports are provided for professional and evidentiary reference only. Results reflect technical evidence — they do not constitute legal opinions, expert testimony, or conclusive determinations of authenticity.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <LvisLogoSimpleInline />
          <p className="text-[#334155] text-xs">
            © 2026 Luis Velasquez. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

// Tiny inline wordmark for the bottom bar
function LvisLogoSimpleInline() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 133.36 51.54"
      width={60}
      height={23}
      fill="#334155"
      aria-label="LVIS™"
      role="img"
    >
      <polygon points="9.46 1.28 0 1.28 0 49.32 32.05 49.32 32.05 40.18 9.46 40.18 9.46 1.28"/>
      <polygon points="46.23 28.36 35.25 1.28 23.89 1.28 45.82 51.54 67.75 1.28 56.52 1.28 46.23 28.36"/>
      <rect x="71.99" y="1.28" width="9.46" height="48.04"/>
      <path d="M99.73,10.68c1.17-.83,2.78-1.24,4.83-1.24,1.65,0,3.43.33,5.32.98,1.89.65,3.75,1.48,5.58,2.48l3.59-7.25c-1.92-1.26-4.08-2.35-6.49-3.26-2.42-.91-5.56-1.37-9.43-1.37-2.96.13-5.57.79-7.83,1.99-2.26,1.2-4.01,2.82-5.25,4.86-1.24,2.05-1.86,4.46-1.86,7.25,0,2.31.42,4.25,1.27,5.84.85,1.59,1.96,2.92,3.33,3.98,1.37,1.07,2.84,1.97,4.41,2.71,1.57.74,3.09,1.39,4.57,1.96,1.26.48,2.43,1.04,3.49,1.7,1.07.65,1.91,1.37,2.55,2.15.63.78.95,1.65.95,2.61,0,1.39-.38,2.48-1.14,3.26-.76.78-1.72,1.34-2.87,1.66-1.15.33-2.3.49-3.43.49s-2.37-.17-3.72-.52c-1.35-.35-2.69-.84-4.01-1.47-1.33-.63-2.56-1.36-3.69-2.19l-4.18,7.38c1.7,1.17,3.46,2.14,5.29,2.9,1.83.76,3.69,1.33,5.58,1.7s3.75.55,5.58.55c3.57,0,6.57-.64,9.01-1.93,2.44-1.28,4.29-2.97,5.55-5.06,1.26-2.09,1.89-4.35,1.89-6.79,0-2.31-.33-4.25-.98-5.84-.65-1.59-1.52-2.92-2.61-3.98-1.09-1.07-2.32-1.96-3.69-2.68-1.37-.72-2.75-1.34-4.14-1.86-1.52-.56-2.99-1.2-4.41-1.89-1.41-.7-2.57-1.49-3.46-2.38-.89-.89-1.34-1.9-1.34-3.04,0-1.65.59-2.89,1.76-3.72Z"/>
      <polygon points="122.64 .67 124.59 .67 124.59 6.09 125.32 6.09 125.32 .67 127.26 .67 127.26 0 122.64 0 122.64 .67"/>
      <polygon points="132.6 0 130.5 3.12 128.39 0 127.62 0 127.62 6.09 128.36 6.09 128.36 1.2 130.5 4.36 132.63 1.18 132.63 6.09 133.36 6.09 133.36 0 132.6 0"/>
    </svg>
  )
}
