'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import type { Service } from '@plio/db'
import { ServiceTable } from '@/components/services/service-table'
import { ServiceForm } from '@/components/services/service-form'
import { createService, updateService, deleteService } from './actions'

interface ServicesPageClientProps {
  services: Service[]
  canWrite: boolean
}

export function ServicesPageClient({ services, canWrite }: ServicesPageClientProps) {
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
        alert(result.error)
      }
      setDeletingService(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
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
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create Service</h2>
            <ServiceForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Service</h2>
            <ServiceForm
              service={editingService}
              onSubmit={handleUpdate}
              onCancel={() => setEditingService(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deletingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Delete Service</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingService.name}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingService(null)}
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
    </div>
  )
}
