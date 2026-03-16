'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(), // comma-separated, split into array
})

const dependentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  date_of_birth: z.string().optional(),
  notes: z.string().optional(),
})

// ── Contacts ──────────────────────────────────────────────────────────────

export async function createContact(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const supabase = await createClient()
  const { error } = await supabase.from('contacts').insert({
    tenant_id: auth.tenantId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
    tags,
    created_by: auth.profileId,
  })

  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function updateContact(id: string, formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const supabase = await createClient()
  const { error } = await supabase
    .from('contacts')
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      tags,
    })
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function deleteContact(id: string) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

// ── Dependents ────────────────────────────────────────────────────────────

export async function addDependent(contactId: string, formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = dependentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('contact_dependents').insert({
    tenant_id: auth.tenantId,
    contact_id: contactId,
    name: parsed.data.name,
    date_of_birth: parsed.data.date_of_birth || null,
    notes: parsed.data.notes || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function updateDependent(id: string, formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = dependentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('contact_dependents')
    .update({
      name: parsed.data.name,
      date_of_birth: parsed.data.date_of_birth || null,
      notes: parsed.data.notes || null,
    })
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function removeDependent(id: string) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('contact_dependents')
    .delete()
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

// ── Notes ─────────────────────────────────────────────────────────────────

export async function addContactNote(contactId: string, content: string) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  if (!content.trim()) {
    return { error: 'Note content is required' }
  }

  // Look up team_member_id for the current user's profile
  const supabase = await createClient()
  let teamMemberId: string | null = null
  if (auth.profileId) {
    const { data: tm } = await supabase
      .from('team_members')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .eq('profile_id', auth.profileId)
      .single()
    teamMemberId = tm?.id ?? null
  }

  const { error } = await supabase.from('contact_notes').insert({
    tenant_id: auth.tenantId,
    contact_id: contactId,
    team_member_id: teamMemberId,
    content: content.trim(),
  })

  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

// ── Fetch helpers (called from server page) ───────────────────────────────

export async function fetchContactDependents(contactId: string) {
  const auth = await getTenantId()
  if (!auth.tenantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('contact_dependents')
    .select('*')
    .eq('contact_id', contactId)
    .eq('tenant_id', auth.tenantId)
    .order('name')

  return data ?? []
}

export async function fetchContactNotes(contactId: string) {
  const auth = await getTenantId()
  if (!auth.tenantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('contact_notes')
    .select('*, team_member:team_members(name)')
    .eq('contact_id', contactId)
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })

  return data ?? []
}
