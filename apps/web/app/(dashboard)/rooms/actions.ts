'use server'

import { z } from 'zod/v4'
import { revalidatePath } from 'next/cache'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'

const roomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
})

export async function createRoom(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const parsed = roomSchema.safeParse({
    name: formData.get('name'),
    capacity: formData.get('capacity'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('rooms').insert({
    tenant_id: auth.tenantId,
    name: parsed.data.name,
    capacity: parsed.data.capacity,
  })

  if (error) return { error: error.message }
  revalidatePath('/rooms')
  return { success: true }
}

export async function updateRoom(id: string, formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const parsed = roomSchema.safeParse({
    name: formData.get('name'),
    capacity: formData.get('capacity'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('rooms')
    .update({ name: parsed.data.name, capacity: parsed.data.capacity })
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/rooms')
  return { success: true }
}

export async function deleteRoom(id: string) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/rooms')
  return { success: true }
}
