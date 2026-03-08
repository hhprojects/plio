'use client'

import { useTransition } from 'react'
import type { ContactDependent } from '@plio/db'

interface DependentFormProps {
  dependent?: ContactDependent | null
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onCancel: () => void
}

export function DependentForm({ dependent, onSubmit, onCancel }: DependentFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
      {/* Name */}
      <div>
        <label htmlFor="dep-name" className="block text-xs font-medium text-gray-700">
          Name
        </label>
        <input
          id="dep-name"
          name="name"
          type="text"
          required
          defaultValue={dependent?.name ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label htmlFor="dep-dob" className="block text-xs font-medium text-gray-700">
          Date of Birth
        </label>
        <input
          id="dep-dob"
          name="date_of_birth"
          type="date"
          defaultValue={dependent?.date_of_birth ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="dep-notes" className="block text-xs font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="dep-notes"
          name="notes"
          rows={2}
          defaultValue={dependent?.notes ?? ''}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 px-3 py-1 rounded-md text-xs hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : dependent ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  )
}
