'use client'

import { Pencil, Trash2, DoorOpen } from 'lucide-react'

interface Room {
  id: string
  tenant_id: string
  name: string
  capacity: number
  is_active: boolean
  created_at: string
}

interface RoomTableProps {
  rooms: Room[]
  onEdit: (room: Room) => void
  onDelete: (id: string) => void
}

export function RoomTable({ rooms, onEdit, onDelete }: RoomTableProps) {
  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 shadow-sm text-center">
        <DoorOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No rooms yet. Add your first room to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="px-6 py-3 font-medium text-gray-500">Name</th>
            <th className="px-6 py-3 font-medium text-gray-500">Capacity</th>
            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rooms.map((room) => (
            <tr key={room.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{room.name}</td>
              <td className="px-6 py-4 text-gray-600">{room.capacity}</td>
              <td className="px-6 py-4 text-right">
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => onEdit(room)}
                    className="inline-flex items-center gap-1 text-gray-500 hover:text-indigo-600 text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(room.id)}
                    className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
