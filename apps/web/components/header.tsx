'use client'

import { usePathname } from 'next/navigation'
import { UserNav } from '@/components/user-nav'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendar',
  '/clients': 'Clients',
  '/services': 'Services',
  '/team': 'Team',
  '/rooms': 'Rooms',
  '/invoicing': 'Invoicing',
  '/booking': 'Booking',
  '/settings': 'Settings',
  '/admin/platform': 'Platform',
}

interface HeaderProps {
  tenantName: string
}

export function Header({ tenantName }: HeaderProps) {
  const pathname = usePathname()

  // Derive page title from pathname
  const title = Object.entries(ROUTE_TITLES).find(
    ([route]) => pathname === route || pathname.startsWith(route + '/')
  )?.[1] ?? 'Dashboard'

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <UserNav />
    </header>
  )
}
