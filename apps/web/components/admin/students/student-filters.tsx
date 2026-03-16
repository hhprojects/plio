'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { StudentFilters } from '@/app/(dashboard)/admin/students/actions'

interface StudentFiltersProps {
  courses: Array<{ id: string; title: string }>
  levels: string[]
  onFiltersChange: (filters: StudentFilters) => void
}

export function StudentFiltersBar({
  courses,
  levels,
  onFiltersChange,
}: StudentFiltersProps) {
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState<string>('')
  const [level, setLevel] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Notify parent of filter changes
  useEffect(() => {
    const filters: StudentFilters = {}
    if (debouncedSearch) filters.search = debouncedSearch
    if (courseId) filters.courseId = courseId
    if (level) filters.level = level
    if (status === 'active' || status === 'inactive') filters.status = status
    onFiltersChange(filters)
  }, [debouncedSearch, courseId, level, status, onFiltersChange])

  const hasFilters = search || courseId || level || status

  const clearFilters = useCallback(() => {
    setSearch('')
    setCourseId('')
    setLevel('')
    setStatus('')
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative w-full sm:w-64">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Course filter */}
      <Select value={courseId} onValueChange={setCourseId}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All courses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All courses</SelectItem>
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Level filter */}
      <Select value={level} onValueChange={setLevel}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All levels</SelectItem>
          {levels.map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
