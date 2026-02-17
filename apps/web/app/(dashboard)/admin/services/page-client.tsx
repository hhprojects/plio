'use client'

import { useCallback, useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ServiceTable } from '@/components/admin/services/service-table'
import { ServiceForm } from '@/components/admin/services/service-form'
import { ServiceDetailSheet } from '@/components/admin/services/service-detail-sheet'
import {
  toggleServiceActive,
  type ServiceWithCounts,
} from './actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ServicesPageClientProps {
  initialServices: ServiceWithCounts[]
}

export function ServicesPageClient({ initialServices }: ServicesPageClientProps) {
  const [services] = useState<ServiceWithCounts[]>(initialServices)
  const [, startTransition] = useTransition()

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editService, setEditService] = useState<ServiceWithCounts | null>(null)

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailService, setDetailService] = useState<ServiceWithCounts | null>(null)

  const handleView = useCallback((service: ServiceWithCounts) => {
    setDetailService(service)
    setDetailOpen(true)
  }, [])

  const handleEdit = useCallback((service: ServiceWithCounts) => {
    setEditService(service)
    setFormMode('edit')
    setFormOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditService(null)
    setFormMode('create')
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditService(null)
    }
  }, [])

  const handleToggleActive = useCallback(
    (serviceId: string, isActive: boolean) => {
      startTransition(async () => {
        const result = await toggleServiceActive(serviceId, isActive)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(
            isActive ? 'Service activated.' : 'Service deactivated.'
          )
        }
      })
    },
    []
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your services, pricing, and duration.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Table */}
      <ServiceTable
        services={services}
        onView={handleView}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      {/* Detail sheet */}
      <ServiceDetailSheet
        service={detailService}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Create/Edit form */}
      <ServiceForm
        open={formOpen}
        onOpenChange={handleFormClose}
        mode={formMode}
        defaultValues={
          editService
            ? {
                id: editService.id,
                title: editService.title,
                description: editService.description,
                category: editService.category,
                duration_minutes: editService.durationMinutes,
                price: editService.price,
                buffer_minutes: editService.bufferMinutes,
                color_code: editService.colorCode,
              }
            : undefined
        }
      />
    </div>
  )
}
