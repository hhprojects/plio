import { Suspense } from 'react'
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
