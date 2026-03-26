'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LvisLogoSimple } from '@/components/brand/LvisLogoSimple'

const navLinks = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A1628]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Wordmark */}
          <Link href="/" className="flex items-center shrink-0" aria-label="LVIS™ Home">
            <LvisLogoSimple width={96} className="text-white" />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'text-white bg-white/10'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link href="/auth/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#94A3B8] hover:text-white hover:bg-white/5"
              >
                Log In
              </Button>
            </Link>
            <Link href="/request">
              <Button
                size="sm"
                className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium"
              >
                Request Analysis
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <button
                    className="inline-flex items-center justify-center size-8 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Open menu"
                  />
                }
              >
                <MenuIcon className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-[#0A1628] border-l border-white/10 w-80"
                showCloseButton={false}
              >
                <SheetHeader className="border-b border-white/10 pb-4">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center">
                      <LvisLogoSimple width={80} className="text-white" />
                    </SheetTitle>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="text-[#64748B] hover:text-white transition-colors p-1"
                      aria-label="Close menu"
                    >
                      <XIcon className="size-5" />
                    </button>
                  </div>
                </SheetHeader>

                <nav className="flex flex-col gap-1 px-4 py-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                        isActive(link.href)
                          ? 'text-white bg-white/10'
                          : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex flex-col gap-2 px-4 pt-4 border-t border-white/10">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#94A3B8] hover:text-white hover:bg-white/5"
                    >
                      Log In
                    </Button>
                  </Link>
                  <Link href="/request" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0">
                      Request Analysis
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
