'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
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
// Helper: get tenant ID for the current user
// ---------------------------------------------------------------------------

async function getTenantId(): Promise<{ tenantId: string | null; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { tenantId: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { tenantId: null, error: 'Profile not found' }
  }

  return { tenantId: profile.tenant_id }
}

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
  courseTitle: string
  colorCode: string
  tutorName: string
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

  // 2. Count today's scheduled class_instances per room
  const today = toSGDate(new Date())
  const roomIds = rooms.map((r) => r.id)

  const { data: todayInstances } = await supabase
    .from('class_instances')
    .select('room_id')
    .in('room_id', roomIds)
    .eq('date', today)
    .eq('status', 'scheduled')
    .eq('tenant_id', tenantId)

  const classCountMap: Record<string, number> = {}
  for (const instance of todayInstances ?? []) {
    if (instance.room_id) {
      classCountMap[instance.room_id] = (classCountMap[instance.room_id] ?? 0) + 1
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

  // Fetch class_instances for this room and date, joined with course and tutor
  const { data: instances, error: queryError } = await supabase
    .from('class_instances')
    .select(
      `
      start_time,
      end_time,
      courses!inner(title, color_code),
      profiles!class_instances_tutor_id_fkey(full_name)
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

  const slots: RoomUtilizationSlot[] = (instances ?? []).map((inst) => {
    const course = inst.courses as unknown as { title: string; color_code: string }
    const profile = inst.profiles as unknown as { full_name: string } | null

    return {
      startTime: inst.start_time,
      endTime: inst.end_time,
      courseTitle: course?.title ?? 'Unknown',
      colorCode: course?.color_code ?? '#6366f1',
      tutorName: profile?.full_name ?? 'Unassigned',
    }
  })

  return { data: slots }
}
