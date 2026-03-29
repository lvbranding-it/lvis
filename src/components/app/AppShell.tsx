'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  FolderKanban,
  Users,
  FileText,
  LifeBuoy,
  Menu,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LvisLogoFull } from '@/components/brand/LvisLogoFull'
import { useAuth } from '@/hooks/useAuth'
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from '@/lib/constants'
import type { Profile } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const ICON_MAP = {
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  FolderKanban,
  Users,
  FileText,
  LifeBuoy,
} as const

type IconName = keyof typeof ICON_MAP

interface AppShellProps {
  profile: Profile | null
  children: React.ReactNode
}

function NavItem({
  href,
  label,
  icon,
  badge,
  onClick,
}: {
  href: string
  label: string
  icon: IconName
  badge?: number
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive =
    href === '/app/dashboard'
      ? pathname === href
      : pathname.startsWith(href)
  const Icon = ICON_MAP[icon]

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-[#64748B] hover:bg-white/5 hover:text-white'
      )}
    >
      <Icon
        className={cn(
          'size-4 shrink-0 transition-colors',
          isActive ? 'text-white' : 'text-[#64748B] group-hover:text-white'
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

function SidebarContent({
  profile,
  activeCaseCount,
  onNavClick,
}: {
  profile: Profile | null
  activeCaseCount?: number
  onNavClick?: () => void
}) {
  const { signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-white/5 px-4 py-4">
        <LvisLogoFull width={110} className="text-white" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon as IconName}
            badge={item.href === '/app/cases' ? activeCaseCount : undefined}
            onClick={onNavClick}
          />
        ))}

        {isAdmin && (
          <>
            <div className="mt-4 mb-1.5 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#334155]">
                Admin
              </span>
            </div>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon as IconName}
                onClick={onNavClick}
              />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {profile?.full_name ?? 'User'}
            </p>
            <p className="truncate text-[10px] text-[#475569]">
              {isAdmin ? 'Administrator' : profile?.subscription_tier ?? 'Client'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 rounded-md p-1.5 text-[#475569] transition-colors hover:bg-white/5 hover:text-white"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Breadcrumb() {
  const pathname = usePathname()
  const parts = pathname.replace('/app/', '').split('/').filter(Boolean)

  const crumbs = parts.map((part, i) => {
    const label =
      part.charAt(0).toUpperCase() +
      part
        .slice(1)
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
    const href = '/app/' + parts.slice(0, i + 1).join('/')
    const isLast = i === parts.length - 1
    return { label, href, isLast }
  })

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export function AppShell({ profile, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="dark flex h-screen overflow-hidden bg-[#060E1C] text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#1E293B] bg-[#0A1628] md:flex">
        <SidebarContent profile={profile} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="fixed left-3 top-3 z-40 md:hidden"
            />
          }
        >
          <Menu className="size-4" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-[#0A1628] border-r border-white/5">
          <SidebarContent
            profile={profile}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center border-b border-[#1E293B] bg-[#0A1628] px-4 md:px-6 gap-3">
          {/* Mobile spacer for hamburger */}
          <div className="w-8 md:hidden" />
          <Breadcrumb />
          <div className="flex-1" />
          {/* User avatar in header (mobile-friendly) */}
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white md:hidden">
            {profile?.full_name
              ? profile.full_name
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
              : '?'}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
