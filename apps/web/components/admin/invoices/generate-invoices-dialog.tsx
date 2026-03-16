'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { generateMonthlyInvoices } from '@/app/(dashboard)/admin/invoices/actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface GenerateInvoicesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function GenerateInvoicesDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenerateInvoicesDialogProps) {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [month, setMonth] = useState(defaultMonth)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ generated: number } | null>(null)

  function handleGenerate() {
    setResult(null)
    startTransition(async () => {
      const res = await generateMonthlyInvoices(month)
      if (res.error) {
        toast.error(res.error)
      } else {
        setResult({ generated: res.generated ?? 0 })
        toast.success(`Generated ${res.generated} invoice(s).`)
        onSuccess()
      }
    })
  }

  function handleOpenChange(open: boolean) {
    onOpenChange(open)
    if (!open) {
      setResult(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Monthly Invoices</DialogTitle>
          <DialogDescription>
            Auto-generate invoices for all enrolled students for a given month.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          {result && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              Generated {result.generated} invoice(s) for {month}.
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={isPending || !month}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Generating...' : 'Generate Invoices'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
