'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Mail } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TenantDisabledPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/register')
  }

  return (
    <Card className="overflow-hidden">
      {/* Amber accent bar */}
      <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400" />

      <CardHeader className="pb-2 pt-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200/60">
          <Lock className="h-6 w-6 text-amber-600" strokeWidth={1.8} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Account Suspended
        </h2>
      </CardHeader>

      <CardContent className="space-y-4 px-6 text-center">
        <p className="text-sm leading-relaxed text-gray-500">
          Your organization&apos;s access to Plio has been temporarily suspended.
          This may be due to a billing issue or an administrative action.
        </p>

        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
            Need help?
          </p>
          <a
            href="mailto:support@plio.app"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            support@plio.app
          </a>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3 px-6 pb-6">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full"
        >
          Sign out
        </Button>
        <p className="text-xs text-center text-gray-400">
          If you believe this is a mistake, contact your organization&apos;s administrator.
        </p>
      </CardFooter>
    </Card>
  )
}
