'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { ArrowLeft, ArrowRight, Check, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { importStudents, type ImportRow, type ImportResult } from './actions'

// ---------------------------------------------------------------------------
// Target fields
// ---------------------------------------------------------------------------

const TARGET_FIELDS = [
  { value: 'full_name', label: 'Student Name *' },
  { value: 'level', label: 'Level' },
  { value: 'school', label: 'School' },
  { value: 'date_of_birth', label: 'Date of Birth' },
  { value: 'notes', label: 'Notes' },
  { value: 'parent_name', label: 'Parent Name *' },
  { value: 'parent_email', label: 'Parent Email *' },
  { value: 'parent_phone', label: 'Parent Phone' },
] as const

const SKIP_VALUE = '__skip__'

// ---------------------------------------------------------------------------
// Auto-detect column mapping
// ---------------------------------------------------------------------------

function autoDetect(header: string): string {
  const h = header.toLowerCase().trim()

  if (h.includes('student') && h.includes('name')) return 'full_name'
  if (h === 'name' || h === 'full_name' || h === 'student') return 'full_name'
  if (h === 'level' || h === 'grade' || h === 'class') return 'level'
  if (h === 'school') return 'school'
  if (h.includes('birth') || h === 'dob' || h === 'date_of_birth') return 'date_of_birth'
  if (h === 'notes' || h === 'remarks') return 'notes'
  if (h.includes('parent') && h.includes('name')) return 'parent_name'
  if (h.includes('parent') && h.includes('email')) return 'parent_email'
  if (h === 'email') return 'parent_email'
  if (h.includes('parent') && h.includes('phone')) return 'parent_phone'
  if (h === 'phone' || h === 'contact') return 'parent_phone'

  return SKIP_VALUE
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Step = 'upload' | 'mapping' | 'preview' | 'import'

export function ImportPageClient() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [isPending, startTransition] = useTransition()

  // Parsed data
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [fileName, setFileName] = useState('')

  // Column mappings: CSV column index → target field
  const [mappings, setMappings] = useState<Record<number, string>>({})

  // Import result
  const [result, setResult] = useState<ImportResult | null>(null)

  // ---------------------------------------------------------------------------
  // Step 1: Upload
  // ---------------------------------------------------------------------------

  const handleFile = useCallback((file: File) => {
    setFileName(file.name)
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][]
        if (data.length < 2) {
          toast.error('CSV must have a header row and at least one data row.')
          return
        }
        const csvHeaders = data[0]
        const csvRows = data.slice(1).filter((row) => row.some((cell) => cell.trim()))

        setHeaders(csvHeaders)
        setRows(csvRows)

        // Auto-detect mappings
        const detected: Record<number, string> = {}
        csvHeaders.forEach((h, i) => {
          detected[i] = autoDetect(h)
        })
        setMappings(detected)

        setStep('mapping')
      },
      error: () => {
        toast.error('Failed to parse CSV file.')
      },
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) {
        handleFile(file)
      } else {
        toast.error('Please drop a .csv file.')
      }
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  // ---------------------------------------------------------------------------
  // Step 2: Mapping
  // ---------------------------------------------------------------------------

  const handleMappingChange = useCallback((colIndex: number, targetField: string) => {
    setMappings((prev) => ({ ...prev, [colIndex]: targetField }))
  }, [])

  // ---------------------------------------------------------------------------
  // Step 3: Preview — map CSV rows to ImportRow
  // ---------------------------------------------------------------------------

  const mappedRows: ImportRow[] = useMemo(() => {
    // Build reverse mapping: target field → column index
    const fieldToCol: Record<string, number> = {}
    Object.entries(mappings).forEach(([colStr, field]) => {
      if (field !== SKIP_VALUE) {
        fieldToCol[field] = parseInt(colStr)
      }
    })

    return rows.map((row) => ({
      full_name: row[fieldToCol['full_name']] ?? '',
      level: row[fieldToCol['level']] ?? '',
      school: row[fieldToCol['school']] ?? '',
      date_of_birth: row[fieldToCol['date_of_birth']] ?? '',
      notes: row[fieldToCol['notes']] ?? '',
      parent_name: row[fieldToCol['parent_name']] ?? '',
      parent_email: row[fieldToCol['parent_email']] ?? '',
      parent_phone: row[fieldToCol['parent_phone']] ?? '',
    }))
  }, [rows, mappings])

  const validationErrors = useMemo(() => {
    return mappedRows.map((row, i) => {
      const errors: string[] = []
      if (!row.full_name) errors.push('Missing student name')
      if (!row.parent_name) errors.push('Missing parent name')
      if (!row.parent_email) errors.push('Missing parent email')
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.parent_email))
        errors.push('Invalid email')
      return { row: i + 1, errors }
    })
  }, [mappedRows])

  const validCount = validationErrors.filter((v) => v.errors.length === 0).length
  const errorCount = validationErrors.filter((v) => v.errors.length > 0).length

  // ---------------------------------------------------------------------------
  // Step 4: Import
  // ---------------------------------------------------------------------------

  const handleImport = useCallback(() => {
    startTransition(async () => {
      const res = await importStudents(mappedRows)
      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        setResult(res.data)
        toast.success(
          `Imported ${res.data.studentsCreated} student(s), ${res.data.parentsCreated} parent(s) created.`
        )
      }
    })
  }, [mappedRows])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/students')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Students</h1>
          <p className="text-muted-foreground mt-1">
            Upload a CSV file to bulk import students and parents.
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2">
        {(['upload', 'mapping', 'preview', 'import'] as Step[]).map((s, i) => (
          <Badge
            key={s}
            variant={step === s ? 'default' : 'secondary'}
            className="capitalize"
          >
            {i + 1}. {s}
          </Badge>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag & drop a .csv file here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Required columns: Student Name, Parent Name, Parent Email
              </p>
            </div>
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              File: <strong>{fileName}</strong> &middot; {rows.length} data rows detected
            </p>
            <div className="space-y-3">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-40 text-sm font-medium truncate" title={header}>
                    {header}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                  <Select
                    value={mappings[index] ?? SKIP_VALUE}
                    onValueChange={(val) => handleMappingChange(index, val)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP_VALUE}>-- Skip --</SelectItem>
                      {TARGET_FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={() => setStep('preview')}>
                Next: Preview
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 text-sm">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {validCount} valid rows
              </Badge>
              {errorCount > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {errorCount} errors
                </Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Parent Email</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedRows.slice(0, 10).map((row, i) => {
                    const validation = validationErrors[i]
                    const hasErrors = validation.errors.length > 0
                    return (
                      <TableRow
                        key={i}
                        className={hasErrors ? 'bg-red-50' : ''}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell>{row.full_name || '-'}</TableCell>
                        <TableCell>{row.parent_name || '-'}</TableCell>
                        <TableCell>{row.parent_email || '-'}</TableCell>
                        <TableCell>{row.level || '-'}</TableCell>
                        <TableCell>
                          {hasErrors ? (
                            <span className="text-xs text-red-600">
                              {validation.errors.join(', ')}
                            </span>
                          ) : (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            {mappedRows.length > 10 && (
              <p className="text-xs text-muted-foreground">
                Showing first 10 of {mappedRows.length} rows.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back
              </Button>
              <Button onClick={() => setStep('import')}>
                Next: Import
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Import */}
      {step === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle>Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result ? (
              <>
                <p className="text-sm">
                  Ready to import <strong>{validCount}</strong> valid row(s).
                  {errorCount > 0 && (
                    <> {errorCount} row(s) with errors will be skipped.</>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('preview')}>
                    Back
                  </Button>
                  <Button onClick={handleImport} disabled={isPending || validCount === 0}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? 'Importing...' : 'Start Import'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 space-y-1">
                  <p>
                    <strong>{result.studentsCreated}</strong> student(s) created
                  </p>
                  <p>
                    <strong>{result.parentsCreated}</strong> new parent(s) created
                  </p>
                  {result.rowsSkipped > 0 && (
                    <p>
                      <strong>{result.rowsSkipped}</strong> row(s) skipped
                    </p>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 space-y-1">
                    <p className="font-medium">Errors:</p>
                    {result.errors.map((err, i) => (
                      <p key={i}>
                        Row {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                )}
                <Button onClick={() => router.push('/admin/students')}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Students
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
