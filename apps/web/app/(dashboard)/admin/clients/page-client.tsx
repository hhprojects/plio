'use client'

import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ClientTable } from '@/components/admin/clients/client-table'
import { ClientDetailSheet } from '@/components/admin/clients/client-detail-sheet'
import { ClientForm } from '@/components/admin/clients/client-form'
import type { ClientWithStats } from './actions'

interface ClientsPageClientProps {
  initialClients: ClientWithStats[]
}

export function ClientsPageClient({ initialClients }: ClientsPageClientProps) {
  const [clients] = useState<ClientWithStats[]>(initialClients)

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editClient, setEditClient] = useState<ClientWithStats | null>(null)

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailClient, setDetailClient] = useState<ClientWithStats | null>(null)

  const handleViewDetail = useCallback(
    (client: ClientWithStats) => {
      setDetailClient(client)
      setDetailOpen(true)
    },
    []
  )

  const handleEdit = useCallback((client: ClientWithStats) => {
    setEditClient(client)
    setFormMode('edit')
    setFormOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditClient(null)
    setFormMode('create')
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditClient(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your clients and their records.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Table */}
      <ClientTable
        clients={clients}
        onView={handleViewDetail}
        onEdit={handleEdit}
      />

      {/* Detail sheet */}
      <ClientDetailSheet
        client={detailClient}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Create/Edit form */}
      <ClientForm
        open={formOpen}
        onOpenChange={handleFormClose}
        mode={formMode}
        defaultValues={
          editClient
            ? {
                id: editClient.id,
                full_name: editClient.fullName,
                phone: editClient.phone,
                email: editClient.email,
                date_of_birth: editClient.dateOfBirth,
                notes: editClient.notes,
              }
            : undefined
        }
      />
    </div>
  )
}
