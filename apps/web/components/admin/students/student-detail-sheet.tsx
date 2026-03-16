'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  CalendarDays,
  GraduationCap,
  Mail,
  Phone,
  School,
  CreditCard,

  StickyNote,
} from 'lucide-react'

import { formatDate } from '@plio/utils'

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
import { STATUS_COLORS } from '@/lib/constants'
import { WhatsAppLink } from '@/components/admin/students/whatsapp-link'
import { getStudentDetail, type StudentDetail } from '@/app/(dashboard)/admin/students/actions'

interface StudentDetailSheetProps {
  studentId: string | null
  studentName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentDetailSheet({
  studentId,
  studentName,
  open,
  onOpenChange,
}: StudentDetailSheetProps) {
  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && studentId) {
      setDetail(null)
      startTransition(async () => {
        const result = await getStudentDetail(studentId)
        if (result.data) {
          setDetail(result.data)
        }
      })
    }
  }, [open, studentId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>{studentName ?? 'Student Details'}</SheetTitle>
          <SheetDescription>
            View student information and enrollment history.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
          {isPending || !detail ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Student info */}
              <div className="space-y-3">
                {detail.level && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="text-muted-foreground h-4 w-4" />
                    <span>{detail.level}</span>
                  </div>
                )}
                {detail.school && (
                  <div className="flex items-center gap-2 text-sm">
                    <School className="text-muted-foreground h-4 w-4" />
                    <span>{detail.school}</span>
                  </div>
                )}
                {detail.dateOfBirth && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="text-muted-foreground h-4 w-4" />
                    <span>{formatDate(detail.dateOfBirth, 'DD MMM YYYY')}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Parent info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Parent / Guardian</h4>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{detail.parentName}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">{detail.parentEmail}</span>
                  </div>
                  {detail.parentPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">{detail.parentPhone}</span>
                      <WhatsAppLink
                        phone={detail.parentPhone}
                        parentName={detail.parentName}
                        studentName={detail.fullName}
                        variant="icon"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Credit balance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4" />
                    Credit Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{detail.creditBalance}</p>
                  {detail.recentCredits.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-muted-foreground text-xs font-medium">
                        Recent transactions
                      </p>
                      {detail.recentCredits.slice(0, 5).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-muted-foreground capitalize">
                            {c.reason.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={
                              c.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }
                          >
                            {c.amount >= 0 ? '+' : ''}
                            {c.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {detail.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-medium">
                      <StickyNote className="h-4 w-4" />
                      Notes
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                      {detail.notes}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Enrollment history */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  Enrollment History ({detail.enrollmentHistory.length})
                </h4>
                {detail.enrollmentHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No enrollment history yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.enrollmentHistory.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: enrollment.courseColor }}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {enrollment.courseTitle}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatDate(enrollment.classDate, 'DD MMM YYYY')}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            STATUS_COLORS[enrollment.status] ?? ''
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
