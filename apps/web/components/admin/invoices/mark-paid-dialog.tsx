'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { InvoiceWithParent } from '@/app/(dashboard)/admin/invoices/actions'
import { markInvoiceAsPaid } from '@/app/(dashboard)/admin/invoices/actions'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const markPaidFormSchema = z.object({
  method: z.enum(['paynow', 'cash', 'bank_transfer', 'stripe'], {
    message: 'Please select a payment method',
  }),
  amount: z.number().min(0.01, 'Amount must be positive'),
  notes: z.string().max(500).optional(),
})

type MarkPaidFormValues = z.infer<typeof markPaidFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MarkPaidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: InvoiceWithParent | null
  onSuccess: () => void
}

export function MarkPaidDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: MarkPaidDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<MarkPaidFormValues>({
    resolver: zodResolver(markPaidFormSchema),
    values: {
      method: 'paynow',
      amount: invoice?.total ?? 0,
      notes: '',
    },
  })

  function onSubmit(values: MarkPaidFormValues) {
    if (!invoice) return

    startTransition(async () => {
      const result = await markInvoiceAsPaid({
        invoice_id: invoice.id,
        method: values.method,
        amount: values.amount,
        notes: values.notes,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Invoice ${invoice.invoiceNumber} marked as paid.`)
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Paid</DialogTitle>
          <DialogDescription>
            {invoice
              ? `Record payment for invoice ${invoice.invoiceNumber} ($${invoice.total.toFixed(2)})`
              : 'Record payment'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Payment method */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paynow">PayNow</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0.01}
                      step="0.01"
                      placeholder="0.00"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
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
                    <Input placeholder="Optional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
