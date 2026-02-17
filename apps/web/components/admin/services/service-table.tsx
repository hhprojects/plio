'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

import type { ServiceWithCounts } from '@/app/(dashboard)/admin/services/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'title' | 'price' | 'durationMinutes'
type SortDirection = 'asc' | 'desc'

interface ServiceTableProps {
  services: ServiceWithCounts[]
  onView: (service: ServiceWithCounts) => void
  onEdit: (service: ServiceWithCounts) => void
  onToggleActive: (serviceId: string, isActive: boolean) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(price)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceTable({
  services,
  onView,
  onEdit,
  onToggleActive,
}: ServiceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('title')
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
    const arr = [...services]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'price':
          cmp = a.price - b.price
          break
        case 'durationMinutes':
          cmp = a.durationMinutes - b.durationMinutes
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return arr
  }, [services, sortKey, sortDirection])

  if (services.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No services found. Add your first service to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">Color</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('title')}
            >
              Title
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Category</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('durationMinutes')}
            >
              Duration
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('price')}
            >
              Price
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Buffer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((service) => (
          <TableRow
            key={service.id}
            className="cursor-pointer"
            onClick={() => onView(service)}
          >
            <TableCell>
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: service.colorCode }}
              />
            </TableCell>
            <TableCell className="font-medium">{service.title}</TableCell>
            <TableCell className="text-muted-foreground">
              {service.category || '—'}
            </TableCell>
            <TableCell>{service.durationMinutes} min</TableCell>
            <TableCell>{formatPrice(service.price)}</TableCell>
            <TableCell>
              {service.bufferMinutes === null
                ? 'Default'
                : `${service.bufferMinutes} min`}
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  service.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {service.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div
                className="flex items-center justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(service)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(service)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        onToggleActive(service.id, !service.isActive)
                      }
                    >
                      {service.isActive ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
