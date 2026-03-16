'use client'

import { useTransition } from 'react'
import { MoreHorizontal, Send, Ban, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

import { formatDate } from '@plio/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { InvoiceWithParent } from '@/app/(dashboard)/admin/invoices/actions'
import { sendInvoice, voidInvoice } from '@/app/(dashboard)/admin/invoices/actions'

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
  void: { label: 'Void', className: 'bg-gray-100 text-gray-500 line-through' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InvoicesTableProps {
  invoices: InvoiceWithParent[]
  onMarkPaid: (invoice: InvoiceWithParent) => void
  onRefresh: () => void
}

export function InvoicesTable({
  invoices,
  onMarkPaid,
  onRefresh,
}: InvoicesTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleSend = (invoiceId: string) => {
    startTransition(async () => {
      const result = await sendInvoice(invoiceId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Invoice sent successfully.')
        onRefresh()
      }
    })
  }

  const handleVoid = (invoiceId: string) => {
    startTransition(async () => {
      const result = await voidInvoice(invoiceId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Invoice voided.')
        onRefresh()
      }
    })
  }

  if (invoices.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No invoices found. Create your first invoice to get started.
      </div>
    )
  }

  return (
    <div className={isPending ? 'opacity-50 transition-opacity' : ''}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const config = statusConfig[invoice.status] ?? statusConfig.draft
            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{invoice.parentName}</p>
                    <p className="text-muted-foreground text-xs">
                      {invoice.parentEmail}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${invoice.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={config.className}>
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {invoice.dueDate
                    ? formatDate(invoice.dueDate, 'DD MMM YYYY')
                    : '-'}
                </TableCell>
                <TableCell>
                  {formatDate(invoice.createdAt, 'DD MMM YYYY')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {invoice.status !== 'paid' && invoice.status !== 'void' && (
                        <DropdownMenuItem onClick={() => onMarkPaid(invoice)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      {invoice.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handleSend(invoice.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Send
                        </DropdownMenuItem>
                      )}
                      {(invoice.status === 'draft' || invoice.status === 'sent') && (
                        <DropdownMenuItem
                          onClick={() => handleVoid(invoice.id)}
                          className="text-red-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Void
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
