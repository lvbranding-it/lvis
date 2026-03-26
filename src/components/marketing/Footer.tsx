import Link from 'next/link'
import { ShieldCheckIcon } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#060E1A] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo + tagline */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded bg-[#1E3A5F] border border-[#2D5A8E]/40">
                <ShieldCheckIcon className="size-4 text-[#60A5FA]" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">LVIS™</span>
            </div>
            <p className="text-[#475569] text-sm leading-relaxed max-w-xs">
              Luis Velasquez Image Integrity System™ — Professional forensic photography analysis and evidence-based image integrity evaluation.
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
        <div className="mt-10 pt-6 border-t border-white/5">
          <p className="text-[#334155] text-xs text-center">
            LVIS™ — Luis Velasquez Image Integrity System™ &nbsp;|&nbsp; © 2026 Luis Velasquez. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
