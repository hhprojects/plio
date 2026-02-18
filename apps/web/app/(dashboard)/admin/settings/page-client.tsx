'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { updateTenantSettings } from './actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SettingsPageClientProps {
  initialSettings?: Record<string, unknown> | null
  businessType?: string
  tenantName?: string
}

export function SettingsPageClient({ initialSettings }: SettingsPageClientProps) {
  const [isPending, startTransition] = useTransition()

  const [bufferMinutes, setBufferMinutes] = useState<string>(
    String(initialSettings?.default_buffer_minutes ?? 15)
  )
  const [slotInterval, setSlotInterval] = useState<string>(
    String(initialSettings?.slot_interval_minutes ?? 15)
  )
  const [cancellationWindow, setCancellationWindow] = useState<string>(
    String(initialSettings?.cancellation_window_hours ?? 4)
  )

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateTenantSettings({
        default_buffer_minutes: bufferMinutes,
        slot_interval_minutes: slotInterval,
        cancellation_window_hours: cancellationWindow,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Settings saved.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure scheduling preferences.
        </p>
      </div>

      {/* Settings form */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling</CardTitle>
          <CardDescription>
            Adjust buffer times, slot intervals, and cancellation policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default buffer time */}
          <div className="grid gap-2">
            <Label htmlFor="default_buffer_minutes">Default buffer time</Label>
            <Select value={bufferMinutes} onValueChange={setBufferMinutes}>
              <SelectTrigger id="default_buffer_minutes" className="w-[200px]">
                <SelectValue placeholder="Select buffer time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 minutes</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              Time between consecutive classes.
            </p>
          </div>

          {/* Slot interval */}
          <div className="grid gap-2">
            <Label htmlFor="slot_interval_minutes">Slot interval</Label>
            <Select value={slotInterval} onValueChange={setSlotInterval}>
              <SelectTrigger id="slot_interval_minutes" className="w-[200px]">
                <SelectValue placeholder="Select slot interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              Minimum scheduling granularity for classes.
            </p>
          </div>

          {/* Cancellation window */}
          <div className="grid gap-2">
            <Label htmlFor="cancellation_window_hours">Cancellation window</Label>
            <Select value={cancellationWindow} onValueChange={setCancellationWindow}>
              <SelectTrigger id="cancellation_window_hours" className="w-[200px]">
                <SelectValue placeholder="Select cancellation window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              Minimum notice required for parents to cancel a class.
            </p>
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
