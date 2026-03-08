'use client'

import type { TeamMember, TeamAvailability } from '@plio/db'
import { Pencil, Trash2, Clock } from 'lucide-react'

type TeamMemberWithAvailability = TeamMember & {
  team_availability: TeamAvailability[]
}

interface TeamTableProps {
  members: TeamMemberWithAvailability[]
  onEdit: (member: TeamMemberWithAvailability) => void
  onDelete: (member: TeamMemberWithAvailability) => void
  onAvailability: (member: TeamMemberWithAvailability) => void
}

export function TeamTable({ members, onEdit, onDelete, onAvailability }: TeamTableProps) {
  if (members.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 shadow-sm text-center">
        <p className="text-gray-500">No team members yet. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role Title</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Color</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{member.name}</td>
              <td className="px-4 py-3 text-gray-600">{member.role_title || '--'}</td>
              <td className="px-4 py-3 text-gray-600">{member.email || '--'}</td>
              <td className="px-4 py-3">
                {member.color ? (
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: member.color }}
                  />
                ) : (
                  <span className="text-gray-400">--</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(member)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onAvailability(member)}
                    className="rounded p-1.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
                    title="Availability"
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(member)}
                    className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
