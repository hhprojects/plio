'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface ContactOption {
  id: string
  name: string
}

interface LineItemRow {
  description: string
  quantity: number
  unit_price: number
}

interface InvoiceFormProps {
  contacts: ContactOption[]
  onSubmit: (payload: {
    contact_id: string
    line_items: LineItemRow[]
    gst_rate: number
    due_date?: string
    notes?: string
  }) => Promise<{ error?: string; success?: boolean }>
  onCancel: () => void
}

function emptyLineItem(): LineItemRow {
  return { description: '', quantity: 1, unit_price: 0 }
}

export function InvoiceForm({ contacts, onSubmit, onCancel }: InvoiceFormProps) {
  const [contactId, setContactId] = useState('')
  const [lineItems, setLineItems] = useState<LineItemRow[]>([emptyLineItem()])
  const [gstRate, setGstRate] = useState(9)
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function updateLineItem(index: number, field: keyof LineItemRow, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyLineItem()])
  }

  // Calculations
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unit_price * 100) / 100,
    0
  )
  const gstAmount = Math.round(subtotal * gstRate) / 100
  const total = Math.round((subtotal + gstAmount) * 100) / 100

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!contactId) {
      setError('Please select a contact')
      return
    }

    const validItems = lineItems.filter((item) => item.description.trim())
    if (validItems.length === 0) {
      setError('At least one line item is required')
      return
    }

    startTransition(async () => {
      const result = await onSubmit({
        contact_id: contactId,
        line_items: validItems,
        gst_rate: gstRate,
        due_date: dueDate || undefined,
        notes: notes || undefined,
      })
      if (result.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">{error}</div>
      )}

      {/* Contact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
        <select
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          required
        >
          <option value="">Select a contact...</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Line Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
        <div className="space-y-2">
          {lineItems.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <input
                type="number"
                placeholder="Qty"
                min={1}
                value={item.quantity}
                onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <input
                type="number"
                placeholder="Unit Price"
                min={0}
                step={0.01}
                value={item.unit_price || ''}
                onChange={(e) => updateLineItem(index, 'unit_price', Number(e.target.value))}
                className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <div className="w-24 py-2 text-sm text-right text-gray-700 font-medium">
                ${(Math.round(item.quantity * item.unit_price * 100) / 100).toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => removeLineItem(index)}
                disabled={lineItems.length <= 1}
                className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLineItem}
          className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Line
        </button>
      </div>

      {/* GST Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={gstRate}
          onChange={(e) => setGstRate(Number(e.target.value))}
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Totals */}
      <div className="bg-gray-50 rounded-md p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">GST ({gstRate}%)</span>
          <span className="font-medium">${gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 mt-1">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  )
}
