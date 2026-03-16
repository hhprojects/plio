'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createRoom,
  updateRoom,
} from '@/app/(dashboard)/admin/rooms/actions'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const roomFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
})

type RoomFormValues = z.infer<typeof roomFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RoomFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  defaultValues?: {
    id: string
    name: string
    capacity: number
  }
  onSuccess?: () => void
}

export function RoomForm({
  open,
  onOpenChange,
  mode,
  defaultValues,
  onSuccess,
}: RoomFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      capacity: defaultValues?.capacity ?? 10,
    },
  })

  function onSubmit(values: RoomFormValues) {
    startTransition(async () => {
      const fd = new FormData()
      if (mode === 'edit' && defaultValues?.id) {
        fd.set('id', defaultValues.id)
      }
      fd.set('name', values.name)
      fd.set('capacity', String(values.capacity))

      const result =
        mode === 'edit' ? await updateRoom(fd) : await createRoom(fd)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          mode === 'edit'
            ? 'Room updated successfully.'
            : 'Room created successfully.'
        )
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Room' : 'Add Room'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the room information below.'
              : 'Fill in the details to create a new room.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Room A1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacity */}
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="10"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? 1
                            : parseInt(e.target.value, 10)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending
                ? mode === 'edit'
                  ? 'Updating...'
                  : 'Creating...'
                : mode === 'edit'
                  ? 'Update Room'
                  : 'Add Room'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
