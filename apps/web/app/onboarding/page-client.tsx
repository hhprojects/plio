'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight, Loader2, Layers, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ONBOARDING_TEMPLATES } from '@/lib/onboarding-templates'
import { TemplatePicker } from '@/components/onboarding/template-picker'
import { ModuleCustomizer, type ModuleConfig } from '@/components/onboarding/module-customizer'
import { BrandingStep } from '@/components/onboarding/branding-step'
import { completeOnboarding } from './actions'

interface SystemModule {
  id: string
  slug: string
  default_title: string
  icon: string
  always_on: boolean
  dependencies: string[]
}

interface OnboardingPageClientProps {
  modules: SystemModule[]
  tenantId: string
}

const STEPS = ['Choose Path', 'Configure Modules', 'Branding', 'Done']

function buildModuleConfig(
  systemModules: SystemModule[],
  templateModules?: Record<string, { enabled: boolean; title?: string; config?: Record<string, unknown> }>
): ModuleConfig[] {
  return systemModules.map((m) => {
    const tmpl = templateModules?.[m.slug]
    return {
      module_id: m.id,
      slug: m.slug,
      default_title: m.default_title,
      always_on: m.always_on,
      enabled: m.always_on || (tmpl ? tmpl.enabled : true),
      custom_title: tmpl?.title ?? '',
      config: tmpl?.config ?? {},
    }
  })
}

export function OnboardingPageClient({ modules: systemModules, tenantId }: OnboardingPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState(0)
  const [path, setPath] = useState<'template' | 'custom' | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig[]>(() =>
    buildModuleConfig(systemModules)
  )
  const [branding, setBranding] = useState({
    business_name: '',
    accent_color: '#6366f1',
    logo_url: '',
  })

  // Derived step logic — path choice adds an extra sub-step for template selection
  // Step 0: Choose path (template vs custom)
  // Step 1: If template → template picker; if custom → goes straight to modules
  // Step 2: Module customizer
  // Step 3: Branding
  // Step 4: Summary / Done

  function handlePathSelect(p: 'template' | 'custom') {
    setPath(p)
    if (p === 'custom') {
      setModuleConfig(buildModuleConfig(systemModules))
      setStep(2) // skip template picker
    } else {
      setStep(1)
    }
  }

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId)
    const template = ONBOARDING_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setModuleConfig(buildModuleConfig(systemModules, template.modules))
    }
  }

  function handleBrandingChange(field: 'business_name' | 'accent_color' | 'logo_url', value: string) {
    setBranding((prev) => ({ ...prev, [field]: value }))
  }

  function handleNext() {
    if (step === 1) {
      // template picker → modules
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    }
  }

  function handleBack() {
    if (step === 4) setStep(3)
    else if (step === 3) setStep(2)
    else if (step === 2) {
      if (path === 'template') setStep(1)
      else setStep(0)
    } else if (step === 1) setStep(0)
  }

  function handleComplete() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set(
        'modules',
        JSON.stringify(
          moduleConfig.map((m) => ({
            module_id: m.module_id,
            enabled: m.enabled,
            custom_title: m.custom_title || null,
            config: m.config,
          }))
        )
      )
      fd.set('business_name', branding.business_name)
      fd.set('accent_color', branding.accent_color)
      fd.set('logo_url', branding.logo_url)

      const result = await completeOnboarding(fd)
      if (result?.success) {
        router.push('/dashboard')
      }
    })
  }

  // Map actual step to display step index for the indicator
  function displayStepIndex(): number {
    if (step <= 1) return 0
    if (step === 2) return 1
    if (step === 3) return 2
    return 3
  }

  const canGoNext =
    (step === 1 && selectedTemplate !== null) ||
    step === 2 ||
    step === 3

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Set up your workspace</h1>
          <span className="text-sm text-slate-400">
            Step {displayStepIndex() + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          {STEPS.map((label, i) => {
            const current = displayStepIndex()
            const isCompleted = i < current
            const isCurrent = i === current

            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={cn(
                      'h-px w-8',
                      isCompleted ? 'bg-indigo-500' : 'bg-slate-200'
                    )}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                      isCompleted && 'bg-indigo-500 text-white',
                      isCurrent && 'border-2 border-indigo-500 text-indigo-600',
                      !isCompleted && !isCurrent && 'border border-slate-300 text-slate-400'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'hidden text-sm sm:inline',
                      isCurrent ? 'font-medium text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-10">
        {/* Step 0 — Choose Path */}
        {step === 0 && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-2 text-2xl font-bold text-slate-900">How would you like to start?</h2>
            <p className="mb-8 text-slate-500">
              Choose a template for quick setup, or build your own configuration from scratch.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handlePathSelect('template')}
                className="flex flex-col items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-8 text-center transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                  <Layers className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Start from a template</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Pre-configured modules for common business types
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePathSelect('custom')}
                className="flex flex-col items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-8 text-center transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Wrench className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Build your own</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Enable exactly the modules you need
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Template Picker */}
        {step === 1 && (
          <TemplatePicker
            templates={ONBOARDING_TEMPLATES}
            selected={selectedTemplate}
            onSelect={handleTemplateSelect}
          />
        )}

        {/* Step 2 — Module Customizer */}
        {step === 2 && (
          <ModuleCustomizer modules={moduleConfig} onChange={setModuleConfig} />
        )}

        {/* Step 3 — Branding */}
        {step === 3 && (
          <BrandingStep
            businessName={branding.business_name}
            accentColor={branding.accent_color}
            logoUrl={branding.logo_url}
            onChange={handleBrandingChange}
          />
        )}

        {/* Step 4 — Summary / Done */}
        {step === 4 && (
          <div className="mx-auto max-w-lg text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Check className="h-8 w-8 text-indigo-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">You&apos;re all set!</h2>
            <p className="mb-8 text-slate-500">
              Here&apos;s a summary of your setup. Click the button below to complete onboarding and go to your dashboard.
            </p>

            {/* Summary */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 text-left">
              {branding.business_name && (
                <div className="mb-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Business</p>
                  <p className="text-sm font-medium text-slate-900">{branding.business_name}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Accent Colour</p>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full border border-slate-200"
                    style={{ backgroundColor: branding.accent_color }}
                  />
                  <span className="text-sm font-mono text-slate-600">{branding.accent_color}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Enabled Modules</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {moduleConfig
                    .filter((m) => m.enabled)
                    .map((m) => (
                      <span
                        key={m.module_id}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                      >
                        {m.custom_title || m.default_title}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleComplete}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Go to Dashboard'
              )}
            </button>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      {step > 0 && step < 4 && (
        <footer className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
