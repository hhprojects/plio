'use client'

import { useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createInvoice } from '@/app/(dashboard)/admin/invoices/actions'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  student_name: z.string().min(1, 'Student name is required'),
  quantity: z.number().min(1, 'Min 1'),
  unit_price: z.number().min(0, 'Min 0'),
})

const invoiceFormSchema = z.object({
  parent_id: z.string().uuid('Please select a parent'),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  due_date: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parents: Array<{ id: string; full_name: string; email: string }>
  onSuccess: () => void
}

export function InvoiceForm({
  open,
  onOpenChange,
  parents,
  onSuccess,
}: InvoiceFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      parent_id: '',
      line_items: [{ description: '', student_name: '', quantity: 1, unit_price: 0 }],
      due_date: '',
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items',
  })

  const watchedItems = form.watch('line_items')
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
    0
  )

  function onSubmit(values: InvoiceFormValues) {
    startTransition(async () => {
      const lineItems = values.line_items.map((item) => ({
        ...item,
        amount: item.quantity * item.unit_price,
      }))

      const result = await createInvoice({
        parent_id: values.parent_id,
        line_items: lineItems,
        due_date: values.due_date || undefined,
        notes: values.notes || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Invoice created successfully.')
        form.reset()
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for a parent. Line items will be calculated
            automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Parent */}
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a parent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.full_name}
                          {parent.email ? ` (${parent.email})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line items */}
            <div className="space-y-3">
              <FormLabel>Line Items *</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`line_items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`line_items.${index}.student_name`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Input placeholder="Student" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`line_items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-16">
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`line_items.${index}.unit_price`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Price"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex w-20 items-center justify-end pt-2 text-sm font-medium">
                    ${((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0)).toFixed(2)}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ description: '', student_name: '', quantity: 1, unit_price: 0 })
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Line Item
              </Button>

              {/* Subtotal */}
              <div className="flex justify-end border-t pt-2 text-sm">
                <span className="mr-4 font-medium">Subtotal:</span>
                <span className="w-20 text-right font-bold">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Due date */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => {
                const dateValue = field.value
                  ? new Date(field.value + 'T00:00:00')
                  : undefined
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(dateValue!, 'PPP')
                              : 'Pick a date'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateValue}
                          onSelect={(date) => {
                            if (date) {
                              const yyyy = date.getFullYear()
                              const mm = String(date.getMonth() + 1).padStart(2, '0')
                              const dd = String(date.getDate()).padStart(2, '0')
                              field.onChange(`${yyyy}-${mm}-${dd}`)
                            } else {
                              field.onChange('')
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
