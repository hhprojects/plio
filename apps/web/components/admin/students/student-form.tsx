'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import type { Profile } from '@plio/db'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createStudent,
  updateStudent,
} from '@/app/(dashboard)/admin/students/actions'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const studentFormSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200),
  parent_id: z.string().uuid('Please select a parent'),
  date_of_birth: z.string().optional().or(z.literal('')),
  school: z.string().max(200).optional().or(z.literal('')),
  level: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

type StudentFormValues = z.infer<typeof studentFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parents: Profile[]
  mode: 'create' | 'edit'
  defaultValues?: {
    id: string
    full_name: string
    parent_id: string
    date_of_birth: string | null
    school: string | null
    level: string | null
    notes: string | null
  }
}

export function StudentForm({
  open,
  onOpenChange,
  parents,
  mode,
  defaultValues,
}: StudentFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? '',
      parent_id: defaultValues?.parent_id ?? '',
      date_of_birth: defaultValues?.date_of_birth ?? '',
      school: defaultValues?.school ?? '',
      level: defaultValues?.level ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  function onSubmit(values: StudentFormValues) {
    startTransition(async () => {
      const fd = new FormData()
      if (mode === 'edit' && defaultValues?.id) {
        fd.set('id', defaultValues.id)
      }
      fd.set('full_name', values.full_name)
      fd.set('parent_id', values.parent_id)
      fd.set('date_of_birth', values.date_of_birth ?? '')
      fd.set('school', values.school ?? '')
      fd.set('level', values.level ?? '')
      fd.set('notes', values.notes ?? '')

      const result =
        mode === 'edit' ? await updateStudent(fd) : await createStudent(fd)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          mode === 'edit'
            ? 'Student updated successfully.'
            : 'Student created successfully.'
        )
        form.reset()
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Student' : 'Add Student'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the student information below.'
              : 'Fill in the details to add a new student.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Tan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent */}
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent / Guardian *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a parent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.full_name}
                          {parent.email ? ` (${parent.email})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of birth */}
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => {
                const dateValue = field.value
                  ? new Date(field.value + 'T00:00:00')
                  : undefined
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
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
                            {field.value
                              ? format(dateValue!, 'PPP')
                              : 'Pick a date'}
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
                              const mm = String(date.getMonth() + 1).padStart(
                                2,
                                '0'
                              )
                              const dd = String(date.getDate()).padStart(2, '0')
                              field.onChange(`${yyyy}-${mm}-${dd}`)
                            } else {
                              field.onChange('')
                            }
                          }}
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {/* School and Level */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Raffles Institution" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sec 3, P5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="min-h-[80px]"
                      {...field}
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
                  ? 'Update Student'
                  : 'Add Student'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
