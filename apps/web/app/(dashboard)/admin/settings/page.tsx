import { Suspense } from 'react'
import { getTenantSettings } from './actions'
import { SettingsPageClient } from './page-client'

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading settings...</div>}>
      <SettingsData />
    </Suspense>
  )
}

async function SettingsData() {
  const result = await getTenantSettings()
  return <SettingsPageClient initialSettings={result.data?.settings as Record<string, unknown> | undefined} businessType={result.data?.business_type} tenantName={result.data?.tenant_name} />
}
