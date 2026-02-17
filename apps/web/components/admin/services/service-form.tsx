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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createService,
  updateService,
} from '@/app/(dashboard)/admin/services/actions'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const serviceFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  duration_minutes: z.number().int().min(1, 'Duration is required'),
  price: z.number().min(0, 'Price must be 0 or more'),
  buffer_minutes: z.number().int().min(0).nullable(),
  color_code: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color code'),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  defaultValues?: {
    id: string
    title: string
    description: string | null
    category: string | null
    duration_minutes: number
    price: number
    buffer_minutes: number | null
    color_code: string
  }
  onSuccess?: () => void
}

export function ServiceForm({
  open,
  onOpenChange,
  mode,
  defaultValues,
  onSuccess,
}: ServiceFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      category: defaultValues?.category ?? '',
      duration_minutes: defaultValues?.duration_minutes ?? 60,
      price: defaultValues?.price ?? 0,
      buffer_minutes: defaultValues?.buffer_minutes ?? null,
      color_code: defaultValues?.color_code ?? '#6366f1',
    },
  })

  function onSubmit(values: ServiceFormValues) {
    startTransition(async () => {
      const fd = new FormData()
      if (mode === 'edit' && defaultValues?.id) {
        fd.set('id', defaultValues.id)
      }
      fd.set('title', values.title)
      fd.set('description', values.description ?? '')
      fd.set('category', values.category ?? '')
      fd.set('duration_minutes', String(values.duration_minutes))
      fd.set('price', String(values.price))
      fd.set('buffer_minutes', values.buffer_minutes === null ? '' : String(values.buffer_minutes))
      fd.set('color_code', values.color_code)

      const result =
        mode === 'edit' ? await updateService(fd) : await createService(fd)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          mode === 'edit'
            ? 'Service updated successfully.'
            : 'Service created successfully.'
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
            {mode === 'edit' ? 'Edit Service' : 'Add Service'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the service information below.'
              : 'Fill in the details to create a new service.'}
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
                    <Input placeholder="e.g. Deep Tissue Massage" {...field} />
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
                      placeholder="Brief description of the service..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Massage, Facial, Hair"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration and Price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration *</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(parseInt(val, 10))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">120 min</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (SGD) *</FormLabel>
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
            </div>

            {/* Buffer Minutes */}
            <FormField
              control={form.control}
              name="buffer_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buffer Time</FormLabel>
                  <Select
                    value={field.value === null ? 'default' : String(field.value)}
                    onValueChange={(val) =>
                      field.onChange(val === 'default' ? null : parseInt(val, 10))
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select buffer time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="default">Default (use tenant setting)</SelectItem>
                      <SelectItem value="0">0 min</SelectItem>
                      <SelectItem value="5">5 min</SelectItem>
                      <SelectItem value="10">10 min</SelectItem>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="20">20 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  ? 'Update Service'
                  : 'Add Service'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
