'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  X,
  ArrowRight,
  CalendarDays,
  Users,
  Receipt,
  Globe,
  UserCog,
  Puzzle,
  GraduationCap,
  Music,
  Activity,
  Heart,
  Settings2,
  MapPin,
  LayoutGrid,
  Shield,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WavesBackground } from '@/components/ui/waves-background'
import { useInView } from '@/hooks/use-in-view'

/* ─── Data ────────────────────────────────────────────────────────────── */

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
  'Dance Academies',
]

const templates = [
  {
    icon: GraduationCap,
    name: 'Tuition Centre',
    modules: ['Students', 'Courses', 'Tutors', 'Rooms'],
    color: '#6366f1',
    bgTint: 'rgba(99, 102, 241, 0.06)',
    borderTint: 'rgba(99, 102, 241, 0.3)',
  },
  {
    icon: Music,
    name: 'Music School',
    modules: ['Students', 'Lessons', 'Studios', 'Instruments'],
    color: '#8b5cf6',
    bgTint: 'rgba(139, 92, 246, 0.06)',
    borderTint: 'rgba(139, 92, 246, 0.3)',
  },
  {
    icon: Activity,
    name: 'Yoga Studio',
    modules: ['Members', 'Classes', 'Instructors', 'Booking'],
    color: '#22c55e',
    bgTint: 'rgba(34, 197, 94, 0.06)',
    borderTint: 'rgba(34, 197, 94, 0.3)',
  },
  {
    icon: Heart,
    name: 'Wellness Centre',
    modules: ['Clients', 'Treatments', 'Therapists', 'Rooms'],
    color: '#ec4899',
    bgTint: 'rgba(236, 72, 153, 0.06)',
    borderTint: 'rgba(236, 72, 153, 0.3)',
  },
  {
    icon: Settings2,
    name: 'Build Your Own',
    modules: ['Start blank', 'Enable what you need'],
    color: '#64748b',
    bgTint: 'rgba(100, 116, 139, 0.06)',
    borderTint: 'rgba(100, 116, 139, 0.3)',
    dashed: true,
  },
]

const featuresLarge = [
  {
    icon: CalendarDays,
    title: 'Calendar',
    description: 'Recurring classes, one-off sessions, drag-and-drop rescheduling.',
  },
  {
    icon: Users,
    title: 'Clients',
    description: 'Contact records, dependents, notes, and tags in one place.',
  },
]

const featuresCompact = [
  {
    icon: Receipt,
    title: 'Invoicing',
    description: 'Generate invoices, track payments, calculate GST.',
  },
  {
    icon: Globe,
    title: 'Online Booking',
    description: 'Clients pick a slot from your public page.',
  },
  {
    icon: UserCog,
    title: 'Team',
    description: 'Staff profiles, availability, and schedules.',
  },
  {
    icon: Puzzle,
    title: 'Modular System',
    description: 'Rename modules. Reorder your sidebar. Make it yours.',
    accent: true,
  },
]

const steps = [
  {
    num: '1',
    title: 'Pick a template',
    desc: 'Choose the setup that matches your business, or start from scratch.',
  },
  {
    num: '2',
    title: 'Make it yours',
    desc: 'Toggle modules, rename them, set your schedule and availability.',
  },
  {
    num: '3',
    title: 'Share your link',
    desc: 'Your booking page goes live — clients book, you manage.',
  },
]

const proofItems = [
  { icon: MapPin, text: 'Built in Singapore' },
  { icon: LayoutGrid, text: '9 configurable modules' },
  { icon: Shield, text: 'Multi-tenant ready' },
]

