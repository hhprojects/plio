'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Building2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { BUSINESS_TYPE_LABELS } from '@/lib/constants'
import { submitWaitlistForm } from './actions'

const formSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(200),
  contact_email: z.string().email('Please enter a valid email'),
  contact_phone: z.string().min(8, 'Phone number is required').max(20),
  business_type: z.enum(['tuition', 'yoga', 'music', 'enrichment', 'other']),
  message: z.string().max(2000).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

export function RegisterPageClient() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: '',
      contact_email: '',
      contact_phone: '',
      business_type: undefined,
      message: '',
    },
  })

  function onSubmit(values: FormValues) {
    setError(null)
    const fd = new FormData()
    fd.set('business_name', values.business_name)
    fd.set('contact_email', values.contact_email)
    fd.set('contact_phone', values.contact_phone)
    fd.set('business_type', values.business_type)
    fd.set('message', values.message ?? '')

    startTransition(async () => {
      const result = await submitWaitlistForm(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSubmittedEmail(result.email ?? values.contact_email)
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-green-50 p-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          Account Created!
        </h2>
        <p className="mt-2 max-w-md text-gray-500">
          Your business has been registered. You can now log in with:
        </p>
        <div className="mt-4 rounded-lg border bg-gray-50 px-6 py-4 text-left text-sm">
          <div className="flex justify-between gap-8">
            <span className="text-gray-500">Email:</span>
            <span className="font-medium text-gray-900">{submittedEmail}</span>
          </div>
          <div className="mt-2 flex justify-between gap-8">
            <span className="text-gray-500">Password:</span>
            <span className="font-medium text-gray-900">password123</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Please change your password after logging in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Go to Login
        </Link>
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
          <Building2 className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Register Your Business
          </h1>
          <p className="text-sm text-gray-500">
            Apply to get your business on Plio
          </p>
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
          className="mt-8 space-y-6"
        >
          <FormField
            control={form.control}
            name="business_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Bright Tuition Centre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@business.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+65 9123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Message <span className="text-gray-400">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your business..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Submit Application'}
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
