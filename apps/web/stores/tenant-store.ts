import { create } from 'zustand'
import type { TenantSettings } from '@plio/db'

interface TenantStoreState {
  tenantId: string | null
  settings: TenantSettings
  setTenant: (tenantId: string, settings: TenantSettings) => void
}

export const useTenantStore = create<TenantStoreState>((set) => ({
  tenantId: null,
  settings: {},
  setTenant: (tenantId, settings) => set({ tenantId, settings }),
}))
