'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useParentStore } from '@/stores/parent-store'

export function StudentSelector() {
  const { students, selectedStudentId, setSelectedStudentId } = useParentStore()

  if (students.length <= 1) return null

  return (
    <Select
      value={selectedStudentId ?? undefined}
      onValueChange={setSelectedStudentId}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select child" />
      </SelectTrigger>
      <SelectContent>
        {students.map((student) => (
          <SelectItem key={student.id} value={student.id}>
            {student.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
