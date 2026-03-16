'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Camera, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { verifyCheckIn } from '@/app/(dashboard)/parent/check-in/actions'

export function ScanPageClient() {
  const [token, setToken] = useState('')
  const [result, setResult] = useState<{
    success: boolean
    studentName?: string
    courseName?: string
    error?: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleVerify() {
    if (!token.trim()) return

    setResult(null)
    startTransition(async () => {
      const res = await verifyCheckIn(token.trim())
      if (res.error) {
        setResult({ success: false, error: res.error })
        toast.error(res.error)
      } else {
        setResult({
          success: true,
          studentName: res.studentName,
          courseName: res.courseName,
        })
        toast.success(`${res.studentName} checked in!`)
        setToken('')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scan Check-in</h1>
        <p className="text-sm text-muted-foreground">
          Scan a parent&apos;s QR code or paste the check-in token
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gray-100">
          <div className="text-center text-gray-400">
            <Camera className="mx-auto h-12 w-12" />
            <p className="mt-2 text-sm">Camera scanner coming soon</p>
            <p className="text-xs">Use manual entry below</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste check-in token..."
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          <Button onClick={handleVerify} disabled={isPending || !token.trim()}>
            {isPending ? 'Verifying...' : 'Verify'}
          </Button>
        </div>

        {result && (
          <div
            className={`mt-4 flex items-center gap-3 rounded-lg p-4 ${
              result.success ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            {result.success ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-800">
                    {result.studentName} checked in!
                  </p>
                  <p className="text-sm text-green-600">{result.courseName}</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                <p className="text-sm text-red-700">{result.error}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
