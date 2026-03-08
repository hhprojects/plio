'use client'

import { useTransition } from 'react'
import type { Service } from '@plio/db'

interface ServiceFormProps {
  service?: Service | null
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onCancel: () => void
}

export function ServiceForm({ service, onSubmit, onCancel }: ServiceFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await onSubmit(formData)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={service?.name ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={service?.description ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={service?.type ?? 'recurring'}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="recurring">Recurring</option>
          <option value="bookable">Bookable</option>
        </select>
      </div>

      {/* Duration (shown for bookable) */}
      <div>
        <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">
          Duration (minutes)
        </label>
        <input
          id="duration_minutes"
          name="duration_minutes"
          type="number"
          min={0}
          defaultValue={service?.duration_minutes ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Capacity (shown for recurring) */}
      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
          Capacity
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={0}
          defaultValue={service?.capacity ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price (SGD)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={service?.price ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Currency (hidden default) */}
      <input type="hidden" name="currency" value="SGD" />

      {/* Buffer minutes */}
      <div>
        <label htmlFor="buffer_minutes" className="block text-sm font-medium text-gray-700">
          Buffer (minutes)
        </label>
        <input
          id="buffer_minutes"
          name="buffer_minutes"
          type="number"
          min={0}
          defaultValue={service?.buffer_minutes ?? 0}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Color */}
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">
          Color
        </label>
        <input
          id="color"
          name="color"
          type="color"
          defaultValue={service?.color ?? '#6366f1'}
          className="mt-1 h-10 w-16 cursor-pointer rounded border border-gray-300"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : service ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
