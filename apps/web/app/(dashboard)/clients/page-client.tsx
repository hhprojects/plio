'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useModuleStore } from '@/stores/module-store'
import type { Contact, ContactDependent, ContactNote } from '@plio/db'
import { ContactTable, type ContactWithCount } from '@/components/clients/contact-table'
import { ContactForm } from '@/components/clients/contact-form'
import { ContactDetail } from '@/components/clients/contact-detail'
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
  createContact,
  updateContact,
  deleteContact,
  fetchContactDependents,
  fetchContactNotes,
} from './actions'

interface ContactNoteWithAuthor extends ContactNote {
  team_member: { name: string } | null
}

interface ClientsPageClientProps {
  contacts: ContactWithCount[]
  canWrite: boolean
}

export function ClientsPageClient({ contacts, canWrite }: ClientsPageClientProps) {
  const getModuleTitle = useModuleStore((s) => s.getModuleTitle)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactWithCount | null>(null)
  const [deletingContact, setDeletingContact] = useState<ContactWithCount | null>(null)
  const [selectedContact, setSelectedContact] = useState<ContactWithCount | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  // Detail panel data
  const [dependents, setDependents] = useState<ContactDependent[]>([])
  const [notes, setNotes] = useState<ContactNoteWithAuthor[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Fetch dependents and notes when a contact is selected
  useEffect(() => {
    if (!selectedContact) {
      setDependents([])
      setNotes([])
      return
    }
    let cancelled = false
    setDetailLoading(true)
    Promise.all([
      fetchContactDependents(selectedContact.id),
      fetchContactNotes(selectedContact.id),
    ]).then(([deps, nts]) => {
      if (!cancelled) {
        setDependents(deps as ContactDependent[])
        setNotes(nts as ContactNoteWithAuthor[])
        setDetailLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        toast.error('Failed to load contact details')
        setDetailLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedContact, contacts]) // re-fetch when contacts revalidate

  async function handleCreate(formData: FormData) {
    const result = await createContact(formData)
    if (result.success) setShowCreateDialog(false)
    return result
  }

  async function handleUpdate(formData: FormData) {
    if (!editingContact) return { error: 'No contact selected' }
    const result = await updateContact(editingContact.id, formData)
    if (result.success) setEditingContact(null)
    return result
  }

  function handleConfirmDelete() {
    if (!deletingContact) return
    startDeleteTransition(async () => {
      const result = await deleteContact(deletingContact.id)
      if (result.error) {
        toast.error(result.error)
      } else if (selectedContact?.id === deletingContact.id) {
        setSelectedContact(null)
      }
      setDeletingContact(null)
    })
  }

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className={`flex-1 space-y-6 transition-all ${selectedContact ? 'mr-[480px]' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{getModuleTitle('clients')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage contacts, their dependents, and notes.
            </p>
          </div>
          {canWrite && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </button>
          )}
        </div>

        <ContactTable
          contacts={contacts}
          onSelect={(c) => setSelectedContact(c)}
          onEdit={(c) => setEditingContact(c)}
          onDelete={(c) => setDeletingContact(c)}
        />
      </div>

      {/* Detail panel */}
      {selectedContact && !detailLoading && (
        <ContactDetail
          contact={selectedContact}
          dependents={dependents}
          notes={notes}
          onClose={() => setSelectedContact(null)}
        />
      )}

      {/* Detail loading state */}
      {selectedContact && detailLoading && (
        <div className="fixed inset-y-0 right-0 z-40 w-[480px] bg-white shadow-xl border-l border-gray-200 flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <ContactForm
              contact={editingContact}
              onSubmit={handleUpdate}
              onCancel={() => setEditingContact(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingContact?.name}</strong>? This will
              also remove all dependents and notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingContact(null)}>
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
