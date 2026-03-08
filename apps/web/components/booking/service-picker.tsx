'use client'

interface ServiceItem {
  id: string
  name: string
  description: string | null
  duration_minutes: number | null
  price: number | null
  currency: string
  buffer_minutes: number
  color: string | null
}

interface ServicePickerProps {
  services: ServiceItem[]
  selectedId: string | null
  accentColor: string
  onSelect: (service: ServiceItem) => void
}

export function ServicePicker({
  services,
  selectedId,
  accentColor,
  onSelect,
}: ServicePickerProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No services available at this time.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Select a Service</h2>
      <div className="grid gap-3">
        {services.map((service) => {
          const isSelected = selectedId === service.id
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={`w-full text-left rounded-lg border p-4 transition-all hover:shadow-md ${
                isSelected
                  ? 'border-2 bg-indigo-50/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={
                isSelected
                  ? { borderColor: accentColor }
                  : {}
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {service.color && (
                      <span
                        className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: service.color }}
                      />
                    )}
                    <h3 className="font-medium text-gray-900">
                      {service.name}
                    </h3>
                  </div>
                  {service.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    {service.duration_minutes != null && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {service.duration_minutes} min
                      </span>
                    )}
                  </div>
                </div>
                {service.price != null && (
                  <span
                    className="text-lg font-semibold whitespace-nowrap ml-4"
                    style={{ color: accentColor }}
                  >
                    ${service.price.toFixed(2)}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
