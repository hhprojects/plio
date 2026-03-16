'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['recurring', 'bookable']),
  duration_minutes: z.coerce.number().optional(),
  capacity: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
  currency: z.string().default('SGD'),
  buffer_minutes: z.coerce.number().default(0),
  color: z.string().optional(),
})

export async function createService(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = serviceSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('services').insert({
    tenant_id: auth.tenantId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    type: parsed.data.type,
    duration_minutes: parsed.data.duration_minutes ?? null,
    capacity: parsed.data.capacity ?? null,
    price: parsed.data.price ?? null,
    currency: parsed.data.currency,
    buffer_minutes: parsed.data.buffer_minutes,
    color: parsed.data.color || null,
    active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/services')
  return { success: true }
}

export async function updateService(id: string, formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = serviceSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('services')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      type: parsed.data.type,
      duration_minutes: parsed.data.duration_minutes ?? null,
      capacity: parsed.data.capacity ?? null,
      price: parsed.data.price ?? null,
      currency: parsed.data.currency,
      buffer_minutes: parsed.data.buffer_minutes,
      color: parsed.data.color || null,
    })
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/services')
  return { success: true }
}

export async function deleteService(id: string) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/services')
  return { success: true }
}
