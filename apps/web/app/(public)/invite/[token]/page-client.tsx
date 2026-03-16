'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ROLE_LABELS } from '@/lib/constants'
import { acceptInvitation } from './actions'

const formSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    consent: z.boolean(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.consent === true, {
    message: 'You must agree to the data collection policy',
    path: ['consent'],
  })

type FormValues = z.infer<typeof formSchema>

interface InviteAcceptClientProps {
  token: string
  email: string
  fullName: string
  role: string
  tenantName: string
}

export function InviteAcceptClient({
  token,
  email,
  fullName,
  role,
  tenantName,
}: InviteAcceptClientProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirm_password: '',
      consent: false,
    },
  })

  function onSubmit(values: FormValues) {
    setError(null)
    const fd = new FormData()
    fd.set('token', token)
    fd.set('password', values.password)
    fd.set('confirm_password', values.confirm_password)

    startTransition(async () => {
      const result = await acceptInvitation(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push(result.redirectTo ?? '/login')
        }, 2000)
      }
    })
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="rounded-full bg-green-50 p-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            Account Created!
          </h2>
          <p className="mt-2 text-gray-500">
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
          <Shield className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Set Up Your Account
          </h1>
          <p className="text-sm text-gray-500">
            Join {tenantName} on Plio
          </p>
        </div>
      </div>

      {/* Pre-filled info */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Name</span>
          <span className="text-sm font-medium">{fullName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Email</span>
          <span className="text-sm font-medium">{email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Role</span>
          <Badge variant="secondary">{ROLE_LABELS[role] ?? role}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Organization</span>
          <span className="text-sm font-medium">{tenantName}</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the collection and use of my personal data in
                    accordance with the Personal Data Protection Act (PDPA)
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
