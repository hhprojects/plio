import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/module-guard'
import { getTeamMembers, getInvitations } from './actions'
import { TeamPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function TeamPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TeamData />
    </Suspense>
  )
}

async function TeamData() {
  await requireRole(['admin', 'super_admin'])
  const [teamResult, invitationsResult] = await Promise.all([
    getTeamMembers(),
    getInvitations(),
  ])

  return (
    <TeamPageClient
      initialTeam={teamResult.data ?? []}
      initialInvitations={invitationsResult.data ?? []}
    />
  )
}
