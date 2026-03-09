# Plio — Modular Business Management Platform

## Overview

Plio is a white-label, modular workflow management platform for small service businesses in Singapore. Instead of building separate products for each vertical, Plio provides a configurable module system that businesses tailor to their needs — tuition centres, music schools, yoga studios, wellness clinics, salons, and more.

Businesses pick the modules they need, rename them to match their vocabulary, apply their branding, and get a system that feels purpose-built. The platform handles scheduling, client management, team coordination, invoicing, and public booking out of the box.

## Value Proposition

Small service businesses in Singapore still run on WhatsApp groups and spreadsheets. Plio replaces that with a single platform where owners can:

- **Configure, not code.** Enable modules, rename sidebar labels, set an accent color — no development needed.
- **Start from a template.** Choose a preset (Tuition Centre, Music School, Yoga Studio, Wellness Centre, General) to get sensible defaults, then customize.
- **Scale without switching tools.** One platform covers scheduling, client records, team management, invoicing, and online booking.
- **Own the experience.** White-label branding (logo, color, business name) makes it feel like their own product, not a generic SaaS.

## Module System

Plio replaces the old dual-vertical model (education vs wellness) with a universal module system. Every tenant configures which modules are active and how they appear.

### Modules

| Module       | Default Title | Always On | Description                              |
|-------------|---------------|-----------|------------------------------------------|
| `dashboard` | Dashboard     | Yes       | Overview stats and quick actions         |
| `calendar`  | Calendar      | No        | Visual schedule with day/week/month views|
| `clients`   | Clients       | No        | Contact records and dependents           |
| `services`  | Services      | No        | Recurring classes and bookable services  |
| `team`      | Team          | Yes       | Staff profiles, availability, roles      |
| `rooms`     | Rooms         | No        | Physical spaces and capacity tracking    |
| `invoicing` | Invoicing     | No        | Invoice generation and payment tracking  |
| `booking`   | Booking       | No        | Public booking page for clients          |
| `settings`  | Settings      | Yes       | Tenant config, branding, module management|

### How It Works

- **`modules` table** — System-level registry of all available modules. Seeded at deployment. Contains slug, default title, icon, and default sort order.
- **`tenant_modules` table** — Per-tenant configuration. Each row links a tenant to a module and stores: `enabled` (boolean), `custom_title` (nullable, overrides default), and `sort_order`.
- The sidebar reads `tenant_modules` for the current tenant, renders only enabled modules using `custom_title ?? default_title`, sorted by `sort_order`.
- Role-based filtering ensures clients see a reduced set of modules (e.g., dashboard, booking, invoicing).

### Onboarding Templates

Five presets configure modules with appropriate titles:

| Template          | Example Customizations                                      |
|-------------------|-------------------------------------------------------------|
| Tuition Centre    | Clients -> "Students", Services -> "Courses", Team -> "Tutors" |
| Music School      | Clients -> "Students", Services -> "Lessons", Rooms -> "Studios" |
| Yoga Studio       | Services -> "Classes", Rooms -> "Studios"                   |
| Wellness Centre   | Services -> "Treatments", Team -> "Practitioners", Rooms -> "Treatment Rooms" |
| General           | All defaults, all optional modules enabled                  |

A "Build Your Own" option lets businesses select modules individually and set custom titles from scratch. After choosing any template, the business can further toggle modules, reorder the sidebar, and rename titles.

## Database Schema

### Core Tables

**tenants** — Multi-tenant root. Each business is a tenant.
- `id`, `name`, `slug` (unique, used in booking URLs), `business_type` (informational, from template), `settings` (JSONB: `logo_url`, `accent_color`, `business_name`, feature flags)

**profiles** — User accounts linked to auth. Each profile belongs to one or more tenants.
- `id` (matches auth.users), `tenant_id`, `role`, `full_name`, `email`, `phone`

### Module Tables

**modules** — System registry of available modules (seeded).
- `id`, `slug` (unique), `default_title`, `icon`, `default_sort_order`, `always_on`

**tenant_modules** — Per-tenant module configuration.
- `id`, `tenant_id`, `module_id`, `enabled`, `custom_title`, `sort_order`
- Unique constraint on `(tenant_id, module_id)`

### People

**contacts** — Unified entity replacing students, clients, and parents.
- `id`, `tenant_id`, `full_name`, `email`, `phone`, `address`, `notes`, `tags` (text array)

