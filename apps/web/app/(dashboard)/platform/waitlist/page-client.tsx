'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { approveWaitlist, rejectWaitlist } from './actions'
import type { Waitlist } from '@plio/db'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  entries: Waitlist[]
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

export function WaitlistPageClient({ entries }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject'
    id: string
    businessName: string
  } | null>(null)

  const filteredEntries = filter === 'all'
    ? entries
    : entries.filter((e) => e.status === filter)

  const counts = {
    all: entries.length,
    pending: entries.filter((e) => e.status === 'pending').length,
    approved: entries.filter((e) => e.status === 'approved').length,
    rejected: entries.filter((e) => e.status === 'rejected').length,
  }

  function handleConfirm() {
    if (!confirmAction) return
    startTransition(async () => {
      if (confirmAction.type === 'approve') {
        const result = await approveWaitlist(confirmAction.id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`Tenant created and invitation sent to ${confirmAction.businessName}`)
        }
      } else {
        const result = await rejectWaitlist(confirmAction.id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`Application from ${confirmAction.businessName} rejected`)
        }
      }
      setConfirmAction(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
        <p className="text-sm text-gray-500">{entries.length} entries</p>
      </div>

      {/* Status filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Business Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{entry.business_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{entry.contact_email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{entry.business_type}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[entry.status] ?? ''}`}>
                    {entry.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {entry.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmAction({ type: 'approve', id: entry.id, businessName: entry.business_name })}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'reject', id: entry.id, businessName: entry.business_name })}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">--</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  {filter === 'all' ? 'No waitlist entries.' : `No ${filter} entries.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'approve' ? 'Approve Application' : 'Reject Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'approve'
                ? `This will create a new tenant for "${confirmAction?.businessName}" and send an invitation email to the business owner. Continue?`
                : `This will reject the application from "${confirmAction?.businessName}". Continue?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className={confirmAction?.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isPending ? 'Processing...' : confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
