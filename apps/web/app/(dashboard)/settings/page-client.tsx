'use client'

import { useState } from 'react'
import { BrandingForm } from '@/components/settings/branding-form'
import { ModuleConfig } from '@/components/settings/module-config'

interface SettingsPageClientProps {
  tenant: {
    id: string
    name: string
    settings: {
      business_name?: string
      accent_color?: string
      logo_url?: string
    } | null
  } | null
  tenantModules: Array<{
    id: string
    tenant_id: string
    module_id: string
    enabled: boolean
    custom_title: string | null
    sort_order: number
    config: Record<string, unknown>
    module: {
      id: string
      slug: string
      default_title: string
      icon: string
      always_on: boolean
      dependencies: string[]
    }
  }>
}

const tabs = ['Branding', 'Modules'] as const
type Tab = (typeof tabs)[number]

export function SettingsPageClient({ tenant, tenantModules }: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Branding')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your branding and configure modules.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Branding' && (
        <BrandingForm
          settings={tenant?.settings ?? {}}
          tenantName={tenant?.name ?? ''}
        />
      )}

      {activeTab === 'Modules' && (
        <ModuleConfig tenantModules={tenantModules} />
      )}
    </div>
  )
}
