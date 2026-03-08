'use client'

import {
  GraduationCap,
  Music,
  Heart,
  Sparkles,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OnboardingTemplate } from '@/lib/onboarding-templates'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  Music,
  Heart,
  Sparkles,
  Briefcase,
}

interface TemplatePickerProps {
  templates: OnboardingTemplate[]
  selected: string | null
  onSelect: (templateId: string) => void
}

export function TemplatePicker({ templates, selected, onSelect }: TemplatePickerProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-2xl font-bold text-slate-900">Choose a template</h2>
      <p className="mb-8 text-slate-500">
        Pick a template that matches your business. You can customise everything in the next step.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => {
          const Icon = ICON_MAP[t.icon] ?? Briefcase
          const isSelected = selected === t.id

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={cn(
                'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:shadow-md',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-xl',
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="mt-1 text-sm text-slate-500">{t.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
