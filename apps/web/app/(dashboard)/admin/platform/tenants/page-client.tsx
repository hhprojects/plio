'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Building2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getTenantDetail, updateTenantSubscription } from '../actions'

interface TenantRow {
  id: string
  name: string
  slug: string
  business_type: string
  subscription_tier: string
  created_at: string
}

interface TenantDetail extends TenantRow {
  settings: Record<string, unknown> | null
  userCount: number
  studentCount: number
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  pro: 'bg-indigo-100 text-indigo-800',
}

const TYPE_COLORS: Record<string, string> = {
  education: 'bg-emerald-100 text-emerald-800',
  wellness: 'bg-purple-100 text-purple-800',
}

export function TenantsPageClient({ initialTenants }: { initialTenants: TenantRow[] }) {
  const [tenants] = useState(initialTenants)
  const [selected, setSelected] = useState<TenantDetail | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRowClick(tenant: TenantRow) {
    startTransition(async () => {
      const result = await getTenantDetail(tenant.id)
      if (result.data) {
        setSelected(result.data as TenantDetail)
        setSheetOpen(true)
      } else {
        toast.error(result.error ?? 'Failed to load tenant')
      }
    })
  }

  function handleTierChange(tier: string) {
    if (!selected) return
    startTransition(async () => {
      const result = await updateTenantSubscription(selected.id, tier)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Subscription updated')
        setSelected((prev) => prev ? { ...prev, subscription_tier: tier } : null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <p className="text-sm text-muted-foreground">
          All businesses on the platform
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No tenants found.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(tenant)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs text-muted-foreground">/{tenant.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={TYPE_COLORS[tenant.business_type] ?? ''}>
                      {tenant.business_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={TIER_COLORS[tenant.subscription_tier] ?? ''}>
                      {tenant.subscription_tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString('en-SG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tenant Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>/{selected.slug}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">{selected.userCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">
                      {selected.business_type === 'wellness' ? 'Clients' : 'Students'}
                    </p>
                    <p className="text-2xl font-bold">{selected.studentCount}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Business Type</span>
                    <Badge variant="secondary" className={TYPE_COLORS[selected.business_type] ?? ''}>
                      {selected.business_type}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(selected.created_at).toLocaleDateString('en-SG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}</span>
                  </div>
                </div>

                {/* Subscription */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subscription Tier</label>
                  <Select
                    value={selected.subscription_tier}
                    onValueChange={handleTierChange}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Settings (read-only) */}
                {selected.settings && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Settings</p>
                    <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                      {JSON.stringify(selected.settings, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Booking link for wellness */}
                {selected.business_type === 'wellness' && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Booking page:</span>
                    <a
                      href={`/book/${selected.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      /book/{selected.slug}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
