import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

export default function InvitePage() {
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
          <Mail className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Accept Your Invitation
          </h1>
          <p className="text-sm text-gray-500">
            Check your email for an invite link from your administrator
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 text-center">
        <Mail className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Your administrator should have sent you an invitation email with a link
          to set up your account. Click the link in that email to get started.
        </p>
      </div>

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
