'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  createCourse,
  updateCourse,
} from '@/app/(dashboard)/admin/courses/actions'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const courseFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  default_price: z.number().min(0, 'Price must be 0 or more'),
  max_capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  color_code: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color code'),
})

type CourseFormValues = z.infer<typeof courseFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  defaultValues?: {
    id: string
    title: string
    description: string | null
    default_price: number
    max_capacity: number
    color_code: string
  }
  onSuccess?: () => void
}

export function CourseForm({
  open,
  onOpenChange,
  mode,
  defaultValues,
  onSuccess,
}: CourseFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      default_price: defaultValues?.default_price ?? 0,
      max_capacity: defaultValues?.max_capacity ?? 10,
      color_code: defaultValues?.color_code ?? '#6366f1',
    },
  })

  function onSubmit(values: CourseFormValues) {
    startTransition(async () => {
      const fd = new FormData()
      if (mode === 'edit' && defaultValues?.id) {
        fd.set('id', defaultValues.id)
      }
      fd.set('title', values.title)
      fd.set('description', values.description ?? '')
      fd.set('default_price', String(values.default_price))
      fd.set('max_capacity', String(values.max_capacity))
      fd.set('color_code', values.color_code)

      const result =
        mode === 'edit' ? await updateCourse(fd) : await createCourse(fd)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          mode === 'edit'
            ? 'Course updated successfully.'
            : 'Course created successfully.'
        )
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Course' : 'Add Course'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the course information below.'
              : 'Fill in the details to create a new course.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Primary Math Olympiad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the course..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price and Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="default_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Price (SGD) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? 0
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Capacity *</FormLabel>
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
            </div>

            {/* Color Code */}
            <FormField
              control={form.control}
              name="color_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Label className="sr-only" htmlFor="color-picker">
                        Pick a color
                      </Label>
                      <input
                        id="color-picker"
                        type="color"
                        value={field.value}
                        onChange={field.onChange}
                        className="h-10 w-10 cursor-pointer rounded-md border p-0.5"
                      />
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="#6366f1"
                        className="w-28 font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
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
                  ? 'Update Course'
                  : 'Add Course'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
