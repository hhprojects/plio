'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import type { Service, Profile, Room } from '@plio/db'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScheduleForm } from '@/components/admin/schedules/schedule-form'
import { ScheduleList } from '@/components/admin/schedules/schedule-list'
import type { ScheduleWithDetails } from './actions'

interface SchedulesPageClientProps {
  schedules: ScheduleWithDetails[]
  services: Service[]
  tutors: Profile[]
  rooms: Room[]
}

export function SchedulesPageClient({
  schedules,
  services,
  tutors,
  rooms,
}: SchedulesPageClientProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground mt-1">
            Manage recurring class schedules and generate class instances.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Schedule</DialogTitle>
              <DialogDescription>
                Set up a recurring weekly schedule. Class instances will be generated
                automatically.
              </DialogDescription>
            </DialogHeader>
            <ScheduleForm
              services={services}
              tutors={tutors}
              rooms={rooms}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ScheduleList schedules={schedules} />
    </div>
  )
}
