'use client'

import { Building2, Users, UserPlus } from 'lucide-react'

interface Props {
  totalTenants: number
  totalUsers: number
  recentSignups: number
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ElementType
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export function PlatformDashboardClient({ totalTenants, totalUsers, recentSignups }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500">Super admin dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Tenants" value={totalTenants} icon={Building2} />
        <StatCard label="Total Users" value={totalUsers} icon={Users} />
        <StatCard label="New Signups (7d)" value={recentSignups} icon={UserPlus} />
      </div>
    </div>
  )
}
