'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { PractitionerWithCounts } from '@/app/(dashboard)/admin/practitioners/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'fullName' | 'appointmentCount'
type SortDirection = 'asc' | 'desc'

interface PractitionerTableProps {
  practitioners: PractitionerWithCounts[]
  onView: (practitioner: PractitionerWithCounts) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PractitionerTable({
  practitioners,
  onView,
}: PractitionerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('fullName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sorted = useMemo(() => {
    const arr = [...practitioners]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'fullName':
          cmp = a.fullName.localeCompare(b.fullName)
          break
        case 'appointmentCount':
          cmp = a.appointmentCount - b.appointmentCount
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return arr
  }, [practitioners, sortKey, sortDirection])

  if (practitioners.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No practitioners found. Invite practitioners via the Team page.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('fullName')}
            >
              Name
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('appointmentCount')}
            >
              Upcoming Appointments
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((practitioner) => (
          <TableRow
            key={practitioner.id}
            className="cursor-pointer"
            onClick={() => onView(practitioner)}
          >
            <TableCell>
              <span className="font-medium">{practitioner.fullName}</span>
            </TableCell>
            <TableCell>
              {practitioner.phone ? (
                <span className="text-sm">{practitioner.phone}</span>
              ) : (
                <span className="text-muted-foreground text-xs">&mdash;</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground text-sm">
                {practitioner.email}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm">
                {practitioner.appointmentCount} upcoming
              </span>
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  practitioner.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {practitioner.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div
                className="flex items-center justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onView(practitioner)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View details</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
