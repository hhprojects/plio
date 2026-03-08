'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus } from 'lucide-react'
import type { Invoice, Payment } from '@plio/db'
import { InvoiceTable, type InvoiceRow } from '@/components/invoicing/invoice-table'
import { InvoiceForm } from '@/components/invoicing/invoice-form'
import { InvoiceDetail } from '@/components/invoicing/invoice-detail'
import { createInvoice, deleteInvoice, fetchInvoicePayments } from './actions'

interface ContactOption {
  id: string
  name: string
}

interface InvoiceWithContact extends Invoice {
  contact_name: string
}

interface InvoicingPageClientProps {
  invoices: InvoiceWithContact[]
  contacts: ContactOption[]
  canWrite: boolean
}

export function InvoicingPageClient({ invoices, contacts, canWrite }: InvoicingPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithContact | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceRow | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()

  // Map invoices to table rows
  const invoiceRows: InvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    contact_name: inv.contact_name,
    total: inv.total,
    status: inv.status,
    due_date: inv.due_date,
    created_at: inv.created_at,
  }))

  // Fetch payments when invoice is selected
  useEffect(() => {
    if (!selectedInvoice) {
      setPayments([])
      return
    }
    let cancelled = false
    setDetailLoading(true)
    fetchInvoicePayments(selectedInvoice.id).then((data) => {
      if (!cancelled) {
        setPayments(data as Payment[])
        setDetailLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedInvoice, invoices])

  function handleSelectInvoice(row: InvoiceRow) {
    const inv = invoices.find((i) => i.id === row.id)
    if (inv) setSelectedInvoice(inv)
  }

  async function handleCreate(payload: {
    contact_id: string
    line_items: { description: string; quantity: number; unit_price: number }[]
    gst_rate: number
    due_date?: string
    notes?: string
  }) {
    const result = await createInvoice(payload)
    if (result.success) setShowCreateDialog(false)
    return result
  }

  function handleConfirmDelete() {
    if (!deletingInvoice) return
    startDeleteTransition(async () => {
      const result = await deleteInvoice(deletingInvoice.id)
      if (result.error) {
        alert(result.error)
      } else if (selectedInvoice?.id === deletingInvoice.id) {
        setSelectedInvoice(null)
      }
      setDeletingInvoice(null)
    })
  }

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className={`flex-1 space-y-6 transition-all ${selectedInvoice ? 'mr-[480px]' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoicing</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage invoices, track payments.
            </p>
          </div>
          {canWrite && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Invoice
            </button>
          )}
        </div>

        <InvoiceTable
          invoices={invoiceRows}
          onSelect={handleSelectInvoice}
          onDelete={(inv) => setDeletingInvoice(inv)}
        />
      </div>

      {/* Detail panel */}
      {selectedInvoice && !detailLoading && (
        <InvoiceDetail
          invoice={selectedInvoice}
          contactName={selectedInvoice.contact_name}
          payments={payments}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Detail loading state */}
      {selectedInvoice && detailLoading && (
        <div className="fixed inset-y-0 right-0 z-40 w-[480px] bg-white shadow-xl border-l border-gray-200 flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create Invoice</h2>
            <InvoiceForm
              contacts={contacts}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Delete Invoice</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete invoice{' '}
              <strong>{deletingInvoice.invoice_number}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingInvoice(null)}
                className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
