'use client'

import { useState, useTransition } from 'react'
import { X, Send, CheckCircle, Ban, CreditCard } from 'lucide-react'
import type { Invoice, Payment } from '@plio/db'
import { PaymentForm } from './payment-form'
import { updateInvoiceStatus, recordPayment } from '@/app/(dashboard)/invoicing/actions'

interface InvoiceDetailProps {
  invoice: Invoice
  contactName: string
  payments: Payment[]
  onClose: () => void
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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const paymentStatusColors: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export function InvoiceDetail({ invoice, contactName, payments, onClose }: InvoiceDetailProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [isUpdating, startTransition] = useTransition()
  const [actionError, setActionError] = useState('')

  function handleStatusChange(status: 'sent' | 'paid' | 'void') {
    setActionError('')
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoice.id, status)
      if (result.error) setActionError(result.error)
    })
  }

  async function handleRecordPayment(payload: {
    amount: number
    method: string
    reference?: string
  }) {
    const result = await recordPayment(invoice.id, payload)
    if (result.success) setShowPaymentForm(false)
    return result
  }

  const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : []

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[480px] bg-white shadow-xl border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">{invoice.invoice_number}</h2>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {invoice.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {actionError && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">{actionError}</div>
        )}

        {/* Invoice info */}
        <section className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Contact:</span>{' '}
            <span className="text-gray-900 font-medium">{contactName}</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>{' '}
            <span className="text-gray-900">{formatDate(invoice.created_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">Due Date:</span>{' '}
            <span className="text-gray-900">{formatDate(invoice.due_date)}</span>
          </div>
          {invoice.paid_at && (
            <div>
              <span className="text-gray-500">Paid At:</span>{' '}
              <span className="text-gray-900">{formatDateTime(invoice.paid_at)}</span>
            </div>
          )}
          {invoice.notes && (
            <div>
              <span className="text-gray-500">Notes:</span>{' '}
              <span className="text-gray-900">{invoice.notes}</span>
            </div>
          )}
        </section>

        {/* Line Items */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Line Items</h3>
          <div className="bg-gray-50 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lineItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(item.amount ?? item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Totals */}
        <section className="bg-gray-50 rounded-md p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST ({invoice.gst_rate}%)</span>
            <span className="font-medium">{formatCurrency(invoice.gst_amount)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{formatCurrency(invoice.total)}</span>
          </div>
        </section>

        {/* Payments */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Payments</h3>
            {invoice.status !== 'void' && invoice.status !== 'paid' && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Record Payment
              </button>
            )}
          </div>

          {showPaymentForm && (
            <div className="mb-3">
              <PaymentForm
                onSubmit={handleRecordPayment}
                onCancel={() => setShowPaymentForm(false)}
                maxAmount={invoice.total}
              />
            </div>
          )}

          {payments.length === 0 ? (
            <p className="text-sm text-gray-400">No payments recorded</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.method} &middot; {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusColors[payment.status] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {payment.status.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actions */}
        {invoice.status !== 'void' && invoice.status !== 'paid' && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {invoice.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('sent')}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Mark as Sent
                </button>
              )}
              {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                <button
                  onClick={() => handleStatusChange('paid')}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Mark as Paid
                </button>
              )}
              <button
                onClick={() => handleStatusChange('void')}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" />
                Void
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
