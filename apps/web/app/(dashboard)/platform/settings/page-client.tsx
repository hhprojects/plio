'use client'

import { Check, X } from 'lucide-react'

interface Module {
  id: string
  slug: string
  default_title: string
  always_on: boolean
}

interface Props {
  modules: Module[]
}

export function PlatformSettingsClient({ modules }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500">Global platform configuration</p>
      </div>

      {/* Platform defaults */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Defaults</h2>
        <p className="text-sm text-gray-500 mb-4">Default settings applied to new tenants.</p>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-400">Timezone</dt>
            <dd className="mt-1 text-sm text-gray-900">Asia/Singapore</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-400">Currency</dt>
            <dd className="mt-1 text-sm text-gray-900">SGD</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-400">Default Tier</dt>
            <dd className="mt-1 text-sm text-gray-900">Free</dd>
          </div>
        </dl>
      </div>

      {/* System modules */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">System Modules</h2>
        <p className="text-sm text-gray-500 mb-4">Modules available to all tenants.</p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Module
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Always On
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {modules.map((mod) => (
                <tr key={mod.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {mod.default_title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {mod.slug}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {mod.always_on ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
