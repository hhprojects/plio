export interface OnboardingTemplate {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  modules: Record<string, {
    enabled: boolean
    title?: string
    config?: Record<string, unknown>
  }>
}

export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    id: 'tuition-centre',
    name: 'Tuition Centre',
    description: 'For tuition and enrichment centres',
    icon: 'GraduationCap',
    modules: {
      calendar: { enabled: true, title: 'Calendar', config: { recurring_enabled: true, appointments_enabled: false } },
      clients: { enabled: true, title: 'Students' },
      services: { enabled: true, title: 'Courses' },
      rooms: { enabled: true, title: 'Rooms' },
      invoicing: { enabled: true, title: 'Invoicing' },
      booking: { enabled: false },
    },
  },
  {
    id: 'music-school',
    name: 'Music School',
    description: 'For music schools and lesson providers',
    icon: 'Music',
    modules: {
      calendar: { enabled: true, title: 'Calendar', config: { recurring_enabled: true, appointments_enabled: true } },
      clients: { enabled: true, title: 'Students' },
      services: { enabled: true, title: 'Lessons' },
      rooms: { enabled: true, title: 'Rooms' },
      invoicing: { enabled: true, title: 'Invoicing' },
      booking: { enabled: true, title: 'Booking Page' },
    },
  },
  {
    id: 'yoga-studio',
    name: 'Yoga Studio',
    description: 'For yoga studios and fitness centres',
    icon: 'Heart',
    modules: {
      calendar: { enabled: true, title: 'Calendar', config: { recurring_enabled: true, appointments_enabled: true } },
      clients: { enabled: true, title: 'Members' },
      services: { enabled: true, title: 'Classes' },
      rooms: { enabled: false },
      invoicing: { enabled: false },
      booking: { enabled: true, title: 'Booking Page' },
    },
  },
  {
    id: 'wellness-centre',
    name: 'Wellness Centre',
    description: 'For clinics, salons, and spas',
    icon: 'Sparkles',
    modules: {
      calendar: { enabled: true, title: 'Calendar', config: { recurring_enabled: false, appointments_enabled: true } },
      clients: { enabled: true, title: 'Clients' },
      services: { enabled: true, title: 'Treatments' },
      rooms: { enabled: true, title: 'Rooms' },
      invoicing: { enabled: true, title: 'Invoicing' },
      booking: { enabled: true, title: 'Booking Page' },
    },
  },
  {
    id: 'general',
    name: 'General',
    description: 'Start with a standard setup',
    icon: 'Briefcase',
    modules: {
      calendar: { enabled: true, config: { recurring_enabled: true, appointments_enabled: true } },
      clients: { enabled: true },
      services: { enabled: true },
      rooms: { enabled: false },
      invoicing: { enabled: true },
      booking: { enabled: false },
    },
  },
]
