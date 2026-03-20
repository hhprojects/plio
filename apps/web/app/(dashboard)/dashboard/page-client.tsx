'use client'

import {
  Users, Briefcase, UserCog, Clock, Building2, UserPlus, ClipboardList,
  AlertTriangle, Calendar, FileText, ArrowUpRight, ArrowDownRight, Minus,
  TrendingUp, Activity, UserPlus2, Send,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useModuleStore } from '@/stores/module-store'

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

interface AdminAlerts {
  overdueInvoices: number
  expiringInvitations: number
}

interface AdminTrends {
  revenueThisMonth: number
  revenueLastMonth: number
  activeClients: number
  activeClientsLastMonth: number
  sessionsThisWeek: number
  sessionsLastWeek: number
  newSessionsThisWeek: number
  newSessionsLastWeek: number
}

interface ActivityEntry {
  id: string
  action: string
  entity_type: string
  actor_name: string
  created_at: string
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
      role: 'admin'
      todaySessions: Session[]
      contactsCount: number
      servicesCount: number
      teamCount: number
      alerts: AdminAlerts
      trends: AdminTrends
      recentActivity: ActivityEntry[]
    }
  | {
      role: 'staff' | 'client'
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
  const getModuleTitle = useModuleStore((s) => s.getModuleTitle)
  if (props.role === 'super_admin') {
    const platformStats = [
      { label: 'Total Tenants', value: props.totalTenants, icon: Building2, href: '/platform/tenants' },
      { label: 'Total Users', value: props.totalUsers, icon: Users },
      { label: 'New Signups (7d)', value: props.recentSignups, icon: UserPlus },
      { label: 'Pending Waitlist', value: props.pendingWaitlist, icon: ClipboardList, href: '/platform/waitlist' },
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
            const card = (
              <div
                className={cn(
                  'bg-white rounded-lg border p-6 shadow-sm',
                  stat.href && 'hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer'
                )}
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
            return stat.href ? (
              <Link key={stat.label} href={stat.href}>{card}</Link>
            ) : (
              <div key={stat.label}>{card}</div>
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

  // Admin role — enhanced dashboard
  if (props.role === 'admin') {
    const { todaySessions, contactsCount, servicesCount, teamCount, alerts, trends, recentActivity } = props

    const adminStats = [
      { label: 'Contacts', value: contactsCount, icon: Users },
      { label: 'Services', value: servicesCount, icon: Briefcase },
      { label: 'Team Members', value: teamCount, icon: UserCog },
    ]

    const alertItems = [
      { label: 'overdue invoices', count: alerts.overdueInvoices, href: '/invoicing', icon: FileText },
      { label: 'expiring invitations', count: alerts.expiringInvitations, href: '/admin/team', icon: Send },
    ].filter((a) => a.count > 0)

    const quickActions = [
      { label: 'Add Client', href: '/clients', icon: UserPlus2 },
      { label: 'Create Invoice', href: '/invoicing', icon: FileText },
      { label: 'Invite Team', href: '/admin/team', icon: Send },
      { label: 'View Calendar', href: '/calendar', icon: Calendar },
    ]

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getModuleTitle('dashboard')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back. Here is an overview of your business today.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Alerts */}
        {alertItems.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {alertItems.map((alert) => {
              const Icon = alert.icon
              return (
                <div key={alert.label} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-800">
                        {alert.count} {alert.label}
                      </p>
                    </div>
                    <Link
                      href={alert.href}
                      className="rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-lg border bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <Icon className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Trends */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Trends</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TrendCard
              label="Revenue This Month"
              value={`$${trends.revenueThisMonth.toLocaleString('en-SG', { minimumFractionDigits: 2 })}`}
              current={trends.revenueThisMonth}
              previous={trends.revenueLastMonth}
            />
            <TrendCard
              label="Active Clients"
              value={trends.activeClients.toString()}
              current={trends.activeClients}
              previous={trends.activeClientsLastMonth}
            />
            <TrendCard
              label="Sessions This Week"
              value={trends.sessionsThisWeek.toString()}
              current={trends.sessionsThisWeek}
              previous={trends.sessionsLastWeek}
            />
            <TrendCard
              label="New Sessions This Week"
              value={trends.newSessionsThisWeek.toString()}
              current={trends.newSessionsThisWeek}
              previous={trends.newSessionsLastWeek}
            />
          </div>
        </div>

        {/* Bottom row: Today's Schedule + Activity Feed */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold mb-4">Today&apos;s Schedule</h2>
            <SessionList sessions={todaySessions} />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <div className="bg-white rounded-lg border p-8 shadow-sm text-center">
                <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border shadow-sm divide-y">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={cn(
                      'mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                      entry.action === 'create' && 'bg-green-50 text-green-700',
                      entry.action === 'update' && 'bg-blue-50 text-blue-700',
                      entry.action === 'delete' && 'bg-red-50 text-red-700',
                      entry.action === 'cancel' && 'bg-gray-100 text-gray-600',
                      !['create', 'update', 'delete', 'cancel'].includes(entry.action) && 'bg-gray-100 text-gray-600',
                    )}>
                      {entry.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        <span className="font-medium">{entry.actor_name}</span>
                        {' '}{entry.action}d{' '}
                        <span className="text-gray-500">{entry.entity_type.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.created_at).toLocaleString('en-SG', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Staff / Client roles
  const { todaySessions, contactsCount, servicesCount, teamCount, role } = props

  const stats =
    role === 'staff'
      ? [
          { label: 'My Clients', value: contactsCount, icon: Users },
          { label: 'My Sessions Today', value: todaySessions.length, icon: Clock },
          { label: 'My Services', value: servicesCount, icon: Briefcase },
        ]
      : [
          { label: 'My Sessions', value: servicesCount, icon: Clock },
          { label: 'My Dependents', value: contactsCount, icon: Users },
          { label: 'My Invoices', value: teamCount, icon: Briefcase },
        ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{getModuleTitle('dashboard')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === 'client'
            ? 'Welcome back. Here are your upcoming sessions.'
            : 'Welcome back. Here is your schedule for today.'}
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
        <SessionList sessions={todaySessions} />
      </div>
    </div>
  )
}

function TrendCard({ label, value, current, previous }: {
  label: string
  value: string
  current: number
  previous: number
}) {
  const diff = previous === 0
    ? (current > 0 ? 100 : 0)
    : Math.round(((current - previous) / previous) * 100)
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <div className={cn(
        'mt-1 flex items-center gap-1 text-xs font-medium',
        direction === 'up' && 'text-green-600',
        direction === 'down' && 'text-red-600',
        direction === 'neutral' && 'text-gray-400',
      )}>
        {direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
        {direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
        {direction === 'neutral' && <Minus className="h-3 w-3" />}
        <span>{Math.abs(diff)}% vs last period</span>
      </div>
    </div>
  )
}

function SessionList({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 shadow-sm text-center">
        <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No sessions scheduled for today</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm divide-y">
      {sessions.map((session) => (
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
  )
}
