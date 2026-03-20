'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useModuleStore } from '@/stores/module-store'
import type { Service } from '@plio/db'
import { ServiceTable } from '@/components/services/service-table'
import { ServiceForm } from '@/components/services/service-form'
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
import { createService, updateService, deleteService } from './actions'

interface ServicesPageClientProps {
  services: Service[]
  canWrite: boolean
}

export function ServicesPageClient({ services, canWrite }: ServicesPageClientProps) {
  const getModuleTitle = useModuleStore((s) => s.getModuleTitle)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  async function handleCreate(formData: FormData) {
    const result = await createService(formData)
    if (result.success) setShowCreateDialog(false)
    return result
  }

  async function handleUpdate(formData: FormData) {
    if (!editingService) return { error: 'No service selected' }
    const result = await updateService(editingService.id, formData)
    if (result.success) setEditingService(null)
    return result
  }

  function handleConfirmDelete() {
    if (!deletingService) return
    startDeleteTransition(async () => {
      const result = await deleteService(deletingService.id)
      if (result.error) {
        toast.error(result.error)
      }
      setDeletingService(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getModuleTitle('services')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the services your business offers.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        )}
      </div>

      <ServiceTable
        services={services}
        onEdit={(s) => setEditingService(s)}
        onDelete={(s) => setDeletingService(s)}
      />

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Service</DialogTitle>
          </DialogHeader>
          <ServiceForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              service={editingService}
              onSubmit={handleUpdate}
              onCancel={() => setEditingService(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingService?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingService(null)}>
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
    </div>
  )
}
