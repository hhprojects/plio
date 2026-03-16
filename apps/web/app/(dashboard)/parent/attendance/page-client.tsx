'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  RotateCcw,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_COLORS } from '@/lib/constants'
import { useParentStore } from '@/stores/parent-store'
import { getAttendanceData } from './actions'

interface AttendanceEntry {
  id: string
  date: string
  startTime: string
  endTime: string
  courseTitle: string
  courseColor: string
  status: string
  checkedInAt: string | null
  cancelledAt: string | null
}

interface Summary {
  total: number
  attended: number
  noShow: number
  cancelled: number
  makeup: number
  attendanceRate: number
  cancellationRate: number
}

interface AttendanceData {
  children: Array<{ id: string; fullName: string }>
  entries: AttendanceEntry[]
  summary: Summary | null
}

const statusIcons: Record<string, React.ReactNode> = {
  attended: <CheckCircle className="h-4 w-4 text-green-500" />,
  confirmed: <Clock className="h-4 w-4 text-blue-500" />,
  no_show: <XCircle className="h-4 w-4 text-red-500" />,
  cancelled: <MinusCircle className="h-4 w-4 text-gray-400" />,
  makeup: <RotateCcw className="h-4 w-4 text-purple-500" />,
}

export function AttendancePageClient({ data }: { data: AttendanceData }) {
  const { setStudents } = useParentStore()
  const [selectedStudentId, setSelectedStudentId] = useState(
    data.children[0]?.id ?? ''
  )
  const [entries, setEntries] = useState(data.entries)
  const [summary, setSummary] = useState(data.summary)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setStudents(data.children)
  }, [data.children, setStudents])

  function handleStudentChange(id: string) {
    setSelectedStudentId(id)
    startTransition(async () => {
      const result = await getAttendanceData(id)
      if (result.data) {
        setEntries(result.data.entries)
        setSummary(result.data.summary)
      }
    })
  }

  // Group entries by month
  const grouped: Record<string, AttendanceEntry[]> = {}
  for (const entry of entries) {
    const monthKey = entry.date.slice(0, 7) // "2026-03"
    if (!grouped[monthKey]) grouped[monthKey] = []
    grouped[monthKey].push(entry)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Attendance</h2>
        {data.children.length > 1 && (
          <Select value={selectedStudentId} onValueChange={handleStudentChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {summary.attendanceRate}%
            </div>
            <div className="text-xs text-gray-500">Attendance</div>
          </div>
          <div className="rounded-lg bg-white p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-amber-600">
              {summary.cancellationRate}%
            </div>
            <div className="text-xs text-gray-500">Cancellation</div>
          </div>
          <div className="rounded-lg bg-white p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-700">
              {summary.attended}
            </div>
            <div className="text-xs text-gray-500">Classes</div>
          </div>
        </div>
      )}

      {/* Timeline grouped by month */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-gray-500">No attendance records yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([monthKey, monthEntries]) => {
            const monthLabel = new Date(monthKey + '-01').toLocaleDateString(
              'en-SG',
              { month: 'long', year: 'numeric' }
            )
            return (
              <div key={monthKey}>
                <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
                  {monthLabel}
                </h3>
                <div className="space-y-2">
                  {monthEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-lg border bg-white p-3"
                    >
                      <div className="flex-shrink-0">
                        {statusIcons[entry.status] ?? (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.courseColor }}
                          />
                          <span className="text-sm font-medium truncate">
                            {entry.courseTitle}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(entry.date).toLocaleDateString('en-SG', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {' '}{entry.startTime.slice(0, 5)} - {entry.endTime.slice(0, 5)}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${STATUS_COLORS[entry.status] ?? ''}`}
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
