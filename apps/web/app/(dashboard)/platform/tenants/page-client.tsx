'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import type { Tenant } from '@plio/db'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { updateTenantTier, toggleTenantActive, fetchTenantDetails } from './actions'

interface TenantWithCount extends Tenant {
  user_count: number
}

interface TenantModule {
  id: string
  enabled: boolean
  custom_title: string | null
  module: {
    slug: string
    default_title: string
    always_on: boolean
  }
}

interface TenantUser {
  id: string
  full_name: string
  email: string
  role: string
}

interface Props {
  tenants: TenantWithCount[]
}

export function TenantsPageClient({ tenants }: Props) {
  const [selected, setSelected] = useState<TenantWithCount | null>(null)
  const [modules, setModules] = useState<TenantModule[]>([])
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!selected) {
      setModules([])
      setUsers([])
      return
    }
    setLoadingDetails(true)
    fetchTenantDetails(selected.id).then((details) => {
      setModules(details.modules as TenantModule[])
      setUsers(details.users as TenantUser[])
      setLoadingDetails(false)
    })
  }, [selected?.id])

  function handleTierChange(tier: string) {
    if (!selected) return
    startTransition(async () => {
      const result = await updateTenantTier(selected.id, tier)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Subscription tier updated')
        setSelected({ ...selected, subscription_tier: tier as Tenant['subscription_tier'] })
      }
    })
  }

  function handleToggleActive(active: boolean) {
    if (!selected) return
    startTransition(async () => {
      const result = await toggleTenantActive(selected.id, active)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(active ? 'Tenant activated' : 'Tenant deactivated')
        setSelected({ ...selected, active })
      }
    })
  }

  const tierStyles: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-50 text-blue-700',
    pro: 'bg-indigo-50 text-indigo-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <p className="text-sm text-gray-500">{tenants.length} registered tenants</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Users</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr
                key={tenant.id}
                onClick={() => setSelected(tenant)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{tenant.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{tenant.slug}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tierStyles[tenant.subscription_tier] ?? ''}`}>
                    {tenant.subscription_tier}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tenant.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {tenant.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{tenant.user_count}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No tenants found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.name ?? 'Tenant Details'}</SheetTitle>
            <SheetDescription>{selected?.slug}</SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="space-y-6 px-4 pb-4">
              {/* Basic info */}
              <div className="space-y-3">
                <Field label="ID" value={selected.id} />
                <Field label="Created" value={new Date(selected.created_at).toLocaleString()} />
              </div>

              <Separator />

              {/* Subscription tier */}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-gray-400">Subscription Tier</label>
                <Select
                  value={selected.subscription_tier}
                  onValueChange={handleTierChange}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Active</p>
                  <p className="text-xs text-gray-500">Disabled tenants cannot access the platform</p>
                </div>
                <Switch
                  checked={selected.active}
                  onCheckedChange={handleToggleActive}
                  disabled={isPending}
                />
              </div>

              <Separator />

              {/* Enabled modules */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase text-gray-400">Enabled Modules</h3>
                {loadingDetails ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : modules.length === 0 ? (
                  <p className="text-sm text-gray-400">No modules configured</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {modules
                      .filter((m) => m.enabled)
                      .map((m) => (
                        <Badge key={m.id} variant="secondary" className="text-xs">
                          {m.custom_title ?? m.module.default_title}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Users */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase text-gray-400">
                  Users ({users.length})
                </h3>
                {loadingDetails ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-gray-400">No users</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{value}</dd>
    </div>
  )
}
