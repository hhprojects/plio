import { create } from 'zustand'
import type { TenantModuleWithModule } from '@plio/db'

interface ModuleStoreState {
  modules: TenantModuleWithModule[]
  setModules: (modules: TenantModuleWithModule[]) => void
  isModuleEnabled: (slug: string) => boolean
  getModuleTitle: (slug: string) => string
}

export const useModuleStore = create<ModuleStoreState>((set, get) => ({
  modules: [],
  setModules: (modules) => set({ modules }),
  isModuleEnabled: (slug) => {
    return get().modules.some((m) => m.module.slug === slug && m.enabled)
  },
  getModuleTitle: (slug) => {
    const mod = get().modules.find((m) => m.module.slug === slug)
    return mod?.custom_title ?? mod?.module.default_title ?? slug
  },
}))
