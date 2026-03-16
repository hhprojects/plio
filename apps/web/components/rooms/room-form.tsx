'use client'

import { useTransition } from 'react'

interface Room {
  id: string
  tenant_id: string
  name: string
  capacity: number
  is_active: boolean
  created_at: string
}

interface RoomFormProps {
  room: Room | null
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
}

export function RoomForm({ room, onSubmit, onCancel }: RoomFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => onSubmit(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={room?.name ?? ''}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="e.g. Room A"
        />
      </div>

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
          Capacity
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          defaultValue={room?.capacity ?? 1}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
        </button>
      </div>
    </form>
  )
}
