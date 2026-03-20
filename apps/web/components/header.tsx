'use client'

import { usePathname } from 'next/navigation'
import { UserNav } from '@/components/user-nav'
import { useModuleStore } from '@/stores/module-store'

/** Routes that map to module slugs — titles come from the module store */
const ROUTE_TO_MODULE: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/calendar': 'calendar',
  '/clients': 'clients',
  '/services': 'services',
  '/team': 'team',
  '/rooms': 'rooms',
  '/invoicing': 'invoicing',
  '/booking': 'booking',
  '/settings': 'settings',
}

/** Non-module routes with fixed titles */
const STATIC_TITLES: Record<string, string> = {
  '/platform/tenants': 'Tenants',
  '/platform/waitlist': 'Waitlist',
  '/platform/settings': 'Platform Settings',
}

interface HeaderProps {
  tenantName: string
}

export function Header({ tenantName }: HeaderProps) {
  const pathname = usePathname()
  const getModuleTitle = useModuleStore((s) => s.getModuleTitle)

  // Check static titles first (platform routes)
  const staticTitle = Object.entries(STATIC_TITLES).find(
    ([route]) => pathname === route || pathname.startsWith(route + '/')
  )?.[1]

  if (staticTitle) {
    return (
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <h1 className="text-lg font-semibold text-foreground">{staticTitle}</h1>
        <UserNav />
      </header>
    )
  }

  // Check module routes — use getModuleTitle for dynamic titles
  const moduleSlug = Object.entries(ROUTE_TO_MODULE).find(
    ([route]) => pathname === route || pathname.startsWith(route + '/')
  )?.[1]

  const title = moduleSlug ? getModuleTitle(moduleSlug) : 'Dashboard'

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <UserNav />
    </header>
  )
}
