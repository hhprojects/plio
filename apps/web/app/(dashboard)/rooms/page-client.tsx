'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useModuleStore } from '@/stores/module-store'
import { RoomTable } from '@/components/rooms/room-table'
import { RoomForm } from '@/components/rooms/room-form'
import { createRoom, updateRoom, deleteRoom } from './actions'

interface Room {
  id: string
  tenant_id: string
  name: string
  capacity: number
  is_active: boolean
  created_at: string
}

interface RoomsPageClientProps {
  rooms: Room[]
}

export function RoomsPageClient({ rooms }: RoomsPageClientProps) {
  const getModuleTitle = useModuleStore((s) => s.getModuleTitle)
  const [showDialog, setShowDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingRoom(null)
    setError(null)
    setShowDialog(true)
  }

  function openEdit(room: Room) {
    setEditingRoom(room)
    setError(null)
    setShowDialog(true)
  }

  function closeDialog() {
    setShowDialog(false)
    setEditingRoom(null)
    setError(null)
  }

  async function handleSubmit(formData: FormData) {
    const result = editingRoom
      ? await updateRoom(editingRoom.id, formData)
      : await createRoom(formData)

    if (result.error) {
      setError(result.error)
      return
    }
    closeDialog()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this room?')) return
    const result = await deleteRoom(id)
    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getModuleTitle('rooms')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your rooms and their capacities.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </button>
      </div>

      <RoomTable rooms={rooms} onEdit={openEdit} onDelete={handleDelete} />

      {/* Dialog overlay */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editingRoom ? 'Edit Room' : 'New Room'}
              </h2>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              {error && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <RoomForm
                room={editingRoom}
                onSubmit={handleSubmit}
                onCancel={closeDialog}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
