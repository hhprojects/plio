'use client'

import { useCallback, useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

import { RoomTable } from '@/components/admin/rooms/room-table'
import { RoomForm } from '@/components/admin/rooms/room-form'
import { RoomUtilization } from '@/components/admin/rooms/room-utilization'
import {
  toggleRoomActive,
  type RoomWithDetails,
} from './actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RoomsPageClientProps {
  initialRooms: RoomWithDetails[]
}

export function RoomsPageClient({ initialRooms }: RoomsPageClientProps) {
  const [rooms] = useState<RoomWithDetails[]>(initialRooms)
  const [, startTransition] = useTransition()

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editRoom, setEditRoom] = useState<RoomWithDetails | null>(null)

  // Utilization sheet state
  const [utilizationOpen, setUtilizationOpen] = useState(false)
  const [utilizationRoom, setUtilizationRoom] = useState<RoomWithDetails | null>(null)

  const handleViewUtilization = useCallback((room: RoomWithDetails) => {
    setUtilizationRoom(room)
    setUtilizationOpen(true)
  }, [])

  const handleEdit = useCallback((room: RoomWithDetails) => {
    setEditRoom(room)
    setFormMode('edit')
    setFormOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditRoom(null)
    setFormMode('create')
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditRoom(null)
    }
  }, [])

  const handleToggleActive = useCallback(
    (roomId: string, isActive: boolean) => {
      startTransition(async () => {
        const result = await toggleRoomActive(roomId, isActive)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(
            isActive ? 'Room activated.' : 'Room deactivated.'
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
          <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage your rooms, capacity, and daily utilization.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* Table */}
      <RoomTable
        rooms={rooms}
        onViewUtilization={handleViewUtilization}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      {/* Create/Edit form dialog */}
      <RoomForm
        open={formOpen}
        onOpenChange={handleFormClose}
        mode={formMode}
        defaultValues={
          editRoom
            ? {
                id: editRoom.id,
                name: editRoom.name,
                capacity: editRoom.capacity,
              }
            : undefined
        }
      />

      {/* Utilization sheet */}
      <Sheet open={utilizationOpen} onOpenChange={setUtilizationOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Room Utilization</SheetTitle>
            <SheetDescription>
              View daily class schedule for{' '}
              {utilizationRoom?.name ?? 'this room'}.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
            {utilizationRoom && (
              <div className="pt-4">
                <RoomUtilization
                  roomId={utilizationRoom.id}
                  roomName={utilizationRoom.name}
                />
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
