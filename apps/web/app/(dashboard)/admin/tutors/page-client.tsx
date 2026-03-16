'use client'

import { useCallback, useState } from 'react'

import { TutorTable } from '@/components/admin/tutors/tutor-table'
import { TutorDetailSheet } from '@/components/admin/tutors/tutor-detail-sheet'
import type { TutorWithDetails } from './actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TutorsPageClientProps {
  initialTutors: TutorWithDetails[]
}

export function TutorsPageClient({ initialTutors }: TutorsPageClientProps) {
  const [tutors] = useState<TutorWithDetails[]>(initialTutors)

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTutor, setDetailTutor] = useState<TutorWithDetails | null>(null)

  const handleView = useCallback((tutor: TutorWithDetails) => {
    setDetailTutor(tutor)
    setDetailOpen(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutors</h1>
          <p className="text-muted-foreground mt-1">
            View tutor schedules, assigned courses, and hours tracking.
          </p>
        </div>
      </div>

      {/* Table */}
      <TutorTable tutors={tutors} onView={handleView} />

      {/* Detail sheet */}
      <TutorDetailSheet
        tutor={detailTutor}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
