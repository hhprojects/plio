'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'
import { toSGDate } from '@plio/utils'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
})

const updateRoomSchema = createRoomSchema.extend({
  id: z.string().uuid('Room ID is required'),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomWithDetails {
  id: string
  name: string
  capacity: number
  isActive: boolean
  createdAt: string
  classesToday: number
}

export interface RoomUtilizationSlot {
  startTime: string
  endTime: string
  serviceName: string
  color: string
  teamMemberName: string
}

// ---------------------------------------------------------------------------
// getRooms
// ---------------------------------------------------------------------------

export async function getRooms(): Promise<{
  data: RoomWithDetails[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 1. Fetch all rooms for this tenant
  const { data: rooms, error: queryError } = await supabase
    .from('rooms')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!rooms || rooms.length === 0) {
    return { data: [] }
  }

  // 2. Count today's scheduled sessions per room
  const today = toSGDate(new Date())
  const roomIds = rooms.map((r) => r.id)

  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('room_id')
    .in('room_id', roomIds)
    .eq('date', today)
    .eq('status', 'scheduled')
    .eq('tenant_id', tenantId)

  const classCountMap: Record<string, number> = {}
  for (const session of todaySessions ?? []) {
    if (session.room_id) {
      classCountMap[session.room_id] = (classCountMap[session.room_id] ?? 0) + 1
    }
  }

  // 3. Map to RoomWithDetails
  const mapped: RoomWithDetails[] = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity,
    isActive: r.is_active,
    createdAt: r.created_at,
    classesToday: classCountMap[r.id] ?? 0,
  }))

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// createRoom
// ---------------------------------------------------------------------------

export async function createRoom(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    capacity: formData.get('capacity'),
  }

  const parsed = createRoomSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: insertError } = await supabase.from('rooms').insert({
    tenant_id: tenantResult.tenantId,
    name: data.name,
    capacity: data.capacity,
    is_active: true,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/rooms')

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateRoom
// ---------------------------------------------------------------------------

export async function updateRoom(formData: FormData) {
  const raw = {
    id: formData.get('id'),
    name: formData.get('name'),
    capacity: formData.get('capacity'),
  }

  const parsed = updateRoomSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('rooms')
    .update({
      name: data.name,
      capacity: data.capacity,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/rooms')

  return { success: true }
}

// ---------------------------------------------------------------------------
// toggleRoomActive
// ---------------------------------------------------------------------------

export async function toggleRoomActive(roomId: string, isActive: boolean) {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ is_active: isActive })
    .eq('id', roomId)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/rooms')

  return { success: true }
}

// ---------------------------------------------------------------------------
// getRoomUtilization
// ---------------------------------------------------------------------------

export async function getRoomUtilization(
  roomId: string,
  date: string
): Promise<{
  data: RoomUtilizationSlot[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  // Fetch sessions for this room and date, joined with service and team member
  const { data: sessions, error: queryError } = await supabase
    .from('sessions')
    .select(
      `
      start_time,
      end_time,
      service:services(name, color),
      team_member:team_members(name)
    `
    )
    .eq('room_id', roomId)
    .eq('date', date)
    .eq('status', 'scheduled')
    .eq('tenant_id', tenantResult.tenantId)
    .order('start_time', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const slots: RoomUtilizationSlot[] = (sessions ?? []).map((s) => {
    const service = s.service as unknown as { name: string; color: string }
    const teamMember = s.team_member as unknown as { name: string } | null

    return {
      startTime: s.start_time,
      endTime: s.end_time,
      serviceName: service?.name ?? 'Unknown',
      color: service?.color ?? '#6366f1',
      teamMemberName: teamMember?.name ?? 'Unassigned',
    }
  })

  return { data: slots }
}
