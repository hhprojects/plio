'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useModuleStore } from '@/stores/module-store'
import { UserPlus, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ROLE_LABELS,
  INVITATION_STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/constants'
import { InviteForm } from '@/components/admin/team/invite-form'
import {
  resendInvitation,
  revokeInvitation,
  getTeamMembers,
  getInvitations,
} from './actions'

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: string
  phone: string | null
  is_active: boolean
  created_at: string
}

interface InvitationEntry {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  expires_at: string
  created_at: string
}

export function TeamPageClient({
  initialTeam,
  initialInvitations,
}: {
  initialTeam: TeamMember[]
  initialInvitations: InvitationEntry[]
}) {
  const getModuleTitle = useModuleStore((s) => s.getModuleTitle)
  const [team, setTeam] = useState(initialTeam)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleInviteSent() {
    setInviteDialogOpen(false)
    toast.success('Invitation sent!')
    startTransition(async () => {
      const result = await getInvitations()
      if (result.data) setInvitations(result.data)
      const teamResult = await getTeamMembers()
      if (teamResult.data) setTeam(teamResult.data)
    })
  }

  function handleResend(id: string) {
    startTransition(async () => {
      const result = await resendInvitation(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Invitation resent!')
        const refreshed = await getInvitations()
        if (refreshed.data) setInvitations(refreshed.data)
      }
    })
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      const result = await revokeInvitation(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Invitation revoked.')
        const refreshed = await getInvitations()
        if (refreshed.data) setInvitations(refreshed.data)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{getModuleTitle('team')}</h1>
          <p className="text-sm text-muted-foreground">
            Manage team members and invitations
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team Members ({team.length})</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No team members yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  team.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ROLE_LABELS[member.role] ?? member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            member.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString(
                          'en-SG',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No invitations sent yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">
                        {invite.full_name}
                      </TableCell>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ROLE_LABELS[invite.role] ?? invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[invite.status] ?? ''}
                        >
                          {INVITATION_STATUS_LABELS[invite.status] ??
                            invite.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(invite.expires_at).toLocaleDateString(
                          'en-SG',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {invite.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResend(invite.id)}
                              disabled={isPending}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleRevoke(invite.id)}
                              disabled={isPending}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Revoke
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
          </DialogHeader>
          <InviteForm onSuccess={handleInviteSent} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
