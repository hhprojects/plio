'use client'

import { useState, useTransition } from 'react'
import { updateBranding } from '@/app/(dashboard)/settings/actions'

interface BrandingFormProps {
  settings: {
    business_name?: string
    accent_color?: string
    logo_url?: string
  }
  tenantName: string
}

export function BrandingForm({ settings, tenantName }: BrandingFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [businessName, setBusinessName] = useState(settings.business_name ?? tenantName)
  const [accentColor, setAccentColor] = useState(settings.accent_color ?? '#6366f1')
  const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? '')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    const formData = new FormData()
    formData.set('business_name', businessName)
    formData.set('accent_color', accentColor)
    formData.set('logo_url', logoUrl)

    startTransition(async () => {
      const result = await updateBranding(formData)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Branding updated successfully.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
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

      <div>
        <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
          Business Name
        </label>
        <input
          id="business_name"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          placeholder="Your business name"
        />
      </div>

      <div>
        <label htmlFor="accent_color" className="block text-sm font-medium text-gray-700">
          Accent Color
        </label>
        <div className="mt-1 flex items-center gap-3">
          <input
            id="accent_color"
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border border-gray-300 p-0.5"
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
            placeholder="#6366f1"
            maxLength={7}
          />
          <div
            className="h-10 w-10 rounded-md border border-gray-200"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">
          Logo URL
        </label>
        <input
          id="logo_url"
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          placeholder="https://example.com/logo.png"
        />
        <p className="mt-1 text-xs text-gray-400">
          Paste a URL to your logo. Full upload support coming soon.
        </p>
        {logoUrl && (
          <div className="mt-3">
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-16 w-auto rounded border border-gray-200 object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : 'Save Branding'}
      </button>
    </form>
  )
}
