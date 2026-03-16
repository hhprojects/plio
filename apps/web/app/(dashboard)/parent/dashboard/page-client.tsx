'use client'

import { useEffect } from 'react'
import { CalendarDays, CreditCard, Bell, Clock } from 'lucide-react'
import { useParentStore } from '@/stores/parent-store'
import { StudentSelector } from '@/components/parent/student-selector'

interface DashboardData {
  children: Array<{ id: string; fullName: string }>
  nextClasses: Array<{
    studentId: string
    studentName: string
    enrollmentId: string
    date: string
    startTime: string
    endTime: string
    courseTitle: string
    courseColor: string
    tutorName: string
    roomName: string | null
  }>
  creditBalances: Record<string, number>
  recentActivity: Array<{
    id: string
    type: string
    title: string
    body: string
    isRead: boolean
    createdAt: string
  }>
}

export function ParentDashboardClient({ data }: { data: DashboardData }) {
  const { selectedStudentId, setStudents } = useParentStore()

  useEffect(() => {
    setStudents(data.children)
  }, [data.children, setStudents])

  const nextClass = data.nextClasses.find(
    (c) => !selectedStudentId || c.studentId === selectedStudentId
  )

  const creditBalance = selectedStudentId
    ? data.creditBalances[selectedStudentId] ?? 0
    : Object.values(data.creditBalances).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        {data.children.length > 1 && <StudentSelector />}
      </div>

      {/* Next Class Card */}
      <div className="rounded-xl border-l-4 border-l-indigo-500 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
          <CalendarDays className="h-4 w-4" />
          Next Class
        </div>
        {nextClass ? (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: nextClass.courseColor }}
              />
              <span className="text-lg font-semibold">{nextClass.courseTitle}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-500">
              <p>
                {new Date(nextClass.date).toLocaleDateString('en-SG', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p>
                {nextClass.startTime.slice(0, 5)} - {nextClass.endTime.slice(0, 5)}
              </p>
              <p>Tutor: {nextClass.tutorName}</p>
              {nextClass.roomName && <p>Room: {nextClass.roomName}</p>}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">No upcoming classes</p>
        )}
      </div>

      {/* Credit Balance Card */}
      <div className="rounded-xl border-l-4 border-l-green-500 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
          <CreditCard className="h-4 w-4" />
          Credit Balance
        </div>
        <div className="mt-2">
          <span className="text-3xl font-bold">{creditBalance}</span>
          <span className="ml-1 text-sm text-gray-500">credits</span>
        </div>
        {selectedStudentId && data.children.length > 0 && (
          <p className="mt-1 text-sm text-gray-400">
            {data.children.find((c) => c.id === selectedStudentId)?.fullName}
          </p>
        )}
      </div>

      {/* Outstanding Fees Card (Placeholder) */}
      <div className="rounded-xl border-l-4 border-l-gray-300 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Clock className="h-4 w-4" />
          Outstanding Fees
        </div>
        <p className="mt-2 text-sm text-gray-400">No outstanding fees</p>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Bell className="h-4 w-4" />
          Recent Activity
        </div>
        {data.recentActivity.length > 0 ? (
          <div className="mt-3 space-y-3">
            {data.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 border-b pb-3 last:border-b-0"
              >
                <div
                  className={`mt-1 h-2 w-2 rounded-full ${
                    activity.isRead ? 'bg-gray-300' : 'bg-indigo-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.body}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">No recent activity</p>
        )}
      </div>
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
}
