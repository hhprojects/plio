'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight, CalendarDays, Users, Receipt, Globe, UserCog, Puzzle, GraduationCap, Music, Activity, Heart, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInView } from '@/hooks/use-in-view'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Templates', href: '#templates' },
]

const verticals = [
  'Tuition Centres',
  'Yoga Studios',
  'Music Schools',
  'Wellness Centres',
  'And more',
]

const features = [
  {
    icon: CalendarDays,
    title: 'Calendar',
    description: 'Recurring classes and one-off appointments with drag-and-drop rescheduling.',
  },
  {
    icon: Users,
    title: 'Clients',
    description: 'Contact records, dependents, notes, and tags — all in one place.',
  },
  {
    icon: Receipt,
    title: 'Invoicing',
    description: 'Generate invoices, track payments, and calculate GST automatically.',
  },
  {
    icon: Globe,
    title: 'Online Booking',
    description: 'Share your public booking page — clients pick a slot, you get notified.',
  },
  {
    icon: UserCog,
    title: 'Team',
    description: 'Staff profiles, weekly availability, overrides, and schedule management.',
  },
  {
    icon: Puzzle,
    title: 'Modular System',
    description: 'Enable only what you need. Rename modules to match your vocabulary.',
    accent: true,
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { ref: featuresRef, inView: featuresInView } = useInView({ threshold: 0.1 })
  const { ref: stepsRef, inView: stepsInView } = useInView({ threshold: 0.1 })
  const { ref: templatesRef, inView: templatesInView } = useInView({ threshold: 0.1 })

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* ── Sticky Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-display text-2xl text-indigo-500 tracking-tight">
            Plio
          </Link>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-slate-900 after:transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right actions — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          {/* Hamburger — mobile */}
          <button
            type="button"
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-6 pb-6 pt-2 flex flex-col gap-4 border-t border-slate-100">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" className="rounded-full" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section
        className="relative overflow-hidden bg-white"
        style={{
          backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Soft radial fade so the dot grid fades out at edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_40%,white_100%)] pointer-events-none" />

        <div className="relative mx-auto max-w-3xl px-6 py-32 sm:py-40 text-center">
          {/* Headline */}
          <h1
            className="font-display text-5xl sm:text-6xl text-slate-900 font-normal leading-[1.1] tracking-tight"
            style={{ animation: 'fadeUp 0.6s ease-out both' }}
          >
            Flexible management
            <br />
            for modern studios.
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
            style={{ animation: 'fadeUp 0.6s ease-out 0.12s both' }}
          >
            One platform for scheduling, clients, invoicing, and booking
            — configured to fit your business.
          </p>

          {/* CTA buttons */}
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            style={{ animation: 'fadeUp 0.6s ease-out 0.24s both' }}
          >
            <Button size="lg" className="rounded-full px-8 gap-2" asChild>
              <Link href="/register">
                Get Started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          {/* Verticals */}
          <p
            className="mt-14 text-sm text-slate-400 tracking-wide"
            style={{ animation: 'fadeUp 0.6s ease-out 0.36s both' }}
          >
            {verticals.map((v, i) => (
              <span key={v}>
                {i > 0 && <span className="mx-2 text-slate-300">&middot;</span>}
                {v}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="bg-slate-50 py-24 sm:py-32">
        <div ref={featuresRef} className="mx-auto max-w-6xl px-6">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight"
              style={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
              }}
            >
              Everything you need to run your business.
            </h2>
            <p
              className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed"
              style={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease-out 0.08s, transform 0.6s ease-out 0.08s',
              }}
            >
              Plio gives you the tools to manage your entire operation from one dashboard.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 transition-shadow hover:shadow-md ${
                    feature.accent ? 'border-l-4 border-l-indigo-500' : ''
                  }`}
                  style={{
                    opacity: featuresInView ? 1 : 0,
                    transform: featuresInView ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease-out ${i * 80}ms, transform 0.5s ease-out ${i * 80}ms`,
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="bg-slate-900 text-white py-24 sm:py-32">
        <div ref={stepsRef} className="mx-auto max-w-6xl px-6">
          {/* Section header */}
          <h2
            className="font-display text-3xl sm:text-4xl text-center tracking-tight"
            style={{
              opacity: stepsInView ? 1 : 0,
              transform: stepsInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            How it works
          </h2>

          {/* Steps row */}
          <div className="mt-16 flex flex-wrap justify-center gap-y-10">
            {[
              { num: '1', title: 'Register', desc: 'Submit your business details and apply to join' },
              { num: '2', title: 'Pick a Template', desc: 'Choose Tuition Centre, Music School, Yoga Studio, or more' },
              { num: '3', title: 'Customize', desc: 'Toggle modules, rename them, reorder your sidebar' },
              { num: '4', title: 'Share Your Link', desc: 'Clients book online instantly via your public booking page' },
              { num: '5', title: 'Manage Everything', desc: 'Calendar, attendance, invoicing — one dashboard' },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex items-start">
                {/* Step card */}
                <div
                  className="w-44 sm:w-48 text-center px-2"
                  style={{
                    opacity: stepsInView ? 1 : 0,
                    transform: stepsInView ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease-out ${i * 100}ms, transform 0.5s ease-out ${i * 100}ms`,
                  }}
                >
                  <span className="font-display text-3xl text-indigo-400">{step.num}</span>
                  <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>

                {/* Connector line between steps (desktop only) */}
                {i < arr.length - 1 && (
                  <div className="hidden lg:flex items-center self-center pt-1">
                    <div className="w-8 border-t border-dashed border-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates Section ── */}
      <section id="templates" className="bg-white py-24 sm:py-32">
        <div ref={templatesRef} className="mx-auto max-w-6xl px-6">
          {/* Section header */}
          <h2
            className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight text-center"
            style={{
              opacity: templatesInView ? 1 : 0,
              transform: templatesInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            Start from a template, make it yours.
          </h2>

          {/* Template cards */}
          <div
            className="mt-14 flex gap-4 overflow-x-auto pb-4 sm:pb-0 snap-x snap-mandatory sm:snap-none sm:overflow-visible sm:justify-center"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { icon: GraduationCap, name: 'Tuition Centre', modules: 'Students \u00b7 Courses \u00b7 Tutors' },
              { icon: Music, name: 'Music School', modules: 'Students \u00b7 Lessons \u00b7 Studios' },
              { icon: Activity, name: 'Yoga Studio', modules: 'Members \u00b7 Classes \u00b7 Booking' },
              { icon: Heart, name: 'Wellness Centre', modules: 'Clients \u00b7 Treatments \u00b7 Rooms' },
              { icon: Settings2, name: 'General', modules: 'All default module names' },
            ].map((template, i) => {
              const Icon = template.icon
              return (
                <div
                  key={template.name}
                  className="min-w-[220px] flex-shrink-0 snap-start bg-white rounded-xl border border-slate-200 p-6 hover:scale-[1.03] hover:shadow-md transition-all duration-200 cursor-default"
                  style={{
                    opacity: templatesInView ? 1 : 0,
                    transform: templatesInView ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease-out ${i * 80}ms, transform 0.5s ease-out ${i * 80}ms`,
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-3">{template.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{template.modules}</p>
                </div>
              )
            })}
          </div>

          {/* Below cards text */}
          <p
            className="text-sm text-slate-400 mt-6 text-center"
            style={{
              opacity: templatesInView ? 1 : 0,
              transition: 'opacity 0.6s ease-out 0.4s',
            }}
          >
            Or build your own from scratch
          </p>
        </div>
      </section>
    </>
  )
}
