'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  CalendarDays,
  Clock,
  Mail,
  Phone,
} from 'lucide-react'

import { toast } from 'sonner'
import { formatDate } from '@plio/utils'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { TutorSchedule } from '@/components/admin/tutors/tutor-schedule'
import {
  getTutorSchedule,
  getTutorHours,
  type TutorWithDetails,
  type SessionWithDetails,
  type TutorHoursResult,
} from '@/app/(dashboard)/admin/tutors/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TutorDetailSheetProps {
  tutor: TutorWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TutorDetailSheet({
  tutor,
  open,
  onOpenChange,
}: TutorDetailSheetProps) {
  const [schedule, setSchedule] = useState<SessionWithDetails[]>([])
  const [hours, setHours] = useState<TutorHoursResult | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && tutor) {
      setSchedule([])
      setHours(null)

      // Calculate current month range for hours
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2
      const nextMonthYear =
        now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
      const lastDay = new Date(nextMonthYear, nextMonth - 1, 0).getDate()
      const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      startTransition(async () => {
        try {
          const [scheduleResult, hoursResult] = await Promise.all([
            getTutorSchedule(tutor.id),
            getTutorHours(tutor.id, monthStart, monthEnd),
          ])

          if (scheduleResult.data) {
            setSchedule(scheduleResult.data)
          }
          if (hoursResult.data) {
            setHours(hoursResult.data)
          }
        } catch {
          toast.error('Failed to load tutor data')
        }
      })
    }
  }, [open, tutor])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {tutor && (
              <Avatar size="lg">
                <AvatarFallback>{getInitials(tutor.fullName)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <SheetTitle>{tutor?.fullName ?? 'Tutor Details'}</SheetTitle>
              <SheetDescription>
                View tutor schedule and hours summary.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
          {!tutor ? null : (
            <div className="space-y-6 pt-4">
              {/* Contact info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">{tutor.email}</span>
                </div>
                {tutor.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">{tutor.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      tutor.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {tutor.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Tabs: Schedule | Hours */}
              <Tabs defaultValue="schedule">
                <TabsList className="w-full">
                  <TabsTrigger value="schedule" className="flex-1">
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="hours" className="flex-1">
                    Hours
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="schedule" className="mt-4">
                  {isPending ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-3 text-xs font-medium">
                        Upcoming 7 days
                      </p>
                      <TutorSchedule classes={schedule} />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="hours" className="mt-4">
                  {isPending || !hours ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary card */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4" />
                            This Month
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-2xl font-bold">
                                {hours.totalHours}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Total hours
                              </p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">
                                {hours.totalClasses}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Total classes
                              </p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">
                                {hours.byWeek.length > 0
                                  ? Math.round(
                                      (hours.totalHours / hours.byWeek.length) *
                                        10
                                    ) / 10
                                  : 0}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Avg per week
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Weekly breakdown */}
                      {hours.byWeek.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                              <CalendarDays className="h-4 w-4" />
                              Weekly Breakdown
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {hours.byWeek.map((week) => (
                                <div
                                  key={week.weekStart}
                                  className="flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                  <span className="text-sm">
                                    Week of{' '}
                                    {formatDate(week.weekStart, 'DD MMM YYYY')}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground text-xs">
                                      {week.classes} class
                                      {week.classes !== 1 ? 'es' : ''}
                                    </span>
                                    <span className="text-sm font-medium">
                                      {week.hours} hrs
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
