'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  full_name: z.string().min(1, 'Name is required').max(200),
  role: z.enum(['admin', 'staff', 'client']),
})

async function requireAdminAuth() {
  const auth = await getTenantId()
  if (auth.error || !auth.tenantId) return { error: auth.error ?? 'Not authenticated', tenantId: null, profileId: null }
  if (!auth.role || !['admin', 'super_admin'].includes(auth.role)) {
    return { error: 'Not authorized', tenantId: null, profileId: null }
  }
  return { error: null, tenantId: auth.tenantId, profileId: auth.profileId }
}

export async function getTeamMembers() {
  const auth = await requireAdminAuth()
  if (auth.error || !auth.tenantId) return { data: [], error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, phone, is_active, created_at')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function getInvitations() {
  const auth = await requireAdminAuth()
  if (auth.error || !auth.tenantId) return { data: [], error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('id, email, full_name, role, status, expires_at, created_at')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function sendInvitation(formData: FormData) {
  const raw = {
    email: formData.get('email'),
    full_name: formData.get('full_name'),
    role: formData.get('role'),
  }

  const parsed = inviteSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const auth = await requireAdminAuth()
  if (auth.error || !auth.tenantId || !auth.profileId) {
    return { error: auth.error ?? 'Not authorized' }
  }

  const supabase = await createClient()

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from('invitations')
    .select('id, status')
    .eq('tenant_id', auth.tenantId)
    .eq('email', data.email)
    .eq('status', 'pending')
    .single()

  if (existing) {
    return { error: 'An active invitation already exists for this email' }
  }

  const token = crypto.randomUUID()

  const { error: insertError } = await supabase.from('invitations').insert({
    tenant_id: auth.tenantId,
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    invited_by: auth.profileId,
    token,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  // Send invite email (best effort)
  try {
    const { sendEmail, InviteEmail } = await import('@plio/email')
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${origin}/invite/${token}`

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', auth.tenantId)
      .single()

    const { data: inviter } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', auth.profileId)
      .single()

    await sendEmail({
      to: data.email,
      subject: `You're invited to join ${tenant?.name ?? 'a business'} on Plio`,
      react: InviteEmail({
        inviteeName: data.full_name,
        inviterName: inviter?.full_name ?? 'Your admin',
        tenantName: tenant?.name ?? 'the team',
        role: data.role,
        inviteUrl,
      }),
    })
  } catch (emailError) {
    console.error('[invite] Failed to send email:', emailError)
  }

  revalidatePath('/admin/team')
  return { success: true }
}

export async function resendInvitation(invitationId: string) {
  const auth = await requireAdminAuth()
  if (auth.error || !auth.tenantId) return { error: auth.error }

  const supabase = await createClient()

  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('tenant_id', auth.tenantId)
    .single()

  if (!invitation) return { error: 'Invitation not found' }

  const newToken = crypto.randomUUID()

  await supabase
    .from('invitations')
    .update({
      token: newToken,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', invitationId)

  // Resend email (best effort)
  try {
    const { sendEmail, InviteEmail } = await import('@plio/email')
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${origin}/invite/${newToken}`

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', auth.tenantId)
      .single()

    const { data: inviter } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', auth.profileId)
      .single()

    await sendEmail({
      to: invitation.email,
      subject: `Reminder: You're invited to join ${tenant?.name ?? 'a business'} on Plio`,
      react: InviteEmail({
        inviteeName: invitation.full_name,
        inviterName: inviter?.full_name ?? 'Your admin',
        tenantName: tenant?.name ?? 'the team',
        role: invitation.role,
        inviteUrl,
      }),
    })
  } catch (emailError) {
    console.error('[invite] Failed to resend email:', emailError)
  }

  revalidatePath('/admin/team')
  return { success: true }
}

export async function revokeInvitation(invitationId: string) {
  const auth = await requireAdminAuth()
  if (auth.error || !auth.tenantId) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }

  revalidatePath('/admin/team')
  return { success: true }
}
