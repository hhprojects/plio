'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpDown,
  BarChart3,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

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

import type { RoomWithDetails } from '@/app/(dashboard)/admin/rooms/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'name' | 'capacity' | 'classesToday'
type SortDirection = 'asc' | 'desc'

interface RoomTableProps {
  rooms: RoomWithDetails[]
  onViewUtilization: (room: RoomWithDetails) => void
  onEdit: (room: RoomWithDetails) => void
  onToggleActive: (roomId: string, isActive: boolean) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoomTable({
  rooms,
  onViewUtilization,
  onEdit,
  onToggleActive,
}: RoomTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
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
    const arr = [...rooms]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'capacity':
          cmp = a.capacity - b.capacity
          break
        case 'classesToday':
          cmp = a.classesToday - b.classesToday
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return arr
  }, [rooms, sortKey, sortDirection])

  if (rooms.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No rooms found. Add your first room to get started.
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
              onClick={() => toggleSort('name')}
            >
              Name
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('capacity')}
            >
              Capacity
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('classesToday')}
            >
              Classes Today
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((room) => (
          <TableRow key={room.id}>
            <TableCell className="font-medium">{room.name}</TableCell>
            <TableCell>{room.capacity}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {room.classesToday}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  room.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {room.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewUtilization(room)}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Utilization
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(room)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onToggleActive(room.id, !room.isActive)}
                  >
                    {room.isActive ? (
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