/* ─── Component ───────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [tickerIndex, setTickerIndex] = useState(0)
  const [hoveredTemplate, setHoveredTemplate] = useState<number | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)

  const { ref: templatesRef, getStaggerStyle: templatesStagger } = useInView({ threshold: 0.1, staggerInterval: 80 })
  const { ref: featuresRef, getStaggerStyle: featuresStagger, inView: featuresInView } = useInView({ threshold: 0.1, staggerInterval: 100 })
  const { ref: stepsRef, getStaggerStyle: stepsStagger, inView: stepsInView } = useInView({ threshold: 0.1, staggerInterval: 150 })
  const { ref: proofRef, getStaggerStyle: proofStagger } = useInView({ threshold: 0.2, staggerInterval: 100 })
  const { ref: ctaRef, getStaggerStyle: ctaStagger } = useInView({ threshold: 0.2 })

  // Scroll shadow for nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Verticals ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % verticals.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="h-screen overflow-y-auto"
      style={{
        fontFamily: 'var(--font-body)',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
      }}
    >
      {/* ── Sticky Nav ── */}
      <nav
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-shadow duration-300 ${
          scrolled ? 'shadow-sm' : 'shadow-none'
        }`}
        style={{
          backgroundColor: 'rgba(250, 250, 248, 0.92)',
          borderColor: '#e2e8f0',
          animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl text-indigo-500 tracking-tight">
            Plio
          </Link>

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

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="#cta">Book a Demo</a>
            </Button>
            <Button size="sm" className="rounded-full px-5 gap-1.5" asChild>
              <a href="#cta">
                Join Waitlist <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </div>

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
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
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
                <a href="#cta">Book a Demo</a>
              </Button>
              <Button size="sm" className="rounded-full" asChild>
                <a href="#cta">
                  Join Waitlist <ArrowRight className="ml-1 size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          minHeight: '100vh',
          scrollSnapAlign: 'start',
        }}
      >
        {/* Animated wave canvas background */}
        <WavesBackground />

        <div className="relative mx-auto max-w-3xl px-6 py-32 sm:py-40 text-center">
          <h1
            className="font-display text-4xl sm:text-5xl lg:text-6xl text-slate-900 font-normal leading-[1.1] tracking-tight"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}
          >
            One platform to run your
            <br />
            entire centre.
          </h1>

          <p
            className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both' }}
          >
            Scheduling, clients, invoicing, and online booking —
            configured to fit the way you work.
          </p>

          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both' }}
          >
            <Button size="lg" className="rounded-full px-8 gap-2" asChild>
              <a href="#cta">
                Join the Waitlist <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8" asChild>
              <a href="#cta">Book a Demo</a>
            </Button>
          </div>

          {/* Verticals ticker */}
          <div
            className="mt-14 text-sm text-slate-400 tracking-wide"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both' }}
          >
            <span className="mr-2">Built for:</span>
            <span className="relative inline-block h-5 w-40 overflow-hidden align-middle">
              {verticals.map((v, i) => {
                const isCurrent = tickerIndex === i
                const isPast = tickerIndex > i || (tickerIndex === 0 && i !== 0)
                return (
                  <span
                    key={v}
                    className="absolute inset-0 flex items-center justify-center font-medium text-indigo-500 transition-all duration-500"
                    style={{
                      opacity: isCurrent ? 1 : 0,
                      transform: isCurrent
                        ? 'translateY(0)'
                        : isPast
                          ? 'translateY(-8px)'
                          : 'translateY(8px)',
                      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {v}
                  </span>
                )
              })}
            </span>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.8s both' }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-slate-400"
              style={{ animation: 'scrollDot 2s ease-in-out infinite' }}
            />
          </div>
        </div>
      </section>

      {/* ── Templates Showcase ── */}
      <section
        id="templates"
        className="relative flex items-center"
        style={{
          backgroundColor: '#fafaf8',
          minHeight: '100vh',
          scrollSnapAlign: 'start',
        }}
      >
        {/* Top gradient fade from previous section */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

        <div ref={templatesRef} className="mx-auto max-w-6xl px-6 py-24 sm:py-32 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight"
              style={templatesStagger(0)}
            >
              Choose your starting point.
            </h2>
            <p
              className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed"
              style={templatesStagger(1)}
            >
              Pick the template that matches your business. Every module —
              renamed, reordered, toggled — to fit your vocabulary.
            </p>
          </div>

          {/* Template cards */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:pb-0 scrollbar-hide">
            {templates.map((template, i) => {
              const Icon = template.icon
              const isHovered = hoveredTemplate === i
              return (
                <div
                  key={template.name}
                  className={`relative bg-white rounded-xl p-6 cursor-default transition-all duration-300 snap-center flex-shrink-0 w-[280px] sm:w-auto ${
                    template.dashed
                      ? 'border-2 border-dashed border-slate-300'
                      : 'border border-slate-200 shadow-sm'
                  }`}
                  style={{
                    ...templatesStagger(i + 2),
                    ...(isHovered
                      ? {
                          transform: 'translateY(-6px)',
                          boxShadow: '0 12px 40px -10px rgba(0,0,0,0.12)',
                          backgroundColor: template.bgTint,
                          borderColor: template.borderTint,
                        }
                      : {}),
                  }}
                  onMouseEnter={() => setHoveredTemplate(i)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                    style={{
                      backgroundColor: isHovered ? `${template.color}18` : '#e0e7ff',
                      color: isHovered ? template.color : '#6366f1',
                    }}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-3 text-lg">{template.name}</h3>

                  {/* Module list — stagger reveal on hover */}
                  <div className="mt-3 space-y-1.5">
                    {template.modules.map((mod, mi) => (
                      <p
                        key={mod}
                        className="text-sm text-slate-500 transition-all duration-300"
                        style={{
                          opacity: isHovered ? 1 : 0.6,
                          transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
                          transitionDelay: isHovered ? `${mi * 50}ms` : '0ms',
                        }}
                      >
                        <span
                          className="inline-block w-1 h-1 rounded-full mr-2 align-middle transition-colors duration-300"
                          style={{ backgroundColor: isHovered ? template.color : '#cbd5e1' }}
                        />
                        {mod}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <p
            className="text-sm text-slate-400 mt-8 text-center"
            style={templatesStagger(8)}
          >
            Or build your own from scratch &rarr;
          </p>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section
        id="features"
        className="relative flex items-center"
        style={{
          backgroundColor: '#ffffff',
          minHeight: '100vh',
          scrollSnapAlign: 'start',
        }}
      >
        {/* Section transition — subtle curved separator */}
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #fafaf8, transparent)',
          }}
        />

        <div ref={featuresRef} className="mx-auto max-w-6xl px-6 py-24 sm:py-32 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight"
              style={featuresStagger(0)}
            >
              Everything to run your day.
            </h2>
            <p
              className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed"
              style={featuresStagger(1)}
            >
              Six modules. Enable what you need, disable what you don&apos;t.
            </p>
          </div>

          {/* Large cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {featuresLarge.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group bg-white rounded-xl border border-slate-200 shadow-sm p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    opacity: featuresInView ? 1 : 0,
                    transform: featuresInView ? 'translateX(0)' : `translateX(${i === 0 ? '-24px' : '24px'})`,
                    transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${200 + i * 100}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${200 + i * 100}ms`,
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{feature.description}</p>

                  {/* Mini CSS illustration — Calendar */}
                  {feature.title === 'Calendar' && (
                    <div className="mt-6 grid grid-cols-7 gap-1">
                      {Array.from({ length: 7 }).map((_, d) => (
                        <div key={`h-${d}`} className="h-3 rounded-sm bg-indigo-100" />
                      ))}
                      {Array.from({ length: 21 }).map((_, d) => (
                        <div
                          key={`c-${d}`}
                          className="h-6 rounded-sm transition-all duration-500"
                          style={{
                            backgroundColor: [3, 10, 15, 18].includes(d) ? '#c7d2fe' : '#f8fafc',
                            transitionDelay: featuresInView ? `${d * 30 + 400}ms` : '0ms',
                            opacity: featuresInView ? 1 : 0,
                            transform: featuresInView ? 'scale(1)' : 'scale(0.8)',
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Mini CSS illustration — Clients */}
                  {feature.title === 'Clients' && (
                    <div className="mt-6 space-y-2">
                      {[1, 2, 3, 4].map((row) => (
                        <div
                          key={row}
                          className="flex items-center gap-3 transition-all duration-500"
                          style={{
                            opacity: featuresInView ? 1 : 0,
                            transform: featuresInView ? 'translateX(0)' : 'translateX(12px)',
                            transitionDelay: featuresInView ? `${row * 80 + 400}ms` : '0ms',
                          }}
                        >
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2.5 rounded-full bg-slate-100" style={{ width: `${60 + row * 8}%` }} />
                            <div className="h-2 rounded-full bg-slate-50" style={{ width: `${40 + row * 5}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Compact cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuresCompact.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                    feature.accent ? 'border-l-4 border-l-amber-400' : ''
                  }`}
                  style={featuresStagger(i + 4)}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      feature.accent ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
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

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="relative flex items-center"
        style={{
          backgroundColor: '#fafaf8',
          minHeight: '100vh',
          scrollSnapAlign: 'start',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #ffffff, transparent)' }}
        />

        <div ref={stepsRef} className="mx-auto max-w-6xl px-6 py-24 sm:py-32 w-full">
          <h2
            className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight text-center mb-16"
            style={stepsStagger(0)}
          >
            Up and running in minutes.
          </h2>

          <div className="relative">
            {/* Dashed connector line — desktop only */}
            <div className="hidden lg:block absolute top-10 left-[16%] right-[16%] h-0">
              <svg width="100%" height="2" className="overflow-visible">
                <line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  strokeOpacity="0.2"
                  style={{
                    strokeDashoffset: stepsInView ? '0' : '200',
                    transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
                  }}
                />
              </svg>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
              {steps.map((step, i) => (
                <div
                  key={step.num}
                  className="text-center"
                  style={stepsStagger(i + 1)}
                >
                  <span
                    className="inline-block font-display text-4xl text-indigo-500 transition-transform duration-500"
                    style={{
                      transform: stepsInView ? 'scale(1)' : 'scale(0.5)',
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transitionDelay: `${i * 150 + 200}ms`,
                    }}
                  >
                    {step.num}
                  </span>
                  <h3 className="mt-3 font-semibold text-lg text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof Strip — integrated below steps */}
          <div ref={proofRef} className="mt-24 pt-12 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-0 sm:gap-y-6">
              {proofItems.map((item, i) => {
                const ItemIcon = item.icon
                return (
                  <div key={item.text} className="flex items-center justify-center sm:justify-start">
                    {i > 0 && <div className="hidden sm:block w-px h-8 bg-slate-200 mx-8" />}
                    <p
                      className="text-sm font-medium text-slate-600 text-center flex items-center gap-2"
                      style={proofStagger(i)}
                    >
                      <ItemIcon className="size-4 text-indigo-400 flex-shrink-0" />
                      {item.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        id="cta"
        className="relative overflow-hidden flex items-center"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #6366f1 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
          minHeight: '100vh',
          scrollSnapAlign: 'start',
        }}
      >
        {/* Radial glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.15), transparent 70%)',
          }}
        />

        {/* Decorative floating shapes */}
        <div
          className="absolute top-[15%] left-[5%] w-40 h-28 rounded-3xl blur-3xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            animation: 'float 7s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[20%] right-[8%] w-32 h-32 rounded-3xl blur-3xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            animation: 'float 9s ease-in-out infinite 2s',
          }}
        />

        <div ref={ctaRef} className="relative mx-auto max-w-3xl px-6 py-20 sm:py-28 text-center w-full">
          <h2
            className="font-display text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight"
            style={ctaStagger(0)}
          >
            Ready to ditch the spreadsheet?
          </h2>
          <p
            className="mt-4 text-base sm:text-lg text-indigo-100 max-w-lg mx-auto"
            style={ctaStagger(1)}
          >
            Join the waitlist — we&apos;ll let you know when it&apos;s your turn.
          </p>

          {/* Inline email form */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
            style={ctaStagger(2)}
          >
            <input
              type="email"
              placeholder="your@email.com"
              className={`w-full sm:flex-1 px-5 py-3.5 rounded-full bg-white/95 text-slate-900 placeholder:text-slate-400 text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-white/50 ${
                emailFocused ? 'shadow-[0_0_0_4px_rgba(255,255,255,0.2)]' : ''
              }`}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-indigo-600 font-semibold text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              Join Waitlist
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-6" style={ctaStagger(3)}>
            <a
              href="#cta"
              className="text-sm text-indigo-200 hover:text-white transition-colors inline-flex items-center gap-1.5 group"
            >
              Or book a personal demo
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="border-t border-slate-200"
        style={{
          backgroundColor: '#fafaf8',
          scrollSnapAlign: 'end',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <span className="font-display text-xl text-indigo-500">Plio</span>
              <p className="mt-2 text-sm text-slate-400">Built in Singapore</p>
              <p className="text-sm text-slate-400">&copy; 2026</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Product</h4>
              <div className="flex flex-col gap-2">
                <a href="#features" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Features</a>
                <a href="#templates" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Templates</a>
                <span className="text-sm text-slate-400">Pricing (soon)</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Legal</h4>
              <div className="flex flex-col gap-2">
                <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Privacy</Link>
                <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
