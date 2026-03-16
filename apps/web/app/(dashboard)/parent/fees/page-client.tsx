'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { formatDate } from '@plio/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ParentInvoice } from './actions'

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

const statusConfig: Record<string, { label: string; className: string }> = {
  sent: { label: 'Unpaid', className: 'bg-blue-100 text-blue-800' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  void: { label: 'Void', className: 'bg-gray-100 text-gray-500' },
}

// ---------------------------------------------------------------------------
// Invoice card with expandable line items
// ---------------------------------------------------------------------------

function InvoiceCard({ invoice }: { invoice: ParentInvoice }) {
  const [expanded, setExpanded] = useState(false)
  const config = statusConfig[invoice.status] ?? statusConfig.sent

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{invoice.invoiceNumber}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {formatDate(invoice.createdAt, 'DD MMM YYYY')}
              {invoice.dueDate && (
                <> &middot; Due {formatDate(invoice.dueDate, 'DD MMM YYYY')}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">${invoice.total.toFixed(2)}</span>
            <Badge variant="secondary" className={config.className}>
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Show details
            </>
          )}
        </Button>
        {expanded && (
          <div className="mt-2 space-y-1 text-sm">
            {invoice.lineItems.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {item.description} &times; {item.quantity}
                </span>
                <span className="font-medium">${item.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-1 flex justify-between font-medium">
              <span>Subtotal</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.gstAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>GST ({invoice.gstRate}%)</span>
                <span>${invoice.gstAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ParentFeesClientProps {
  invoices: ParentInvoice[]
}

export function ParentFeesClient({ invoices }: ParentFeesClientProps) {
  const outstanding = invoices.filter(
    (inv) => inv.status === 'sent' || inv.status === 'overdue'
  )
  const history = invoices.filter(
    (inv) => inv.status === 'paid' || inv.status === 'void'
  )

  return (
    <div className="space-y-8">
      {/* Outstanding */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Outstanding</h2>
        {outstanding.length === 0 ? (
          <div className="text-muted-foreground flex h-24 items-center justify-center rounded-md border text-sm">
            No outstanding invoices.
          </div>
        ) : (
          <div className="space-y-3">
            {outstanding.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} />
            ))}
          </div>
        )}
      </section>

      {/* Payment History */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        {history.length === 0 ? (
          <div className="text-muted-foreground flex h-24 items-center justify-center rounded-md border text-sm">
            No payment history yet.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
