'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  role_title: z.string().optional(),
  color: z.string().optional(),
})

export async function createTeamMember(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = teamMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('team_members').insert({
    tenant_id: auth.tenantId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    role_title: parsed.data.role_title || null,
    color: parsed.data.color || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/team')
  return { success: true }
}

export async function updateTeamMember(id: string, formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = teamMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_members')
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      role_title: parsed.data.role_title || null,
      color: parsed.data.color || null,
    })
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/team')
  return { success: true }
}

export async function deleteTeamMember(id: string) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/team')
  return { success: true }
}

export async function updateAvailability(
  teamMemberId: string,
  slots: { day_of_week: number; start_time: string; end_time: string }[]
) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  // Delete existing availability for this member
  const { error: deleteError } = await supabase
    .from('team_availability')
    .delete()
    .eq('team_member_id', teamMemberId)
    .eq('tenant_id', auth.tenantId)

  if (deleteError) return { error: deleteError.message }

  // Insert new slots if any
  if (slots.length > 0) {
    const { error: insertError } = await supabase.from('team_availability').insert(
      slots.map((slot) => ({
        tenant_id: auth.tenantId,
        team_member_id: teamMemberId,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }))
    )

    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/team')
  return { success: true }
}
