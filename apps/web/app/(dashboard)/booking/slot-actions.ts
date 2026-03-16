'use server'

import { getTenantId } from '@/lib/auth/cached'
import { getAvailableSlots } from '@/app/(public)/book/[slug]/actions'

export async function getDashboardAvailableSlots(serviceId: string, date: string) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { slots: [] }
  return getAvailableSlots(auth.tenantId, serviceId, date)
}
