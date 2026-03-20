'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Eye } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

import type { TutorWithDetails } from '@/app/(dashboard)/admin/tutors/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'fullName' | 'weeklyHours' | 'monthlyClassCount'
type SortDirection = 'asc' | 'desc'

interface TutorTableProps {
  tutors: TutorWithDetails[]
  onView: (tutor: TutorWithDetails) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TutorTable({ tutors, onView }: TutorTableProps) {
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
    const arr = [...tutors]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'fullName':
          cmp = a.fullName.localeCompare(b.fullName)
          break
        case 'weeklyHours':
          cmp = a.weeklyHours - b.weeklyHours
          break
        case 'monthlyClassCount':
          cmp = a.monthlyClassCount - b.monthlyClassCount
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return arr
  }, [tutors, sortKey, sortDirection])

  if (tutors.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No tutors found.
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
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Courses</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('weeklyHours')}
            >
              Weekly Hours
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('monthlyClassCount')}
            >
              This Month
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((tutor) => (
          <TableRow
            key={tutor.id}
            className="cursor-pointer"
            onClick={() => onView(tutor)}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(tutor.fullName)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{tutor.fullName}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground text-sm">{tutor.email}</span>
            </TableCell>
            <TableCell>
              {tutor.phone ? (
                <span className="text-sm">{tutor.phone}</span>
              ) : (
                <span className="text-muted-foreground text-xs">&mdash;</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {tutor.assignedServices.length === 0 ? (
                  <span className="text-muted-foreground text-xs">None</span>
                ) : (
                  <>
                    {tutor.assignedServices.slice(0, 3).map((svc: { id: string; name: string; color: string }) => (
                      <Badge
                        key={svc.id}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: svc.color + '20',
                          color: svc.color,
                          borderColor: svc.color + '40',
                        }}
                      >
                        {svc.name}
                      </Badge>
                    ))}
                    {tutor.assignedServices.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{tutor.assignedServices.length - 3} more
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm">{tutor.weeklyHours} hrs</span>
            </TableCell>
            <TableCell>
              <span className="text-sm">
                {tutor.monthlyClassCount} class{tutor.monthlyClassCount !== 1 ? 'es' : ''}
              </span>
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  tutor.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {tutor.isActive ? 'Active' : 'Inactive'}
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
                  onClick={() => onView(tutor)}
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
