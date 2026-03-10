'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldX } from 'lucide-react'

export default function TenantDisabledPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldX className="h-8 w-8 text-red-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Account Disabled</h2>
        <p className="text-sm text-gray-500">
          Your organization's account has been disabled. Please contact your administrator
          or reach out to Plio support for assistance.
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Sign out
      </button>
    </div>
  )
}
