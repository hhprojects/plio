'use client'

import { useState, useTransition } from 'react'
import { X, Plus, Pencil, Trash2 } from 'lucide-react'
import type { Contact, ContactDependent, ContactNote } from '@plio/db'
import { DependentForm } from './dependent-form'
import {
  addDependent,
  updateDependent,
  removeDependent,
  addContactNote,
} from '@/app/(dashboard)/clients/actions'

interface ContactNoteWithAuthor extends ContactNote {
  team_member: { name: string } | null
}

interface ContactDetailProps {
  contact: Contact
  dependents: ContactDependent[]
  notes: ContactNoteWithAuthor[]
  onClose: () => void
}

export function ContactDetail({ contact, dependents, notes, onClose }: ContactDetailProps) {
  const [showAddDependent, setShowAddDependent] = useState(false)
  const [editingDependent, setEditingDependent] = useState<ContactDependent | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [isAddingNote, startNoteTransition] = useTransition()
  const [isDeletingDep, startDeleteDepTransition] = useTransition()

  async function handleAddDependent(formData: FormData) {
    const result = await addDependent(contact.id, formData)
    if (result.success) setShowAddDependent(false)
    return result
  }

  async function handleUpdateDependent(formData: FormData) {
    if (!editingDependent) return { error: 'No dependent selected' }
    const result = await updateDependent(editingDependent.id, formData)
    if (result.success) setEditingDependent(null)
    return result
  }

  function handleRemoveDependent(depId: string) {
    if (!confirm('Remove this dependent?')) return
    startDeleteDepTransition(async () => {
      const result = await removeDependent(depId)
      if (result.error) alert(result.error)
    })
  }

  function handleAddNote() {
    if (!noteContent.trim()) return
    startNoteTransition(async () => {
      const result = await addContactNote(contact.id, noteContent)
      if (result.error) {
        alert(result.error)
      } else {
        setNoteContent('')
      }
    })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[480px] bg-white shadow-xl border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold">{contact.name}</h2>
        <button
          onClick={onClose}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Contact info */}
        <section className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Email:</span>{' '}
            <span className="text-gray-900">{contact.email || '--'}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Phone:</span>{' '}
            <span className="text-gray-900">{contact.phone || '--'}</span>
          </div>
          {contact.notes && (
            <div className="text-sm">
              <span className="text-gray-500">Notes:</span>{' '}
              <span className="text-gray-900">{contact.notes}</span>
            </div>
          )}
          {contact.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Dependents */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Dependents</h3>
            {!showAddDependent && (
              <button
                onClick={() => setShowAddDependent(true)}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            )}
          </div>

          {showAddDependent && (
            <div className="mb-3">
              <DependentForm
                onSubmit={handleAddDependent}
                onCancel={() => setShowAddDependent(false)}
              />
            </div>
          )}

          {dependents.length === 0 && !showAddDependent ? (
            <p className="text-sm text-gray-400">No dependents</p>
          ) : (
            <ul className="space-y-2">
              {dependents.map((dep) =>
                editingDependent?.id === dep.id ? (
                  <li key={dep.id}>
                    <DependentForm
                      dependent={dep}
                      onSubmit={handleUpdateDependent}
                      onCancel={() => setEditingDependent(null)}
                    />
                  </li>
                ) : (
                  <li
                    key={dep.id}
                    className="flex items-start justify-between rounded-md border border-gray-200 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dep.name}</p>
                      {dep.date_of_birth && (
                        <p className="text-xs text-gray-500">
                          DOB: {formatDate(dep.date_of_birth)}
                        </p>
                      )}
                      {dep.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{dep.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => setEditingDependent(dep)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveDependent(dep.id)}
                        disabled={isDeletingDep}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </section>

        {/* Notes */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Notes</h3>

          {/* Add note form */}
          <div className="mb-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end mt-1">
              <button
                onClick={handleAddNote}
                disabled={isAddingNote || !noteContent.trim()}
                className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                {isAddingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>

          {/* Notes timeline */}
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400">No notes yet</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="border-l-2 border-indigo-200 pl-3">
                  <p className="text-sm text-gray-900">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {note.team_member?.name ?? 'System'} &middot; {formatDateTime(note.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
