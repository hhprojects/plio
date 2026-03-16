'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import type { Service, Profile, Room } from '@plio/db'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createRecurringSchedule } from '@/app/(dashboard)/admin/schedules/actions'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const baseSchema = z.object({
  serviceId: z.string().uuid('Please select a service'),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  tutorId: z.string().uuid('Please select a tutor'),
  roomId: z.string().optional().or(z.literal('')),
  count: z.number().int().min(1, 'At least 1').max(52, 'At most 52'),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required'),
  effectiveUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required'),
})

const formSchema = baseSchema.refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

type FormValues = z.infer<typeof baseSchema>

// ---------------------------------------------------------------------------
// Day names
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ScheduleFormProps {
  services: Service[]
  tutors: Profile[]
  rooms: Room[]
  onSuccess?: () => void
}

export function ScheduleForm({ services, tutors, rooms, onSuccess }: ScheduleFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      tutorId: '',
      roomId: '',
      count: 12,
      effectiveFrom: '',
      effectiveUntil: '',
    },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('serviceId', values.serviceId)
      fd.set('dayOfWeek', String(values.dayOfWeek))
      fd.set('startTime', values.startTime)
      fd.set('endTime', values.endTime)
      fd.set('tutorId', values.tutorId)
      fd.set('roomId', values.roomId ?? '')
      fd.set('count', String(values.count))
      fd.set('effectiveFrom', values.effectiveFrom)
      fd.set('effectiveUntil', values.effectiveUntil)

      const result = await createRecurringSchedule(fd)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          `Schedule created with ${result.instanceCount} class instance${result.instanceCount === 1 ? '' : 's'}.`
        )
        form.reset()
        onSuccess?.()
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Service */}
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: service.color ?? undefined }}
                        />
                        {service.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Day of week */}
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day of Week</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DAY_NAMES.map((day, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start / End time */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tutor */}
        <FormField
          control={form.control}
          name="tutorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tutor</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a tutor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Room (optional) */}
        <FormField
          control={form.control}
          name="roomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room (optional)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No room" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">No room</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} (cap. {room.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recurrence count */}
        <FormField
          control={form.control}
          name="count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Weeks</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={52}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Effective from */}
        <FormField
          control={form.control}
          name="effectiveFrom"
          render={({ field }) => {
            const dateValue = field.value ? new Date(field.value + 'T00:00:00') : undefined
            return (
              <FormItem className="flex flex-col">
                <FormLabel>Effective From</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(dateValue!, 'PPP') : 'Pick a date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(date) => {
                        if (date) {
                          const yyyy = date.getFullYear()
                          const mm = String(date.getMonth() + 1).padStart(2, '0')
                          const dd = String(date.getDate()).padStart(2, '0')
                          field.onChange(`${yyyy}-${mm}-${dd}`)
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        {/* Effective until */}
        <FormField
          control={form.control}
          name="effectiveUntil"
          render={({ field }) => {
            const dateValue = field.value ? new Date(field.value + 'T00:00:00') : undefined
            return (
              <FormItem className="flex flex-col">
                <FormLabel>Effective Until</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(dateValue!, 'PPP') : 'Pick a date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(date) => {
                        if (date) {
                          const yyyy = date.getFullYear()
                          const mm = String(date.getMonth() + 1).padStart(2, '0')
                          const dd = String(date.getDate()).padStart(2, '0')
                          field.onChange(`${yyyy}-${mm}-${dd}`)
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Creating...' : 'Create Schedule'}
        </Button>
      </form>
    </Form>
  )
}
