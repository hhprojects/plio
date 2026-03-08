'use client'

import type { Service } from '@plio/db'
import { Pencil, Trash2 } from 'lucide-react'

interface ServiceTableProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
}

function formatPrice(price: number | null, currency: string): string {
  if (price == null) return '--'
  return `${currency} ${price.toFixed(2)}`
}

export function ServiceTable({ services, onEdit, onDelete }: ServiceTableProps) {
  if (services.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 shadow-sm text-center">
        <p className="text-gray-500">No services yet. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Capacity / Duration</th>
            <th className="px-4 py-3 font-medium">Color</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {services.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{service.name}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    service.type === 'recurring'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {service.type === 'recurring' ? 'Recurring' : 'Bookable'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatPrice(service.price, service.currency)}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {service.type === 'recurring'
                  ? service.capacity != null
                    ? `${service.capacity} students`
                    : '--'
                  : service.duration_minutes != null
                    ? `${service.duration_minutes} min`
                    : '--'}
              </td>
              <td className="px-4 py-3">
                {service.color ? (
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: service.color }}
                  />
                ) : (
                  <span className="text-gray-400">--</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(service)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(service)}
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
