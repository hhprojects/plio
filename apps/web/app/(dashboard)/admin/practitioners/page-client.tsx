'use client'

import { useCallback, useState } from 'react'

import { PractitionerTable } from '@/components/admin/practitioners/practitioner-table'
import { PractitionerDetailSheet } from '@/components/admin/practitioners/practitioner-detail-sheet'
import type { PractitionerWithCounts } from './actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PractitionersPageClientProps {
  initialPractitioners: PractitionerWithCounts[]
}

export function PractitionersPageClient({
  initialPractitioners,
}: PractitionersPageClientProps) {
  const [practitioners] = useState<PractitionerWithCounts[]>(initialPractitioners)

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailPractitioner, setDetailPractitioner] =
    useState<PractitionerWithCounts | null>(null)

  const handleView = useCallback((practitioner: PractitionerWithCounts) => {
    setDetailPractitioner(practitioner)
    setDetailOpen(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practitioners</h1>
          <p className="text-muted-foreground mt-1">
            Manage practitioners and their availability.
          </p>
        </div>
      </div>

      {/* Table */}
      <PractitionerTable practitioners={practitioners} onView={handleView} />

      {/* Detail sheet */}
      <PractitionerDetailSheet
        practitioner={detailPractitioner}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
