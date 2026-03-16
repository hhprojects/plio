'use client'

import { useCallback, useState, useTransition } from 'react'
import { Plus, FileBarChart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InvoicesTable } from '@/components/admin/invoices/invoices-table'
import { InvoiceForm } from '@/components/admin/invoices/invoice-form'
import { MarkPaidDialog } from '@/components/admin/invoices/mark-paid-dialog'
import { GenerateInvoicesDialog } from '@/components/admin/invoices/generate-invoices-dialog'
import {
  getInvoices,
  type InvoiceWithParent,
} from './actions'

interface InvoicesPageClientProps {
  initialInvoices: InvoiceWithParent[]
  parents: Array<{ id: string; full_name: string; email: string }>
}

export function InvoicesPageClient({
  initialInvoices,
  parents,
}: InvoicesPageClientProps) {
  const [invoices, setInvoices] = useState<InvoiceWithParent[]>(initialInvoices)
  const [, startRefresh] = useTransition()

  // Form state
  const [formOpen, setFormOpen] = useState(false)

  // Mark paid dialog state
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [markPaidInvoice, setMarkPaidInvoice] = useState<InvoiceWithParent | null>(null)

  // Generate dialog state
  const [generateOpen, setGenerateOpen] = useState(false)

  const refreshInvoices = useCallback(() => {
    startRefresh(async () => {
      const result = await getInvoices()
      setInvoices(result.data)
    })
  }, [])

  const handleMarkPaid = useCallback((invoice: InvoiceWithParent) => {
    setMarkPaidInvoice(invoice)
    setMarkPaidOpen(true)
  }, [])

  const handleMarkPaidClose = useCallback((open: boolean) => {
    setMarkPaidOpen(open)
    if (!open) {
      setMarkPaidInvoice(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Create, send, and manage invoices for your students.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGenerateOpen(true)}>
            <FileBarChart className="mr-2 h-4 w-4" />
            Generate Monthly
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Table */}
      <InvoicesTable
        invoices={invoices}
        onMarkPaid={handleMarkPaid}
        onRefresh={refreshInvoices}
      />

      {/* Create form */}
      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        parents={parents}
        onSuccess={refreshInvoices}
      />

      {/* Mark paid dialog */}
      <MarkPaidDialog
        open={markPaidOpen}
        onOpenChange={handleMarkPaidClose}
        invoice={markPaidInvoice}
        onSuccess={refreshInvoices}
      />

      {/* Generate dialog */}
      <GenerateInvoicesDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSuccess={refreshInvoices}
      />
    </div>
  )
}
