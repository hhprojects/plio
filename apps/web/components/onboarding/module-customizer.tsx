'use client'

import { ChevronUp, ChevronDown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModuleConfig {
  module_id: string
  slug: string
  default_title: string
  always_on: boolean
  enabled: boolean
  custom_title: string
  config: Record<string, unknown>
}

interface ModuleCustomizerProps {
  modules: ModuleConfig[]
  onChange: (modules: ModuleConfig[]) => void
}

export function ModuleCustomizer({ modules, onChange }: ModuleCustomizerProps) {
  function toggle(index: number) {
    const mod = modules[index]
    if (mod.always_on) return
    const updated = [...modules]
    updated[index] = { ...mod, enabled: !mod.enabled }
    onChange(updated)
  }

  function updateTitle(index: number, title: string) {
    const updated = [...modules]
    updated[index] = { ...updated[index], custom_title: title }
    onChange(updated)
  }

  function updateConfig(index: number, key: string, value: unknown) {
    const updated = [...modules]
    updated[index] = {
      ...updated[index],
      config: { ...updated[index].config, [key]: value },
    }
    onChange(updated)
  }

  function moveUp(index: number) {
    if (index === 0) return
    const updated = [...modules]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    onChange(updated)
  }

  function moveDown(index: number) {
    if (index === modules.length - 1) return
    const updated = [...modules]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    onChange(updated)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-2xl font-bold text-slate-900">Configure your modules</h2>
      <p className="mb-8 text-slate-500">
        Enable the features you need, rename them to match your business, and reorder them.
      </p>

      <div className="space-y-2">
        {modules.map((mod, index) => (
          <div
            key={mod.module_id}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 transition-colors',
              mod.enabled
                ? 'border-slate-200 bg-white'
                : 'border-slate-100 bg-slate-50 opacity-60'
            )}
          >
            {/* Reorder */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === modules.length - 1}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Toggle */}
            <div className="flex items-center">
              {mod.always_on ? (
                <div className="flex h-5 w-5 items-center justify-center" title="Always enabled">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
              ) : (
                <input
                  type="checkbox"
                  checked={mod.enabled}
                  onChange={() => toggle(index)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Title */}
            <div className="flex-1">
              <input
                type="text"
                value={mod.custom_title || ''}
                onChange={(e) => updateTitle(index, e.target.value)}
                placeholder={mod.default_title}
                className="w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-0 focus:outline-none"
              />
              <p className="text-xs text-slate-400">{mod.slug}</p>
            </div>

            {/* Calendar sub-options */}
            {mod.slug === 'calendar' && mod.enabled && (
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!mod.config.recurring_enabled}
                    onChange={(e) => updateConfig(index, 'recurring_enabled', e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Recurring
                </label>
                <label className="flex items-center gap-1.5 text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!mod.config.appointments_enabled}
                    onChange={(e) => updateConfig(index, 'appointments_enabled', e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Appointments
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
