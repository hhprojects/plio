'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'

// ── Status updates ──────────────────────────────────────────────────────

export async function updateBookingStatus(
  sessionId: string,
  status: 'completed' | 'no_show' | 'cancelled'
) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)
    .eq('tenant_id', auth.tenantId)
    .eq('type', 'appointment')

  if (error) return { error: error.message }

  // Also update enrollment status if cancelling
  if (status === 'cancelled') {
    await supabase
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('session_id', sessionId)
      .eq('tenant_id', auth.tenantId)
  }

  revalidatePath('/booking')
  return { success: true }
}

// ── Reschedule ──────────────────────────────────────────────────────────

const rescheduleSchema = z.object({
  sessionId: z.string().uuid(),
  team_member_id: z.string().uuid(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
})

export async function rescheduleBooking(data: z.infer<typeof rescheduleSchema>) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const parsed = rescheduleSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { sessionId, team_member_id, date, start_time, end_time } = parsed.data

  const supabase = await createClient()

  // Check for conflicts
  const { data: conflicts } = await supabase
    .from('sessions')
    .select('id')
    .eq('tenant_id', auth.tenantId)
    .eq('team_member_id', team_member_id)
    .eq('date', date)
    .neq('status', 'cancelled')
    .neq('id', sessionId)
    .lt('start_time', end_time)
    .gt('end_time', start_time)

  if (conflicts && conflicts.length > 0) {
    return { error: 'This slot conflicts with an existing booking' }
  }

  const { error } = await supabase
    .from('sessions')
    .update({ team_member_id, date, start_time, end_time })
    .eq('id', sessionId)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }

  revalidatePath('/booking')
  return { success: true }
}

// ── Settings: Toggle service bookable ───────────────────────────────────

export async function toggleServiceBookable(serviceId: string, bookable: boolean) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('services')
    .update({ type: bookable ? 'bookable' : 'recurring' })
    .eq('id', serviceId)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }

  revalidatePath('/booking')
  return { success: true }
}

// ── Settings: Update team availability ──────────────────────────────────

const availabilitySchema = z.object({
  team_member_id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
})

export async function upsertTeamAvailability(data: z.infer<typeof availabilitySchema>) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const parsed = availabilitySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()

  // Check if entry exists
  const { data: existing } = await supabase
    .from('team_availability')
    .select('id')
    .eq('tenant_id', auth.tenantId)
    .eq('team_member_id', parsed.data.team_member_id)
    .eq('day_of_week', parsed.data.day_of_week)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('team_availability')
      .update({
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
      })
      .eq('id', existing.id)
      .eq('tenant_id', auth.tenantId)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('team_availability')
      .insert({
        tenant_id: auth.tenantId,
        team_member_id: parsed.data.team_member_id,
        day_of_week: parsed.data.day_of_week,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/booking')
  return { success: true }
}

export async function deleteTeamAvailability(availabilityId: string) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_availability')
    .delete()
    .eq('id', availabilityId)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }

  revalidatePath('/booking')
  return { success: true }
}

// ── Settings: Update appearance ─────────────────────────────────────────

const appearanceSchema = z.object({
  accent_color: z.string().optional(),
  logo_url: z.string().optional(),
})

export async function updateBookingAppearance(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = appearanceSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()

  // Fetch current settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', auth.tenantId)
    .single()

  const currentSettings = (tenant?.settings as Record<string, unknown>) ?? {}
  const newSettings = {
    ...currentSettings,
    accent_color: parsed.data.accent_color || currentSettings.accent_color,
    logo_url: parsed.data.logo_url ?? currentSettings.logo_url,
  }

  const { error } = await supabase
    .from('tenants')
    .update({ settings: newSettings })
    .eq('id', auth.tenantId)

  if (error) return { error: error.message }

  revalidatePath('/booking')
  revalidatePath('/settings')
  return { success: true }
}
