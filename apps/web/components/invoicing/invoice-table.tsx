'use client'

import { Eye, Trash2 } from 'lucide-react'

export interface InvoiceRow {
  id: string
  invoice_number: string
  contact_name: string
  total: number
  status: string
  due_date: string | null
  created_at: string
}

interface InvoiceTableProps {
  invoices: InvoiceRow[]
  onSelect: (invoice: InvoiceRow) => void
  onDelete?: (invoice: InvoiceRow) => void
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-gray-100 text-gray-500',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(amount)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function InvoiceTable({ invoices, onSelect, onDelete }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 shadow-sm text-center">
        <p className="text-gray-500">No invoices yet. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Invoice #</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Due Date</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelect(invoice)}
            >
              <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
              <td className="px-4 py-3 text-gray-600">{invoice.contact_name}</td>
              <td className="px-4 py-3 text-gray-900 font-medium">
                {formatCurrency(invoice.total)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {invoice.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{formatDate(invoice.due_date)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(invoice)
                    }}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {onDelete && invoice.status === 'draft' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(invoice)
                      }}
                      className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
