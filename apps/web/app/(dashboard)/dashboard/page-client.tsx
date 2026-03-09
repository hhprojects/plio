'use client'

import { Users, Briefcase, UserCog, Clock, Building2, UserPlus, ClipboardList } from 'lucide-react'
import Link from 'next/link'

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

type DashboardPageClientProps =
  | {
      role: 'super_admin'
      totalTenants: number
      totalUsers: number
      recentSignups: number
      pendingWaitlist: number
    }
  | {
      role: 'admin' | 'staff' | 'client'
      todaySessions: Session[]
      contactsCount: number
      servicesCount: number
      teamCount: number
    }

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${m} ${ampm}`
}

export function DashboardPageClient(props: DashboardPageClientProps) {
  if (props.role === 'super_admin') {
    const platformStats = [
      { label: 'Total Tenants', value: props.totalTenants, icon: Building2 },
      { label: 'Total Users', value: props.totalUsers, icon: Users },
      { label: 'New Signups (7d)', value: props.recentSignups, icon: UserPlus },
      { label: 'Pending Waitlist', value: props.pendingWaitlist, icon: ClipboardList },
    ]

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back. Here is your platform at a glance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-white rounded-lg border p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Quick actions */}
        {props.pendingWaitlist > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {props.pendingWaitlist} pending waitlist {props.pendingWaitlist === 1 ? 'entry' : 'entries'}
                </p>
                <p className="text-sm text-yellow-600">Review and approve new business signups.</p>
              </div>
              <Link
                href="/platform/waitlist"
                className="rounded-md bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              >
                Review
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Non-super_admin roles (existing code)
  const { todaySessions, contactsCount, servicesCount, teamCount, role } = props

  const stats =
    role === 'staff'
      ? [
          { label: 'My Clients', value: contactsCount, icon: Users },
          { label: 'My Sessions Today', value: todaySessions.length, icon: Clock },
          { label: 'My Services', value: servicesCount, icon: Briefcase },
        ]
      : role === 'client'
        ? [
            { label: 'My Sessions', value: servicesCount, icon: Clock },
            { label: 'My Dependents', value: contactsCount, icon: Users },
            { label: 'My Invoices', value: teamCount, icon: Briefcase },
          ]
        : [
            { label: 'Contacts', value: contactsCount, icon: Users },
            { label: 'Services', value: servicesCount, icon: Briefcase },
            { label: 'Team Members', value: teamCount, icon: UserCog },
          ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === 'client'
            ? 'Welcome back. Here are your upcoming sessions.'
            : role === 'staff'
              ? 'Welcome back. Here is your schedule for today.'
              : 'Welcome back. Here is an overview of your business today.'}
        </p>
      </div>

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
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: session.service?.color ?? '#6366f1' }}
                />
                <span className="text-sm text-gray-500 w-32 shrink-0">
                  {formatTime(session.start_time)} &ndash; {formatTime(session.end_time)}
                </span>
                <span className="text-sm font-medium flex-1 truncate">
                  {session.service?.name ?? 'Untitled'}
                </span>
                <span className="text-sm text-gray-500 truncate">
                  {session.team_member?.name ?? '—'}
                </span>
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
