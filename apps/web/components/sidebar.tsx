'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  UserCog,
  DoorOpen,
  Receipt,
  Globe,
  Settings,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TenantModuleWithModule, TenantSettings } from '@plio/db'
import type { LucideIcon } from 'lucide-react'

const SLUG_TO_ROUTE: Record<string, string> = {
  dashboard: '/dashboard',
  calendar: '/calendar',
  clients: '/clients',
  services: '/services',
  team: '/team',
  rooms: '/rooms',
  invoicing: '/invoicing',
  booking: '/booking',
  settings: '/settings',
}

const SLUG_TO_ICON: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  clients: Users,
  services: Briefcase,
  team: UserCog,
  rooms: DoorOpen,
  invoicing: Receipt,
  booking: Globe,
  settings: Settings,
}

// Modules visible by role (admin/super_admin see all enabled modules)
const STAFF_MODULES = ['dashboard', 'calendar', 'clients', 'team']
const CLIENT_MODULES = ['dashboard', 'calendar', 'invoicing']

interface SidebarProps {
  modules: TenantModuleWithModule[]
  role: string
  tenantName: string
  tenantSettings: TenantSettings
}

export function Sidebar({ modules, role, tenantName, tenantSettings }: SidebarProps) {
  const pathname = usePathname()

  // Filter modules by role
  const visibleModules = modules.filter((m) => {
    if (!m.enabled) return false
    const slug = m.module.slug
    if (role === 'admin' || role === 'super_admin') return true
    if (role === 'staff') return STAFF_MODULES.includes(slug)
    if (role === 'client') return CLIENT_MODULES.includes(slug)
    return false
  })

  const displayName = tenantSettings.business_name || tenantName

  return (
    <aside className="flex w-64 flex-col bg-slate-900 text-white">
      {/* Logo / Business Name */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-5">
        {tenantSettings.logo_url ? (
          <img
            src={tenantSettings.logo_url}
            alt={displayName}
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-500 text-sm font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="truncate text-sm font-semibold">{displayName}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleModules.map((m) => {
          const slug = m.module.slug
          const route = SLUG_TO_ROUTE[slug] ?? `/${slug}`
          const Icon = SLUG_TO_ICON[slug] ?? LayoutDashboard
          const title = m.custom_title ?? m.module.default_title
          const isActive = pathname === route || pathname.startsWith(route + '/')

          return (
            <Link
              key={m.id}
              href={route}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section — Platform link for super_admin */}
      {role === 'super_admin' && (
        <div className="border-t border-slate-700 px-3 py-3">
          <Link
            href="/admin/platform"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/admin/platform')
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Shield className="h-5 w-5 shrink-0" />
            <span>Platform</span>
          </Link>
        </div>
      )}
    </aside>
  )
}
