'use client'

import { Users, Briefcase, UserCog, Clock } from 'lucide-react'

interface Session {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  type: string
  service: { name: string; color: string | null } | null
  team_member: { name: string } | null
}

interface DashboardPageClientProps {
  todaySessions: Session[]
  contactsCount: number
  servicesCount: number
  teamCount: number
  role: string
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${m} ${ampm}`
}

export function DashboardPageClient({
  todaySessions,
  contactsCount,
  servicesCount,
  teamCount,
}: DashboardPageClientProps) {
  const stats = [
    { label: 'Contacts', value: contactsCount, icon: Users },
    { label: 'Services', value: servicesCount, icon: Briefcase },
    { label: 'Team Members', value: teamCount, icon: UserCog },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back. Here is an overview of your business today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg border p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <Icon className="h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Today's Schedule */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Today&apos;s Schedule</h2>
        {todaySessions.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 shadow-sm text-center">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No sessions scheduled for today</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm divide-y">
            {todaySessions.map((session) => (
              <div key={session.id} className="flex items-center gap-4 px-6 py-4">
                {/* Color dot */}
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: session.service?.color ?? '#6366f1',
                  }}
                />
                {/* Time */}
                <span className="text-sm text-gray-500 w-32 shrink-0">
                  {formatTime(session.start_time)} &ndash; {formatTime(session.end_time)}
                </span>
                {/* Service name */}
                <span className="text-sm font-medium flex-1 truncate">
                  {session.service?.name ?? 'Untitled'}
                </span>
                {/* Team member */}
                <span className="text-sm text-gray-500 truncate">
                  {session.team_member?.name ?? '—'}
                </span>
                {/* Status badge */}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize shrink-0">
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
