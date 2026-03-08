'use client'

import { useState, useTransition } from 'react'
import { updateModules } from '@/app/(dashboard)/settings/actions'

interface ModuleRow {
  id: string
  tenant_id: string
  module_id: string
  enabled: boolean
  custom_title: string | null
  sort_order: number
  config: Record<string, unknown>
  module: {
    id: string
    slug: string
    default_title: string
    icon: string
    always_on: boolean
    dependencies: string[]
  }
}

interface ModuleConfigProps {
  tenantModules: ModuleRow[]
}

export function ModuleConfig({ tenantModules }: ModuleConfigProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [modules, setModules] = useState<ModuleRow[]>(
    [...tenantModules].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  // Build a lookup from module_id to slug for dependency checking
  const idToSlug: Record<string, string> = {}
  for (const m of modules) {
    idToSlug[m.module_id] = m.module.slug
  }
  const slugToEnabled: Record<string, boolean> = {}
  for (const m of modules) {
    slugToEnabled[m.module.slug] = m.enabled
  }

  function getDependencyWarning(mod: ModuleRow): string | null {
    if (!mod.enabled) return null
    const missing = mod.module.dependencies.filter((dep) => !slugToEnabled[dep])
    if (missing.length === 0) return null
    return `Requires: ${missing.join(', ')}`
  }

  function getDisabledByWarning(mod: ModuleRow): string | null {
    if (mod.enabled) return null
    // Check if any enabled module depends on this one
    const dependents = modules.filter(
      (m) => m.enabled && m.module.dependencies.includes(mod.module.slug)
    )
    if (dependents.length === 0) return null
    return `Required by: ${dependents.map((d) => d.module.default_title).join(', ')}`
  }

  function toggleModule(index: number) {
    setModules((prev) => {
      const next = [...prev]
      const mod = { ...next[index] }
      mod.enabled = !mod.enabled
      next[index] = mod
      return next
    })
  }

  function updateCustomTitle(index: number, title: string) {
    setModules((prev) => {
      const next = [...prev]
      const mod = { ...next[index] }
      mod.custom_title = title || null
      next[index] = mod
      return next
    })
  }

  function updateConfig(index: number, key: string, value: unknown) {
    setModules((prev) => {
      const next = [...prev]
      const mod = { ...next[index] }
      mod.config = { ...mod.config, [key]: value }
      next[index] = mod
      return next
    })
  }

  function moveUp(index: number) {
    if (index === 0) return
    setModules((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = { ...next[index], sort_order: index - 1 }
      next[index] = { ...temp, sort_order: index }
      return next
    })
  }

  function moveDown(index: number) {
    if (index >= modules.length - 1) return
    setModules((prev) => {
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = { ...next[index], sort_order: index + 1 }
      next[index] = { ...temp, sort_order: index }
      return next
    })
  }

  function handleSave() {
    setMessage(null)
    const payload = modules.map((m, i) => ({
      module_id: m.module_id,
      enabled: m.enabled,
      custom_title: m.custom_title,
      sort_order: i,
      config: m.config,
    }))

    startTransition(async () => {
      const result = await updateModules(JSON.stringify(payload))
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Module configuration saved.' })
      }
    })
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
        {modules.map((mod, index) => {
          const depWarning = getDependencyWarning(mod)
          const disabledByWarning = getDisabledByWarning(mod)
          const isExpanded = expandedSlug === mod.module.slug
          const isCalendar = mod.module.slug === 'calendar'

          return (
            <div key={mod.module_id} className="p-4">
              <div className="flex items-center gap-3">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index >= modules.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Enabled checkbox */}
                <input
                  type="checkbox"
                  checked={mod.enabled}
                  disabled={mod.module.always_on}
                  onChange={() => toggleModule(index)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />

                {/* Custom title input */}
                <input
                  type="text"
                  value={mod.custom_title ?? ''}
                  onChange={(e) => updateCustomTitle(index, e.target.value)}
                  placeholder={mod.module.default_title}
                  className="w-40 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />

                {/* Default title */}
                <span className="text-sm text-gray-400">
                  {mod.module.default_title}
                  {mod.module.always_on && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      Always on
                    </span>
                  )}
                </span>

                {/* Expand button for calendar */}
                {isCalendar && (
                  <button
                    type="button"
                    onClick={() => setExpandedSlug(isExpanded ? null : mod.module.slug)}
                    className="ml-auto text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {isExpanded ? 'Collapse' : 'Configure'}
                  </button>
                )}
              </div>

              {/* Dependency warnings */}
              {depWarning && (
                <p className="mt-2 ml-16 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                  {depWarning}
                </p>
              )}
              {disabledByWarning && (
                <p className="mt-2 ml-16 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                  {disabledByWarning}
                </p>
              )}

              {/* Calendar config expanded */}
              {isCalendar && isExpanded && (
                <div className="mt-3 ml-16 space-y-2 rounded-md bg-gray-50 p-3 border border-gray-200">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={mod.config.recurring_enabled !== false}
                      onChange={(e) => updateConfig(index, 'recurring_enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Enable recurring classes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={mod.config.appointments_enabled !== false}
                      onChange={(e) => updateConfig(index, 'appointments_enabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Enable appointments
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : 'Save Module Config'}
      </button>
    </div>
  )
}
