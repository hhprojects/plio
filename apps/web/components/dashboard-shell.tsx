'use client'

import { useEffect } from 'react'
import { useModuleStore } from '@/stores/module-store'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import type { TenantModuleWithModule, TenantSettings } from '@plio/db'

interface DashboardShellProps {
  modules: TenantModuleWithModule[]
  role: string
  tenantName: string
  tenantSettings: TenantSettings
  children: React.ReactNode
}

export function DashboardShell({ modules, role, tenantName, tenantSettings, children }: DashboardShellProps) {
  const setModules = useModuleStore((s) => s.setModules)

  useEffect(() => {
    setModules(modules)
  }, [modules, setModules])

  return (
    <div className="flex h-screen">
      <Sidebar modules={modules} role={role} tenantName={tenantName} tenantSettings={tenantSettings} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header tenantName={tenantName} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
