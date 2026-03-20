import { getTenantModules, getTenantId } from './cached'
import { notFound } from 'next/navigation'

/**
 * Require that a module is enabled for the current tenant.
 * Call at the top of each module's server page.tsx.
 * Returns the module config if enabled, calls notFound() if disabled.
 */
export async function requireModule(slug: string) {
  const { modules, error } = await getTenantModules()
  if (error) notFound()
  const mod = modules.find((m: { module?: { slug: string } | null }) => m.module?.slug === slug)
  if (!mod || !mod.enabled) notFound()
  return mod
}

/**
 * Require that the user has one of the specified roles.
 * Call after requireModule() for role-restricted pages.
 */
export async function requireRole(allowedRoles: string[]) {
  const auth = await getTenantId()
  if (!auth.role || !allowedRoles.includes(auth.role)) {
    notFound()
  }
  return auth
}
