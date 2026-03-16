'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ROLE_LABELS } from '@/lib/constants'
import { sendInvitation } from '@/app/(dashboard)/admin/team/actions'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  full_name: z.string().min(1, 'Name is required').max(200),
  role: z.enum(['admin', 'tutor', 'parent']),
})

type FormValues = z.infer<typeof formSchema>

interface InviteFormProps {
  onSuccess: () => void
}

export function InviteForm({ onSuccess }: InviteFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: undefined,
    },
  })

  function onSubmit(values: FormValues) {
    const fd = new FormData()
    fd.set('email', values.email)
    fd.set('full_name', values.full_name)
    fd.set('role', values.role)

    startTransition(async () => {
      const result = await sendInvitation(fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        onSuccess()
      }
    })
  }

  const invitableRoles = ['admin', 'tutor', 'parent'] as const

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {invitableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
