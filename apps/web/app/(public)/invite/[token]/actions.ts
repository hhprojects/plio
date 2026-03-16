'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const acceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export async function validateInviteToken(token: string) {
  const admin = createAdminClient()

  const { data: invitation, error } = await admin
    .from('invitations')
    .select('id, email, full_name, role, tenant_id, status, expires_at')
    .eq('token', token)
    .single()

  if (error || !invitation) {
    return { valid: false, error: 'Invalid invitation link.' }
  }

  if (invitation.status !== 'pending') {
    return { valid: false, error: 'This invitation has already been used or expired.' }
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: 'This invitation has expired. Please ask your admin to resend it.' }
  }

  // Fetch tenant name
  const { data: tenant } = await admin
    .from('tenants')
    .select('name')
    .eq('id', invitation.tenant_id)
    .single()

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      fullName: invitation.full_name,
      role: invitation.role,
      tenantId: invitation.tenant_id,
      tenantName: tenant?.name ?? 'Unknown',
    },
  }
}

export async function acceptInvitation(formData: FormData) {
  const raw = {
    token: formData.get('token'),
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  }

  const parsed = acceptSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const { token, password } = parsed.data
  const admin = createAdminClient()

  // Re-validate token
  const { data: invitation } = await admin
    .from('invitations')
    .select('id, email, full_name, role, tenant_id, status, expires_at')
    .eq('token', token)
    .single()

  if (!invitation || invitation.status !== 'pending') {
    return { error: 'Invalid or expired invitation.' }
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { error: 'This invitation has expired.' }
  }

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: {
      tenant_id: invitation.tenant_id,
      role: invitation.role,
      full_name: invitation.full_name,
    },
  })

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      return { error: 'An account with this email already exists. Please sign in instead.' }
    }
    return { error: `Failed to create account: ${authError.message}` }
  }

  if (!authData?.user) {
    return { error: 'Failed to create account.' }
  }

  // Mark invitation as accepted
  await admin
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  // Sign in the user using a sign-in link approach
  // Since we used admin.createUser, we need to sign in via a different method
  // The user should go to login page
  return { success: true, redirectTo: '/login' }
}
