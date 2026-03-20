'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useModuleStore } from '@/stores/module-store'
import type { TeamMember, TeamAvailability } from '@plio/db'
import { TeamTable } from '@/components/team/team-table'
import { TeamForm } from '@/components/team/team-form'
import { AvailabilityForm } from '@/components/team/availability-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createTeamMember, updateTeamMember, deleteTeamMember, updateAvailability } from './actions'

type TeamMemberWithAvailability = TeamMember & {
  team_availability: TeamAvailability[]
}

interface TeamPageClientProps {
  members: TeamMemberWithAvailability[]
  canWrite: boolean
}

export function TeamPageClient({ members, canWrite }: TeamPageClientProps) {
  const getModuleTitle = useModuleStore((s) => s.getModuleTitle)
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
        toast.error(result.error)
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
          <h1 className="text-2xl font-bold tracking-tight">{getModuleTitle('team')}</h1>
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
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <TeamForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <TeamForm
              member={editingMember}
              onSubmit={handleUpdate}
              onCancel={() => setEditingMember(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingMember?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingMember(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Availability Side Panel */}
      <Sheet open={!!showAvailabilitySheet} onOpenChange={(open) => !open && setShowAvailabilitySheet(null)}>
        <SheetContent className="w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Availability</SheetTitle>
            <SheetDescription>{showAvailabilitySheet?.name}</SheetDescription>
          </SheetHeader>
          {showAvailabilitySheet && (
            <div className="pt-4">
              <AvailabilityForm
                availability={showAvailabilitySheet.team_availability}
                onSave={handleSaveAvailability}
                onCancel={() => setShowAvailabilitySheet(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
