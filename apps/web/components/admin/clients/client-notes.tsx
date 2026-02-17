'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, StickyNote, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { formatDate } from '@plio/utils'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getClientNotes,
  addClientNote,
  deleteClientNote,
  type ClientNoteWithDetails,
} from '@/app/(dashboard)/admin/clients/actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ClientNotesProps {
  clientId: string
  canDelete: boolean
}

export function ClientNotes({ clientId, canDelete }: ClientNotesProps) {
  const [notes, setNotes] = useState<ClientNoteWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [isAdding, startAddTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  // Fetch notes on mount
  useEffect(() => {
    setIsLoading(true)
    getClientNotes(clientId).then((result) => {
      if (result.data) {
        setNotes(result.data)
      }
      setIsLoading(false)
    })
  }, [clientId])

  const handleAddNote = () => {
    if (!newContent.trim()) return

    startAddTransition(async () => {
      const fd = new FormData()
      fd.set('client_id', clientId)
      fd.set('content', newContent.trim())

      const result = await addClientNote(fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Note added.')
        setNewContent('')
        // Refresh notes
        const refreshed = await getClientNotes(clientId)
        if (refreshed.data) {
          setNotes(refreshed.data)
        }
      }
    })
  }

  const handleDeleteNote = (noteId: string) => {
    setDeletingId(noteId)
    startDeleteTransition(async () => {
      const result = await deleteClientNote(noteId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Note deleted.')
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
      }
      setDeletingId(null)
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <StickyNote className="h-4 w-4" />
        Notes ({notes.length})
      </h4>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-md border px-3 py-2 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {note.practitionerName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(note.createdAt, 'DD MMM YYYY')}
                  </span>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={isDeleting && deletingId === note.id}
                  >
                    {isDeleting && deletingId === note.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span className="sr-only">Delete note</span>
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add note form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a note..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[60px]"
        />
        <Button
          size="sm"
          onClick={handleAddNote}
          disabled={isAdding || !newContent.trim()}
        >
          {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isAdding ? 'Adding...' : 'Add Note'}
        </Button>
      </div>
    </div>
  )
}
