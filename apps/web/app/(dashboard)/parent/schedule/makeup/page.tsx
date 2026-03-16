import { getParentSchedule, getAvailableMakeupSlots } from '../actions'
import { MakeupPageClient } from './page-client'

export default async function MakeupPage() {
  const scheduleResult = await getParentSchedule()
  const children = scheduleResult.data?.children ?? []

  // If there's at least one child, pre-fetch slots
  let initialSlots: Array<Record<string, unknown>> = []
  if (children.length > 0) {
    const slotsResult = await getAvailableMakeupSlots(children[0].id)
    initialSlots = slotsResult.data ?? []
  }

  return (
    <MakeupPageClient
      students={children}
      initialSlots={initialSlots}
    />
  )
}
