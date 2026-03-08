'use client'

interface BrandingStepProps {
  businessName: string
  accentColor: string
  logoUrl: string
  onChange: (field: 'business_name' | 'accent_color' | 'logo_url', value: string) => void
}

const ACCENT_PRESETS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Violet', value: '#8b5cf6' },
]

export function BrandingStep({ businessName, accentColor, logoUrl, onChange }: BrandingStepProps) {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-2 text-2xl font-bold text-slate-900">Brand your workspace</h2>
      <p className="mb-8 text-slate-500">
        Add your business name and pick an accent colour. You can change these later in Settings.
      </p>

      <div className="space-y-6">
        {/* Business Name */}
        <div>
          <label htmlFor="business_name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Business name
          </label>
          <input
            id="business_name"
            type="text"
            value={businessName}
            onChange={(e) => onChange('business_name', e.target.value)}
            placeholder="My Business"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        {/* Accent Color */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Accent colour
          </label>
          <div className="flex flex-wrap gap-3">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange('accent_color', preset.value)}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    accentColor === preset.value
                      ? 'border-slate-900 ring-2 ring-slate-900/20'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
                <span className="text-xs text-slate-500">{preset.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="custom_color" className="text-sm text-slate-500">
              Custom:
            </label>
            <input
              id="custom_color"
              type="color"
              value={accentColor || '#6366f1'}
              onChange={(e) => onChange('accent_color', e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-slate-300"
            />
            <span className="text-sm font-mono text-slate-500">{accentColor || '#6366f1'}</span>
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <label htmlFor="logo_url" className="mb-1.5 block text-sm font-medium text-slate-700">
            Logo URL <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="logo_url"
            type="url"
            value={logoUrl}
            onChange={(e) => onChange('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
          {logoUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-10 w-10 rounded border border-slate-200 object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <span className="text-sm text-slate-500">Preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
