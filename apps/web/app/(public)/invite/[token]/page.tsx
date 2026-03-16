import { validateInviteToken } from './actions'
import { InviteAcceptClient } from './page-client'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const result = await validateInviteToken(token)

  if (!result.valid || !result.invitation) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mt-12 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">
            Invalid Invitation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {result.error}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Go to home page
          </Link>
        </div>
      </div>
    )
  }

  return (
    <InviteAcceptClient
      token={token}
      email={result.invitation.email}
      fullName={result.invitation.fullName}
      role={result.invitation.role}
      tenantName={result.invitation.tenantName}
    />
  )
}
