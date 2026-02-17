'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  createClientAction,
  updateClientAction,
} from '@/app/(dashboard)/admin/clients/actions'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const clientFormSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200),
  phone: z.string().min(1, 'Phone number is required').max(20),
  email: z.string().email('Invalid email').max(200).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  defaultValues?: {
    id: string
    full_name: string
    phone: string
    email: string | null
    date_of_birth: string | null
    notes: string | null
  }
}

export function ClientForm({
  open,
  onOpenChange,
  mode,
  defaultValues,
}: ClientFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      date_of_birth: defaultValues?.date_of_birth ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  function onSubmit(values: ClientFormValues) {
    startTransition(async () => {
      const fd = new FormData()
      if (mode === 'edit' && defaultValues?.id) {
        fd.set('id', defaultValues.id)
      }
      fd.set('full_name', values.full_name)
      fd.set('phone', values.phone)
      fd.set('email', values.email ?? '')
      fd.set('date_of_birth', values.date_of_birth ?? '')
      fd.set('notes', values.notes ?? '')

      const result =
        mode === 'edit'
          ? await updateClientAction(fd)
          : await createClientAction(fd)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          mode === 'edit'
            ? 'Client updated successfully.'
            : 'Client created successfully.'
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
            {mode === 'edit' ? 'Edit Client' : 'Add Client'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update the client information below.'
              : 'Fill in the details to add a new client.'}
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
                    <Input placeholder="e.g. Jane Lim" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="e.g. 91234567"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g. jane@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of birth */}
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  ? 'Update Client'
                  : 'Add Client'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
