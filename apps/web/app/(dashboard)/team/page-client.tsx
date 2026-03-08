'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import type { TeamMember, TeamAvailability } from '@plio/db'
import { TeamTable } from '@/components/team/team-table'
import { TeamForm } from '@/components/team/team-form'
import { AvailabilityForm } from '@/components/team/availability-form'
import { createTeamMember, updateTeamMember, deleteTeamMember, updateAvailability } from './actions'

type TeamMemberWithAvailability = TeamMember & {
  team_availability: TeamAvailability[]
}

interface TeamPageClientProps {
  members: TeamMemberWithAvailability[]
  canWrite: boolean
}

export function TeamPageClient({ members, canWrite }: TeamPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMemberWithAvailability | null>(null)
  const [showAvailabilitySheet, setShowAvailabilitySheet] = useState<TeamMemberWithAvailability | null>(null)
  const [deletingMember, setDeletingMember] = useState<TeamMemberWithAvailability | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  async function handleCreate(formData: FormData) {
    const result = await createTeamMember(formData)
    if (result.success) setShowCreateDialog(false)
    return result
  }

  async function handleUpdate(formData: FormData) {
    if (!editingMember) return { error: 'No member selected' }
    const result = await updateTeamMember(editingMember.id, formData)
    if (result.success) setEditingMember(null)
    return result
  }

  function handleConfirmDelete() {
    if (!deletingMember) return
    startDeleteTransition(async () => {
      const result = await deleteTeamMember(deletingMember.id)
      if (result.error) {
        alert(result.error)
      }
      setDeletingMember(null)
    })
  }

  async function handleSaveAvailability(
    slots: { day_of_week: number; start_time: string; end_time: string }[]
  ) {
    if (!showAvailabilitySheet) return { error: 'No member selected' }
    const result = await updateAvailability(showAvailabilitySheet.id, slots)
    if (result.success) setShowAvailabilitySheet(null)
    return result
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your team members and their availability.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Team Member
          </button>
        )}
      </div>

      <TeamTable
        members={members}
        onEdit={(m) => setEditingMember(m)}
        onDelete={(m) => setDeletingMember(m)}
        onAvailability={(m) => setShowAvailabilitySheet(m)}
      />

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add Team Member</h2>
            <TeamForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Team Member</h2>
            <TeamForm
              member={editingMember}
              onSubmit={handleUpdate}
              onCancel={() => setEditingMember(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Delete Team Member</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingMember.name}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingMember(null)}
                className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Side Panel */}
      {showAvailabilitySheet && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowAvailabilitySheet(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[400px] bg-white shadow-xl border-l overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Availability</h2>
                  <p className="text-sm text-gray-500">{showAvailabilitySheet.name}</p>
                </div>
                <button
                  onClick={() => setShowAvailabilitySheet(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  &times;
                </button>
              </div>
              <AvailabilityForm
                availability={showAvailabilitySheet.team_availability}
                onSave={handleSaveAvailability}
                onCancel={() => setShowAvailabilitySheet(null)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
