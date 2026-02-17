'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ServiceItem {
  id: string
  title: string
  description: string | null
  category: string | null
  duration_minutes: number
  price: number
  color_code: string
}

interface ServiceSelectorProps {
  services: ServiceItem[]
  selectedId: string | null
  onSelect: (service: ServiceItem) => void
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`
}

export function ServiceSelector({ services, selectedId, onSelect }: ServiceSelectorProps) {
  // Group services by category
  const grouped = services.reduce<Record<string, ServiceItem[]>>((acc, service) => {
    const category = service.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(service)
    return acc
  }, {})

  const categories = Object.keys(grouped).sort()

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No services available at this time.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Select a Service</h2>
      {categories.map((category) => (
        <div key={category} className="space-y-3">
          {categories.length > 1 && (
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {category}
            </h3>
          )}
          {grouped[category].map((service) => (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedId === service.id
                  ? 'ring-2 ring-indigo-600 bg-indigo-50/50'
                  : 'hover:border-indigo-300'
              }`}
              onClick={() => onSelect(service)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{service.title}</CardTitle>
                    {service.description && (
                      <CardDescription className="mt-1">{service.description}</CardDescription>
                    )}
                  </div>
                  <span className="text-lg font-semibold text-indigo-600 whitespace-nowrap ml-4">
                    {formatPrice(service.price)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="secondary" className="text-xs">
                  {service.duration_minutes} min
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
