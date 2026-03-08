'use client'

import type { Contact } from '@plio/db'
import { Pencil, Trash2 } from 'lucide-react'

export interface ContactWithCount extends Contact {
  dependents_count: number
}

interface ContactTableProps {
  contacts: ContactWithCount[]
  onSelect: (contact: ContactWithCount) => void
  onEdit: (contact: ContactWithCount) => void
  onDelete: (contact: ContactWithCount) => void
}

export function ContactTable({ contacts, onSelect, onEdit, onDelete }: ContactTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 shadow-sm text-center">
        <p className="text-gray-500">No contacts yet. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Tags</th>
            <th className="px-4 py-3 font-medium">Dependents</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelect(contact)}
            >
              <td className="px-4 py-3 font-medium">{contact.name}</td>
              <td className="px-4 py-3 text-gray-600">{contact.email || '--'}</td>
              <td className="px-4 py-3 text-gray-600">{contact.phone || '--'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {contact.tags?.length > 0
                    ? contact.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                        >
                          {tag}
                        </span>
                      ))
                    : <span className="text-gray-400">--</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{contact.dependents_count}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(contact)
                    }}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(contact)
                    }}
                    className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
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
