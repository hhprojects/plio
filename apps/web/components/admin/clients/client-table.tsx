'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserX,
} from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { formatDate } from '@plio/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

import type { ClientWithStats } from '@/app/(dashboard)/admin/clients/actions'
import { toggleClientActive } from '@/app/(dashboard)/admin/clients/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'fullName' | 'lastVisit' | 'totalVisits'
type SortDirection = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'inactive'

interface ClientTableProps {
  clients: ClientWithStats[]
  onView: (client: ClientWithStats) => void
  onEdit: (client: ClientWithStats) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClientTable({ clients, onView, onEdit }: ClientTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('fullName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [isPending, startTransition] = useTransition()

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const filtered = useMemo(() => {
    let arr = [...clients]

    // Status filter
    if (statusFilter === 'active') {
      arr = arr.filter((c) => c.isActive)
    } else if (statusFilter === 'inactive') {
      arr = arr.filter((c) => !c.isActive)
    }

    // Text search (name and phone)
    if (search) {
      const searchLower = search.toLowerCase()
      arr = arr.filter(
        (c) =>
          c.fullName.toLowerCase().includes(searchLower) ||
          c.phone.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'fullName':
          cmp = a.fullName.localeCompare(b.fullName)
          break
        case 'lastVisit':
          cmp = (a.lastVisit ?? '').localeCompare(b.lastVisit ?? '')
          break
        case 'totalVisits':
          cmp = a.totalVisits - b.totalVisits
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })

    return arr
  }, [clients, sortKey, sortDirection, search, statusFilter])

  const handleToggleActive = (client: ClientWithStats) => {
    startTransition(async () => {
      const result = await toggleClientActive(client.id, !client.isActive)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          client.isActive
            ? 'Client deactivated.'
            : 'Client activated.'
        )
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1">
          {(['all', 'active', 'inactive'] as StatusFilter[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
          No clients found. Add your first client to get started.
        </div>
      ) : (
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
                  onClick={() => toggleSort('lastVisit')}
                >
                  Last Visit
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 font-medium"
                  onClick={() => toggleSort('totalVisits')}
                >
                  Total Visits
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => onView(client)}
              >
                <TableCell className="font-medium">{client.fullName}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>
                  {client.email ? (
                    <span className="text-sm">{client.email}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">--</span>
                  )}
                </TableCell>
                <TableCell>
                  {client.lastVisit ? (
                    <span className="text-sm">
                      {formatDate(client.lastVisit, 'DD MMM YYYY')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{client.totalVisits}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      client.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {client.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(client)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(client)}
                          disabled={isPending}
                        >
                          {client.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
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
      )}
    </div>
  )
}