**contact_dependents** — Children or dependents linked to a contact (e.g., a parent's children).
- `id`, `tenant_id`, `contact_id` (FK), `full_name`, `date_of_birth`, `notes`

**contact_notes** — Timestamped notes on a contact record.
- `id`, `tenant_id`, `contact_id` (FK), `author_id` (FK to profiles), `content`, `created_at`

**team_members** — Staff, tutors, practitioners, instructors.
- `id`, `tenant_id`, `profile_id` (FK, nullable — not all team members need login), `full_name`, `email`, `phone`, `color` (hex, for calendar), `is_active`

**team_availability** — Weekly recurring availability for a team member.
- `id`, `tenant_id`, `team_member_id` (FK), `day_of_week` (0-6), `start_time`, `end_time`

**availability_overrides** — Date-specific overrides (time off, extra hours).
- `id`, `tenant_id`, `team_member_id` (FK), `date`, `is_available`, `start_time`, `end_time`

### Services & Scheduling

**services** — Unified service definitions.
- `id`, `tenant_id`, `name`, `description`, `type` (`recurring` | `bookable`), `duration_minutes`, `capacity`, `color` (hex, for calendar), `price`, `is_active`

**schedules** — Recurring schedule definitions (RRULE-based).
- `id`, `tenant_id`, `service_id` (FK), `team_member_id` (FK), `room_id` (FK, nullable), `rrule`, `start_time`, `end_time`, `effective_from`, `effective_until`

**sessions** — Individual occurrences (generated from schedules or created directly).
- `id`, `tenant_id`, `schedule_id` (FK, nullable), `service_id` (FK), `team_member_id` (FK), `room_id` (FK, nullable), `type` (`class` | `appointment`), `date`, `start_time`, `end_time`, `status` (`scheduled` | `completed` | `cancelled` | `no_show`)

**enrollments** — Links contacts/dependents to sessions or schedules.
- `id`, `tenant_id`, `contact_id` (FK), `dependent_id` (FK, nullable), `schedule_id` (FK, nullable), `session_id` (FK, nullable), `status` (`enrolled` | `waitlisted` | `cancelled`)

### Facilities

**rooms** — Physical spaces.
- `id`, `tenant_id`, `name`, `capacity`, `is_active`

**holidays** — Tenant-level holidays (sessions auto-cancelled on these dates).
- `id`, `tenant_id`, `name`, `date`

### Financial

**invoices** — Generated invoices for contacts.
- `id`, `tenant_id`, `contact_id` (FK), `invoice_number`, `amount`, `gst_amount`, `total`, `status` (`draft` | `sent` | `paid` | `overdue` | `void`), `due_date`, `issued_at`

**payments** — Payment records against invoices.
- `id`, `tenant_id`, `invoice_id` (FK), `amount`, `method` (`paynow` | `cash` | `bank_transfer` | `card`), `reference`, `paid_at`

**credit_ledger** — Credit/debit tracking per contact (class packs, prepaid credits).
- `id`, `tenant_id`, `contact_id` (FK), `amount`, `description`, `created_at`

### Platform

**waitlist** — Pre-launch or per-service waitlist.
- `id`, `tenant_id`, `email`, `name`, `service_id` (FK, nullable), `created_at`

**invitations** — Invite links for staff and clients.
- `id`, `tenant_id`, `email`, `role`, `token`, `expires_at`, `accepted_at`

**audit_log** — Append-only log of significant actions.
- `id`, `tenant_id`, `actor_id` (FK to profiles), `action`, `entity_type`, `entity_id`, `metadata` (JSONB), `created_at`

**notifications** — In-app and email notification records.
- `id`, `tenant_id`, `profile_id` (FK), `title`, `body`, `type`, `read_at`, `created_at`

## Tech Stack

| Layer          | Technology                                      |
|----------------|------------------------------------------------|
| Framework      | Next.js 15.5 (App Router), React 19, TypeScript 5.9 |
| Styling        | Tailwind CSS 4, Shadcn UI (New York style)     |
| Database       | Supabase (PostgreSQL + Row Level Security)     |
| Auth           | Supabase Auth (cookie-based SSR sessions)      |
| State          | Zustand                                         |
| Calendar       | FullCalendar v6                                |
| Email          | React Email + Resend                           |
| Monorepo       | Turborepo + pnpm workspaces                    |
| Testing        | Vitest (unit), Playwright (e2e)                |
| Deployment     | Vercel                                          |

## Monorepo Structure

```
plio/
├── apps/web/                → Next.js application
│   ├── app/
│   │   ├── (dashboard)/     → Protected module pages
│   │   │   ├── dashboard/
│   │   │   ├── calendar/
│   │   │   ├── clients/
│   │   │   ├── services/
│   │   │   ├── team/
│   │   │   ├── rooms/
│   │   │   ├── invoicing/
│   │   │   ├── settings/
│   │   │   └── platform/   → Super admin only
│   │   ├── (public)/        → Public pages (booking, terms, privacy)
│   │   └── onboarding/     → New tenant setup flow
│   ├── components/          → UI components (admin/, ui/, etc.)
│   ├── lib/                 → Auth, Supabase clients, scheduling logic
│   ├── stores/              → Zustand stores
│   └── hooks/               → Custom React hooks
├── packages/db/             → Database types (@plio/db)
├── packages/utils/          → Pure utilities (@plio/utils)
├── packages/ui/             → Shared UI components (@plio/ui)
├── packages/email/          → Email templates (@plio/email)
└── supabase/                → Migrations and config
```

**Import aliases:**
- `@/*` resolves to `apps/web/*` (e.g., `@/components/ui/button`)
- Cross-package imports use `@plio/db`, `@plio/utils`, `@plio/ui`, `@plio/email`

## Multi-Tenancy

Plio uses a shared-database model with tenant isolation enforced at two levels:

1. **Row Level Security (RLS):** Every table includes a `tenant_id` column. PostgreSQL RLS policies ensure queries only return rows matching the authenticated user's tenant. Helper functions (`get_user_tenant_ids()`, `get_user_role(tenant_id)`) power the policies.

2. **Module Configuration Layer:** The `tenant_modules` table adds per-tenant feature toggles. Server-side checks verify a module is enabled before rendering pages or processing actions. Middleware redirects users away from disabled module routes.

**Supabase Clients:**
- `lib/supabase/server.ts` — SSR client with cookie auth (Server Components, Server Actions)
- `lib/supabase/client.ts` — Browser client (client components)
- `lib/supabase/admin.ts` — Service role client, bypasses RLS (public booking, onboarding, invites)

## Authentication & Roles

### Auth Flow

Supabase Auth with email/password. Cookie-based SSR sessions. Middleware (`middleware.ts`) refreshes tokens and protects routes.

### Roles

| Role         | Access                                                      |
|-------------|-------------------------------------------------------------|
| `super_admin` | Platform-level management. Sees all tenants via `/platform`. |
| `admin`      | Full access to their tenant's enabled modules.              |
| `staff`      | Access to assigned modules (calendar, clients, services).   |
| `client`     | Limited view: dashboard, booking, their own invoices.       |

Roles are stored on the `profiles` table per tenant. A single user (auth account) can have different roles across tenants.

### Server Actions Pattern

```
getTenantId() → Zod validation → Supabase query (RLS-scoped) → revalidatePath
```

`getTenantId()` uses React `cache()` to run once per request. Returns `{ tenantId, profileId, role }`.

## Onboarding

New tenant setup is a multi-step flow at `/onboarding`:

1. **Business Info** — Name, slug (auto-generated, editable), contact email
2. **Template Selection** — Pick a preset or "Build Your Own"
3. **Module Configuration** — Toggle modules, rename titles, reorder sidebar
4. **Branding** — Upload logo, pick accent color
5. **Invite Team** — Send email invitations to staff (optional, skippable)

On completion, the system creates the tenant record, seeds `tenant_modules` from the selected template, and redirects to the dashboard.

## Calendar

The calendar is powered by FullCalendar v6 and supports two sub-modes, toggled independently in module configuration:

- **Recurring Classes** — Generated from `schedules` (RRULE-based). Displayed as repeating events. Attendance tracked per session.
- **Appointments** — One-off bookable sessions. Created directly or via the public booking page.

### Color Coding

Admins choose between two color modes:
- **By Service** — Each service has a `color` field (hex). All sessions for that service share the color.
- **By Team Member** — Each team member has a `color` field. Sessions colored by who is assigned.

Colors are set via a free color picker on the service and team member forms.

### Views

Day, week, and month views. Clicking an event opens a detail panel. Drag-and-drop rescheduling for appointments. Zustand store (`calendar-store.ts`) manages view state, filters, and selected date range.

## Public Booking

Any tenant with the booking module enabled gets a public page at `/book/[slug]`.

**Flow:**
1. **Service Picker** — Lists active bookable services with name, duration, and price.
2. **Slot Picker** — Shows available time slots based on team availability, existing sessions, and room capacity. Factors in `team_availability`, `availability_overrides`, and `holidays`.
3. **Client Form** — Name, email, phone. Existing contacts are matched by email; new contacts are created automatically.
4. **Confirmation** — Session created, confirmation displayed. Email sent via Resend.

The booking page uses the admin Supabase client (service role) since visitors are unauthenticated. Tenant branding (logo, accent color, business name) is applied to the booking page.

## Progressive Web App

Plio ships as a PWA for mobile access:

- **Dynamic Manifest** — Generated per tenant from branding settings (`business_name`, `accent_color`, `logo_url`). Served at `/api/manifest`.
- **Service Worker** — Caches static assets and app shell for offline access. Network-first strategy for API calls.
- **Install Prompt** — Shown to clients on mobile after second visit.

## Design Tokens

| Token           | Value                |
|-----------------|----------------------|
| Primary color   | Indigo `#6366f1`     |
| Sidebar bg      | Slate 900 `#0f172a`  |
| Accent (default)| Tenant-configurable  |
| Border radius   | `0.5rem`             |
| Font            | System font stack    |

Tenant accent color overrides the primary color in client-facing views (booking page, client portal). Admin views use the standard indigo palette.

## Portfolio Note

Plio is a portfolio project demonstrating full-stack product development: multi-tenant architecture, modular feature systems, RBAC, real-time scheduling, and white-label branding. It is not a commercial product. The codebase prioritizes clean architecture and real-world patterns over shipping speed.
