'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight, CalendarDays, Users, Receipt, Globe, UserCog, Puzzle } from 'lucide-react'
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
    </>
  )
}
