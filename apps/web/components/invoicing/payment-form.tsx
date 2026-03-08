'use client'

import { useState, useTransition } from 'react'

interface PaymentFormProps {
  onSubmit: (payload: {
    amount: number
    method: string
    reference?: string
  }) => Promise<{ error?: string; success?: boolean }>
  onCancel: () => void
  maxAmount?: number
}

const paymentMethods = [
  { value: 'paynow', label: 'PayNow' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'stripe', label: 'Stripe' },
]

export function PaymentForm({ onSubmit, onCancel, maxAmount }: PaymentFormProps) {
  const [amount, setAmount] = useState(maxAmount ?? 0)
  const [method, setMethod] = useState('paynow')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!amount || amount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    startTransition(async () => {
      const result = await onSubmit({
        amount,
        method,
        reference: reference || undefined,
      })
      if (result.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-md p-4 space-y-3">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (SGD)</label>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {paymentMethods.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Optional reference..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}
