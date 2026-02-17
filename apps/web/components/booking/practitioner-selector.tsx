'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Practitioner {
  id: string
  full_name: string
}

interface PractitionerSelectorProps {
  practitioners: Practitioner[]
  selectedId: string | null
  onSelect: (practitioner: Practitioner | null) => void
  onBack: () => void
}

export function PractitionerSelector({
  practitioners,
  selectedId,
  onSelect,
  onBack,
}: PractitionerSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <h2 className="text-lg font-semibold">Choose a Practitioner</h2>
      </div>

      <div className="space-y-3">
        {/* "Any available" option */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedId === null
              ? 'ring-2 ring-indigo-600 bg-indigo-50/50'
              : 'hover:border-indigo-300'
          }`}
          onClick={() => onSelect(null)}
        >
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Any available</p>
              <p className="text-sm text-muted-foreground">We&apos;ll match you with the first available practitioner</p>
            </div>
          </CardContent>
        </Card>

        {practitioners.map((practitioner) => (
          <Card
            key={practitioner.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedId === practitioner.id
                ? 'ring-2 ring-indigo-600 bg-indigo-50/50'
                : 'hover:border-indigo-300'
            }`}
            onClick={() => onSelect(practitioner)}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium">
                {practitioner.full_name.charAt(0).toUpperCase()}
              </div>
              <p className="font-medium">{practitioner.full_name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
