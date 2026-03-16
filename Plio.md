# Plio — Modular Business Management Platform

A white-label, modular workflow management platform for small service businesses in Singapore. Instead of building separate products for each vertical, Plio provides a configurable module system that businesses tailor to their needs — tuition centres, music schools, yoga studios, wellness clinics, salons, and more.

One deployment serves many businesses — each with its own isolated data, branding, and configuration.

---

## Value Proposition

Small service businesses in Singapore still run on WhatsApp groups and spreadsheets. Plio replaces that with a single platform where owners can:

- **Configure, not code.** Enable modules, rename sidebar labels, set an accent color — no development needed.
- **Start from a template.** Choose a preset (Tuition Centre, Music School, Yoga Studio, Wellness Centre, General) to get sensible defaults, then customize.
- **Scale without switching tools.** One platform covers scheduling, client records, team management, invoicing, and online booking.
- **Own the experience.** White-label branding (logo, color, business name) makes it feel like their own product, not a generic SaaS.

**For portfolio reviewers:** This project demonstrates multi-tenant database design, a modular feature system, complex scheduling logic (recurring events, conflict detection, makeup credits), role-based access control via Row-Level Security, and a payment verification workflow — all in a production-grade Next.js + Supabase stack.

---

## Multi-Tenant SaaS Model

Plio follows a **shared-database, shared-schema** multi-tenancy strategy:

- Every data table carries a `tenant_id` column
- Supabase Row-Level Security (RLS) policies enforce tenant isolation at the database level — no application code can accidentally leak data across tenants
- Each tenant gets a unique slug (e.g., `bright-learning`) used in booking URLs and configuration
- Tenant-level settings (timezone, currency, cancellation policy hours, GST registration) are stored as JSONB, avoiding schema changes per tenant
- A single Vercel deployment serves all tenants; tenant resolution happens via the authenticated user's profile

---

## Module System

Plio replaces the old dual-vertical model (education vs wellness) with a universal module system. Every tenant configures which modules are active and how they appear.

### Modules

| Module       | Default Title | Always On | Dependencies | Description                              |
|-------------|---------------|-----------|--------------|------------------------------------------|
| `dashboard` | Dashboard     | Yes       | —            | Overview stats and quick actions         |
| `calendar`  | Calendar      | No        | services     | Visual schedule with day/week/month views|
| `clients`   | Clients       | No        | —            | Contact records and dependents           |
| `services`  | Services      | No        | —            | Recurring classes and bookable services  |
| `team`      | Team          | Yes       | —            | Staff profiles, availability, roles      |
| `rooms`     | Rooms         | No        | —            | Physical spaces and capacity tracking    |
| `invoicing` | Invoicing     | No        | clients      | Invoice generation and payment tracking  |
| `booking`   | Booking       | No        | services, calendar | Public booking page for clients    |
| `settings`  | Settings      | Yes       | —            | Tenant config, branding, module management|

### How It Works

- **`modules` table** — System-level registry of all 9 modules. Seeded at deployment. Contains slug, default title, icon, always_on flag, and dependencies.
- **`tenant_modules` table** — Per-tenant configuration. Each row links a tenant to a module and stores: `enabled` (boolean), `custom_title` (nullable, overrides default), `sort_order`, and `config` (JSONB for module-specific settings like calendar mode).
- The sidebar reads `tenant_modules` for the current tenant, renders only enabled modules using `custom_title ?? default_title`, sorted by `sort_order`.
- Role-based filtering ensures clients see a reduced set of modules (dashboard, calendar, invoicing) and staff see a subset (dashboard, calendar, clients, team).
- `requireModule(slug)` server-side guard returns 404 if a module is not enabled for the tenant.

### Onboarding Templates

Five presets configure modules with appropriate titles during the onboarding wizard:

| Template          | Pre-Enabled Modules | Example Customizations                                      |
|-------------------|---------------------|-------------------------------------------------------------|
| Tuition Centre    | calendar (recurring), clients, services, rooms, invoicing | Clients → "Students", Services → "Courses" |
| Music School      | calendar (both), clients, services, rooms, invoicing, booking | Clients → "Students", Services → "Lessons" |
| Yoga Studio       | calendar (both), clients, services, invoicing, booking | Clients → "Members", Services → "Classes" |
| Wellness Centre   | calendar (appointments), clients, services, rooms, invoicing, booking | Services → "Treatments" |
| General           | calendar (both), clients, services, invoicing | All defaults |

A "Build Your Own" option lets businesses select modules individually and set custom titles from scratch. After choosing any template, the business can further toggle modules, reorder the sidebar, and rename titles.

---

## Tech Stack & Justifications

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router)**, React 19, TypeScript 5 | Server Components, Server Actions, streaming, file-based routing |
| Styling | **Tailwind CSS 4** | Utility-first, consistent design tokens, zero runtime |
| Components | **Shadcn UI** (New York style) | Accessible, composable, owns the source code |
| Backend / DB | **Supabase (PostgreSQL)** | Auth, RLS, Realtime subscriptions, Storage — one platform |
| State | **Zustand 5** | Minimal boilerplate; works with Server Components |
| Calendar | **FullCalendar 6** | Mature, drag-and-drop, resource timeline views, recurring event support |
| Email | **React Email + Resend** | Type-safe email templates, reliable delivery |
| Forms | **React Hook Form + Zod 4** | Declarative validation with type-safe schemas |
| Monorepo | **Turborepo + pnpm** | Shared packages, parallel builds |
| Testing | **Vitest** | Fast unit tests for business logic |
| Deployment | **Vercel** | Zero-config Next.js hosting |
| Icons | **Lucide React** | Consistent icon set |
| Toasts | **Sonner** | Lightweight toast notifications |

### Monorepo Structure

```
plio/
├── apps/web/                    → Next.js application
│   ├── app/
│   │   ├── (auth)/              → Login, signup, forgot password
│   │   ├── (dashboard)/         → Protected, single layout for all roles
│   │   │   ├── dashboard/       → Overview stats
│   │   │   ├── calendar/        → FullCalendar views
│   │   │   ├── clients/         → Contact management
│   │   │   ├── services/        → Service definitions
│   │   │   ├── team/            → Staff management
│   │   │   ├── rooms/           → Room management
│   │   │   ├── invoicing/       → Invoice & payment tracking
│   │   │   ├── booking/         → Booking management
│   │   │   ├── settings/        → Branding & module config
│   │   │   ├── platform/        → Super admin only (waitlist, tenants)
│   │   │   ├── parent/          → Parent portal views
│   │   │   └── tutor/           → Tutor portal views
│   │   ├── (public)/            → Public pages (booking, privacy, terms)
│   │   └── onboarding/          → Multi-step wizard for new tenants
│   ├── components/              → UI + feature components
│   ├── lib/                     → Auth, Supabase clients, scheduling logic
│   ├── stores/                  → Zustand stores
│   └── hooks/                   → Custom React hooks
├── packages/db/                 → Database types (@plio/db)
├── packages/utils/              → Pure utilities (@plio/utils)
├── packages/ui/                 → Shared UI components (@plio/ui)
├── packages/email/              → Email templates (@plio/email)
├── supabase/                    → Migrations (27 files) and config
└── turbo.json
```

**Import aliases:**
- `@/*` resolves to `apps/web/*` (e.g., `@/components/ui/button`)
- Cross-package imports use `@plio/db`, `@plio/utils`, `@plio/ui`, `@plio/email`

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js App (SSR + RSC)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │  │
│  │  │  Server   │  │  Server  │  │  Middleware    │   │  │
│  │  │Components │  │ Actions  │  │  (Auth guard) │   │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬────────┘   │  │
│  └───────┼──────────────┼───────────────┼────────────┘  │
└──────────┼──────────────┼───────────────┼───────────────┘
           │              │               │
           ▼              ▼               ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase                           │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  │
│  │   Auth   │  │ Postgres │  │Realtime│  │ Storage  │  │
│  │  (JWT)   │  │  + RLS   │  │  (WS)  │  │ (S3)    │  │
│  └──────────┘  └──────────┘  └────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────┘
                                             │
                                             ▼
                                      ┌──────────┐
                                      │  Resend  │
                                      │ (Email)  │
                                      └──────────┘
```

### Auth Flow

1. User signs up or logs in via Supabase Auth (email/password)
2. Middleware (`middleware.ts`) refreshes auth tokens on every request
3. Protected routes redirect unauthenticated users to `/login`
4. `getTenantId()` (React `cache()`) extracts `tenantId`, `profileId`, and `role` from the authenticated user's profile — runs once per request
5. RLS policies extract `auth.uid()` and match against `profiles.user_id` and `profiles.tenant_id`
6. Client-side route guards redirect users to their role-appropriate views

### API Layer

- **Server Actions** for all mutations (create service, enroll student, generate invoice)
- **Server Components** for data fetching (calendar view, client list, dashboard stats)
- No dedicated API routes — all server logic is in Next.js Server Actions
- Supabase client is instantiated server-side with the user's JWT for RLS enforcement

### Server Actions Pattern

```
getTenantId() → Zod validation → Supabase query (RLS-scoped) → revalidatePath
```

### Supabase Clients

- `lib/supabase/server.ts` — `createClient()`: SSR client with cookie auth. Used in Server Components and Actions for authenticated users.
- `lib/supabase/client.ts` — `createBrowserClient()`: For "use client" components.
- `lib/supabase/admin.ts` — `createAdminClient()`: Service role key, bypasses RLS. Server-only. Used for public/unauthenticated operations (booking page, waitlist, invites, platform admin).

---

## Database Schema

### Entity-Relationship Overview

```
tenants ─┬─< profiles ──< notifications
         │       │
         ├─< modules (system)
         │
         ├─< tenant_modules (per-tenant config)
         │
         ├─< contacts ──< contact_dependents
         │       │   └──< contact_notes
         │       ├──< enrollments >── sessions
         │       └──< credit_ledger
         │
         ├─< team_members ──< team_availability
         │       │       └──< availability_overrides
         │       └──< schedules ──< sessions
         │
         ├─< services ──< schedules
         │
         ├─< rooms
         ├─< holidays
         ├─< invoices ──< payments
         ├─< waitlist
         ├─< invitations
         └─< audit_log
```

### Tables

#### `tenants`

The root entity. Every other table references a tenant.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `name` | `text` | e.g., "Bright Learning Hub" |
| `slug` | `text` UNIQUE | URL-safe identifier, e.g., `bright-learning` |
| `settings` | `jsonb` | `{ timezone, currency, cancellation_hours, gst_registered, gst_rate, logo_url, accent_color, business_name }` |
| `subscription_tier` | `text` | `free`, `starter`, `pro` |
| `active` | `boolean` | Default `true` — super admin can disable tenants |
| `created_at` | `timestamptz` | Default `now()` |

#### `profiles`

Every authenticated user has one profile per tenant. Linked to Supabase Auth via `user_id`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `user_id` | `uuid` FK → auth.users | Supabase Auth reference |
| `role` | `text` | `super_admin`, `admin`, `staff`, `client` |
| `full_name` | `text` | |
| `email` | `text` | |
| `phone` | `text` | Nullable, E.164 format |
| `avatar_url` | `text` | Nullable |
| `nric_masked` | `text` | Nullable, e.g., `T****567A` — stored masked, never in full |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, user_id)` UNIQUE — one profile per user per tenant.

#### `modules`

System-level registry of available modules. Seeded via migration.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text` UNIQUE | e.g., `calendar`, `clients` |
| `default_title` | `text` | e.g., "Calendar" |
| `icon` | `text` | Lucide icon name, e.g., `CalendarDays` |
| `always_on` | `boolean` | `true` for dashboard, team, settings |
| `dependencies` | `text[]` | Module slugs this depends on |
| `created_at` | `timestamptz` | |

#### `tenant_modules`

Per-tenant module configuration.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `module_id` | `uuid` FK → modules | |
| `enabled` | `boolean` | |
| `custom_title` | `text` | Nullable — overrides `default_title` |
| `sort_order` | `integer` | Sidebar ordering |
| `config` | `jsonb` | Module-specific settings (e.g., `{ recurring_enabled, appointments_enabled }` for calendar) |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Unique constraint:** `(tenant_id, module_id)`.

#### `contacts`

Unified entity for clients, students, parents — anyone the business serves.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `name` | `text` | |
| `email` | `text` | Nullable |
| `phone` | `text` | Nullable |
| `notes` | `text` | Nullable |
| `tags` | `text[]` | e.g., `["parent", "vip"]` |
| `created_by` | `uuid` FK → profiles | Nullable |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `contact_dependents`

Children or dependents linked to a contact (e.g., a parent's children).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `contact_id` | `uuid` FK → contacts | |
| `name` | `text` | |
| `date_of_birth` | `date` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `contact_notes`

Timestamped notes on a contact record.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `contact_id` | `uuid` FK → contacts | |
| `team_member_id` | `uuid` FK → team_members | Nullable — author |
| `session_id` | `uuid` FK → sessions | Nullable — links to a session |
| `content` | `text` | |
| `created_at` | `timestamptz` | |

#### `team_members`

Staff, tutors, practitioners, instructors — anyone who delivers services.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `profile_id` | `uuid` FK → profiles | Nullable — not all team members need login |
| `name` | `text` | |
| `email` | `text` | Nullable |
| `phone` | `text` | Nullable |
| `role_title` | `text` | Nullable, e.g., "Senior Tutor" |
| `color` | `text` | Nullable, hex color for calendar display |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `team_availability`

Weekly recurring availability for a team member.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `team_member_id` | `uuid` FK → team_members | |
| `day_of_week` | `smallint` | 0 = Sunday, 6 = Saturday |
| `start_time` | `time` | |
| `end_time` | `time` | |

#### `availability_overrides`

Date-specific overrides (time off, extra hours).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `team_member_id` | `uuid` FK → team_members | |
| `date` | `date` | |
| `is_available` | `boolean` | `false` = blocked off |
| `start_time` | `time` | Nullable |
| `end_time` | `time` | Nullable |
| `reason` | `text` | Nullable, e.g., "Medical appointment" |
| `created_at` | `timestamptz` | |

#### `services`

Unified service definitions — classes, appointments, treatments, lessons.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `name` | `text` | e.g., "Sec 3 Math", "Swedish Massage" |
| `description` | `text` | Nullable |
| `type` | `text` | `recurring` or `bookable` |
| `duration_minutes` | `integer` | Nullable |
| `capacity` | `integer` | Nullable — max students/clients per session |
| `price` | `numeric` | Nullable, in SGD |
| `currency` | `text` | Default `SGD` |
| `buffer_minutes` | `integer` | Default `0` — gap between appointments |
| `color` | `text` | Nullable, hex color for calendar |
| `active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `schedules`

Recurring schedule definitions (RRULE-based). Does not store individual occurrences — those are materialized into `sessions`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `service_id` | `uuid` FK → services | |
| `team_member_id` | `uuid` FK → team_members | |
| `room_id` | `uuid` FK → rooms | Nullable |
| `day_of_week` | `smallint` | 0 = Sunday, 6 = Saturday |
| `start_time` | `time` | |
| `end_time` | `time` | |
| `rrule` | `text` | Nullable, RRULE string, e.g., `FREQ=WEEKLY;COUNT=12` |
| `effective_from` | `date` | Start of recurrence window |
| `effective_until` | `date` | Nullable — end of recurrence window |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `sessions`

Individual occurrences (generated from schedules or created directly).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `service_id` | `uuid` FK → services | |
| `schedule_id` | `uuid` FK → schedules | Nullable (null for ad-hoc sessions) |
| `team_member_id` | `uuid` FK → team_members | |
| `room_id` | `uuid` FK → rooms | Nullable |
| `date` | `date` | |
| `start_time` | `time` | |
| `end_time` | `time` | |
| `status` | `text` | `scheduled`, `cancelled`, `completed`, `no_show` |
| `type` | `text` | `class` or `appointment` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:**
- `(tenant_id, date)` — calendar queries
- `(tenant_id, team_member_id, date)` — team member schedule
- `(tenant_id, room_id, date, start_time, end_time)` — conflict detection

#### `enrollments`

Links contacts/dependents to sessions. Tracks attendance status.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `session_id` | `uuid` FK → sessions | |
| `contact_id` | `uuid` FK → contacts | |
| `dependent_id` | `uuid` FK → contact_dependents | Nullable |
| `status` | `text` | `confirmed`, `attended`, `no_show`, `cancelled`, `makeup` |
| `checked_in_at` | `timestamptz` | Nullable, set by QR scan or manual check-in |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Index:** `(session_id, contact_id)` UNIQUE — no duplicate enrollments.

#### `credit_ledger`

Append-only ledger tracking credit movements. Balance = `SUM(amount)` for a contact.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `contact_id` | `uuid` FK → contacts | |
| `amount` | `integer` | Positive = credit added, negative = credit consumed |
| `reason` | `text` | `purchase`, `cancellation_refund`, `makeup_booking`, `admin_adjustment`, `expiry` |
| `session_id` | `uuid` FK → sessions | Nullable |
| `invoice_id` | `uuid` FK → invoices | Nullable |
| `created_by` | `uuid` FK → profiles | Who performed the action |
| `created_at` | `timestamptz` | |

#### `rooms`

Physical rooms or spaces within a tenant's location.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `name` | `text` | e.g., "Room A", "Studio 1" |
| `capacity` | `integer` | |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | |

#### `holidays`

Tenant-specific and national holidays. Used to exclude dates when generating sessions from schedules.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `date` | `date` | |
| `name` | `text` | e.g., "Chinese New Year Day 1" |
| `is_national` | `boolean` | `true` for SG public holidays, `false` for tenant-specific closures |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, date)` UNIQUE.

#### `invoices`

Monthly or on-demand invoices sent to contacts.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `invoice_number` | `text` | Sequential per tenant, e.g., `INV-2026-0042` |
| `contact_id` | `uuid` FK → contacts | |
| `line_items` | `jsonb` | `[{ description, student_name, quantity, unit_price, amount }]` |
| `subtotal` | `numeric(10,2)` | |
| `gst_rate` | `numeric(4,2)` | e.g., `9.00` for 9% GST |
| `gst_amount` | `numeric(10,2)` | |
| `total` | `numeric(10,2)` | |
| `status` | `text` | `draft`, `sent`, `paid`, `overdue`, `void` |
| `due_date` | `date` | Nullable |
| `paid_at` | `timestamptz` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, contact_id, status)`.

#### `payments`

Individual payment records against an invoice.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `invoice_id` | `uuid` FK → invoices | |
| `tenant_id` | `uuid` FK → tenants | |
| `method` | `text` | `paynow`, `stripe`, `cash`, `bank_transfer` |
| `amount` | `numeric(10,2)` | |
| `status` | `text` | `pending_verification`, `verified`, `rejected` |
| `receipt_url` | `text` | Nullable — Supabase Storage path for uploaded receipt |
| `stripe_payment_id` | `text` | Nullable — Stripe reference for automated payments |
| `verified_by` | `uuid` FK → profiles | Nullable — admin who approved |
| `verified_at` | `timestamptz` | Nullable |
| `rejection_reason` | `text` | Nullable |
| `created_at` | `timestamptz` | |

#### `notifications`

In-app notification feed per user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `user_id` | `uuid` FK → profiles | Recipient |
| `type` | `text` | e.g., `class_cancelled`, `payment_received`, `invoice_sent`, `makeup_booked` |
| `title` | `text` | Short heading |
| `body` | `text` | Detail message |
| `metadata` | `jsonb` | `{ session_id, invoice_id, ... }` — for deep linking |
| `read_at` | `timestamptz` | Nullable — null means unread |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, user_id, read_at)` — efficiently query unread notifications.

#### `audit_log`

Immutable log of all significant actions.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `actor_id` | `uuid` FK → profiles | Who performed the action |
| `action` | `text` | `create`, `update`, `delete`, `cancel`, `verify`, `login` |
| `entity_type` | `text` | `session`, `enrollment`, `invoice`, `payment`, etc. |
| `entity_id` | `uuid` | ID of the affected record |
| `changes` | `jsonb` | `{ field: { old: ..., new: ... } }` |
| `ip_address` | `inet` | Nullable |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, entity_type, entity_id)` — look up history for a specific record.

#### `waitlist`

Pre-launch registration for prospective businesses.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `business_name` | `text` | |
| `contact_email` | `text` | |
| `contact_phone` | `text` | |
| `business_type` | `text` | `tuition`, `yoga`, `music`, `enrichment`, `other` |
| `message` | `text` | Nullable |
| `status` | `text` | `pending`, `approved`, `rejected` |
| `reviewed_by` | `uuid` FK → profiles | Nullable |
| `reviewed_at` | `timestamptz` | Nullable |
| `tenant_id` | `uuid` FK → tenants | Nullable — set when approved and tenant is created |
| `created_at` | `timestamptz` | |

#### `invitations`

Invite links for staff and clients to join a tenant.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `email` | `text` | |
| `full_name` | `text` | |
| `role` | `text` | `admin`, `staff`, or `client` |
| `invited_by` | `uuid` FK → profiles | |
| `token` | `text` | UUID v4 (cryptographically random) |
| `status` | `text` | `pending`, `accepted`, `expired` |
| `expires_at` | `timestamptz` | |
| `accepted_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | |

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|---|---|
| `super_admin` | Platform operator. Manages tenants, approves waitlist, views all data. |
| `admin` | Tenant owner/manager. Full access to their tenant's enabled modules. |
| `staff` | Instructor/practitioner. Views their own schedule, marks attendance, sees enrolled clients. |
| `client` | End customer. Views their upcoming sessions, attendance history, and invoices. |

### Permission Matrix

| Resource | super_admin | admin | staff | client |
|---|---|---|---|---|
| Platform (waitlist, tenants) | Full access | — | — | — |
| All enabled modules | Full access | Full access | — | — |
| Dashboard | Yes | Yes | Own stats | Own stats |
| Calendar | Yes | Yes | Own sessions | Enrolled sessions |
| Clients | Yes | Yes | Read | — |
| Services | Yes | Yes | Read | — |
| Team | Yes | Yes | Limited | — |
| Rooms | Yes | Yes | Read | — |
| Invoicing | Yes | Yes | — | View own |
| Settings | Yes | Yes | — | — |

### Module Visibility by Role

| Role | Sidebar Modules |
|---|---|
| `super_admin` | Platform navigation (Dashboard, Tenants, Waitlist, Settings) |
| `admin` | All enabled tenant modules |
| `staff` | Dashboard, Calendar, Clients, Team |
| `client` | Dashboard, Calendar, Invoicing |

### RLS Policy Structure

Every table has tenant isolation enforced at the database level via two helper functions:

```sql
-- Returns all tenant IDs the current user belongs to
get_user_tenant_ids() → uuid[]

-- Returns the user's role within a specific tenant
get_user_role(tenant_id uuid) → text
```

**RLS categories (48+ policies across 12 tables):**
- **Tenant isolation** — applied to every table via `tenant_id IN (get_user_tenant_ids())`
- **Role-based access** — different SELECT/INSERT/UPDATE/DELETE policies per role
- **Anonymous access** — `anon` policies on services, team_members, team_availability, availability_overrides, and sessions for the public booking page

---

## Feature Specification

### Implemented Features

#### Master Calendar

- **Views:** Day, week, month — switchable via tabs
- **Display:** Sessions color-coded by service or team member (toggle in calendar store)
- **Drag-and-drop:** Admin drags a session to a new time slot. System checks for tutor/room conflicts before confirming. Reverts on conflict.
- **Click to open:** Clicking a session opens a detail panel showing enrolled contacts, attendance status, and quick actions
- **Holiday overlay:** Public holidays and tenant closures are grayed out
- **Enrollment form:** Inline form to add/remove enrollments with bulk check-in
- **Conflict detection:** Queries sessions for tutor and room overlap before allowing reschedule or creation

#### Client Management

- Searchable, filterable list of all contacts in the tenant
- Each contact shows: name, email, phone, tags, dependents
- Dependent management: add/edit children or sub-contacts
- Contact notes: timestamped notes linked to team members and sessions
- Tags for categorization (e.g., "parent", "vip")

#### Service Management

- Unified service list with type column (`recurring` or `bookable`)
- Service form: name, description, type, duration, capacity, price, color, buffer minutes
- Color picker for calendar display

#### Team Management

- Team member list with role titles and colors
- Availability grid: weekly recurring time slots per team member
- Availability overrides: date-specific blocks with reasons
- Invite workflow: send email invitations for new staff/admins

#### Room Management

- Room list with capacity
- Used in schedule/session assignment for conflict detection

#### Recurring Schedule Engine

- Admin defines: service + day of week + time + team member + room + RRULE
- System parses the RRULE and generates `sessions` in bulk
- Holiday exclusion: cross-references the `holidays` table and skips those dates
- Generated sessions can be individually edited or cancelled without affecting the schedule
- RRULE parsing utilities in `@plio/utils`

#### Public Booking

Any tenant with the booking module enabled gets a public page at `/book/[slug]`.

1. **Service Picker** — Lists active bookable services with name, duration, and price
2. **Team Member Selection** — Choose a specific team member or "Any Available"
3. **Date & Slot Picker** — Shows available time slots based on team availability, existing sessions, and room capacity. Factors in `team_availability`, `availability_overrides`, `holidays`, and `buffer_minutes`
4. **Contact Form** — Name, phone, email. Existing contacts matched by phone; new contacts created automatically
5. **Confirmation** — Session created, confirmation displayed

The booking page uses the admin Supabase client (service role) since visitors are unauthenticated. Tenant branding (logo, accent color, business name) is applied to the booking page.

#### Invoicing

- Invoice list with status badges (draft, sent, paid, overdue, void)
- Create invoice: select contact, add line items (description, student name, quantity, unit price)
- GST auto-calculated if tenant is GST-registered
- Invoice number auto-incremented per tenant: `INV-2026-0042`
- Record payments manually (PayNow, cash, bank transfer)
- Payment status: pending_verification → verified / rejected

#### Parent Portal

Mobile-oriented portal for parents/clients:

- **Dashboard:** Next class card, credit balance per child, upcoming sessions
- **Schedule:** View enrolled sessions with attendance history
- **Attendance:** Per-child timeline showing attended, no-show, cancelled, makeup status with rates
- **Makeup Booking:** Browse available slots, book with credit deduction
- **Fees:** View invoices with payment status
- **QR Check-in:** Generate signed tokens for scan-based attendance

#### Tutor Portal

- **Schedule:** View assigned sessions for the day/week
- **Attendance:** Mark individual students as attended or no_show
- **QR Scanner:** Manual token entry for check-in (camera scanning planned)

#### Settings

- **Branding tab:** Business name, accent color picker, logo URL
- **Modules tab:** Toggle modules on/off, rename titles inline, drag-and-drop reorder, calendar-specific config (recurring/appointment mode toggles)

#### Platform Admin (Super Admin)

- **Dashboard:** Platform-wide KPIs (total tenants, total users, pending waitlist)
- **Tenants page:** List all tenants with user counts, toggle active status, view tenant details via slide-over panel
- **Waitlist page:** Review applications, approve (auto-provisions tenant + sends invite email) or reject with confirmation dialogs
- **Platform Settings:** System module management

#### Onboarding Wizard

Multi-step flow at `/onboarding` for newly approved businesses:

1. **Choose Path** — Template-based or custom setup
2. **Template Picker** — Select from 5 industry presets
3. **Module Customizer** — Toggle modules, rename titles, reorder sidebar
4. **Branding** — Upload logo, set business name, choose accent color
5. **Done** — Redirect to `/dashboard`

#### Registration & Waitlist

- Public registration at `/register` — business submits name, email, phone, type, message
- Creates a `waitlist` entry (status: pending)
- Super admin reviews and approves → system creates tenant, seeds modules, creates admin profile, sends invite email

#### Invitation Flow

- Admin sends invite from `/team` → creates `invitation` row with signed token
- User receives email with link to `/invite/[token]`
- Token validated (expiry, already-used), user sets password
- Supabase Auth user created, profile linked to tenant, invitation marked accepted

### Planned Features (Not Yet Implemented)

- **Real-time notifications** — Bell icon, Supabase Realtime subscriptions, notification feed (table exists, no UI)
- **Audit logging** — Write to audit_log on CRUD operations (table exists, not instrumented)
- **Payment gateway** — Stripe/PayNow integration (manual recording works today)
- **Service worker / PWA** — Offline caching, install prompt (manifest exists, no service worker)
- **Logo file upload** — Supabase Storage integration (currently URL paste)
- **Booking confirmation email** — Email sent after public booking
- **Analytics & reporting** — Occupancy, revenue, retention dashboards
- **Multi-location support** — Multiple branches per tenant
- **AI schedule optimization** — Smart scheduling suggestions
- **Mobile app** — React Native / Expo

---

## State Management

### Zustand Stores

```typescript
// stores/calendar-store.ts — Calendar UI state
interface CalendarStore {
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  currentDate: Date;
  selectedSessionId: string | null;
  colorBy: 'service' | 'team_member';
  filters: { teamMemberId?: string; serviceId?: string; roomId?: string };
  isDetailPanelOpen: boolean;
  selectedInstance: Record<string, unknown> | null;
}

// stores/module-store.ts — Module configuration
interface ModuleStore {
  modules: TenantModuleWithModule[];
  isModuleEnabled: (slug: string) => boolean;
  getModuleTitle: (slug: string) => string;
}

// stores/tenant-store.ts — Tenant settings
interface TenantStore {
  tenantId: string | null;
  settings: TenantSettings; // logo_url, accent_color, business_name
}

// stores/notification-store.ts — Notification state (stub)
interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

// stores/parent-store.ts — Parent portal state
interface ParentStore {
  selectedStudentId: string | null;
  students: Array<{ id: string; fullName: string }>;
}
```

---

## UI/UX Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#6366f1` | Buttons, active states (Indigo 500) |
| `--foreground` | `#0f172a` | Primary text (Slate 900) |
| `--secondary` | `#f1f5f9` | Secondary backgrounds (Slate 100) |
| `--destructive` | `#ef4444` | Delete, cancel, error (Red 500) |
| `--success` | `#22c55e` | Paid, confirmed (Green 500) |
| `--warning` | `#f59e0b` | Pending, overdue (Amber 500) |
| `--sidebar` | `#0f172a` | Sidebar background (Slate 900) |
| `--sidebar-foreground` | `#e2e8f0` | Sidebar text (Slate 200) |

Tenant accent color overrides the primary color in client-facing views (booking page, client portal). Admin views use the standard indigo palette.

### Component Library

Built on Shadcn UI (New York style). 24+ components including:

- **DataTable** — sortable, filterable tables for contact lists, invoices, payments
- **Calendar** — FullCalendar wrapped in a Shadcn-styled container
- **Sheet** — slide-over panels for session details, contact profiles, tenant editing
- **Dialog** — confirmation modals (cancel session, verify payment, approve waitlist)
- **Command** — combobox-based selection (contacts, team members)
- **Toast** — success/error notifications via Sonner
- **Badge** — status indicators (paid, pending, overdue, cancelled)
- **Form** — React Hook Form + Zod integration
- **Tabs** — view switching in settings, calendar views

### Responsive Strategy

| Viewport | Target User | Layout |
|---|---|---|
| Desktop (1024px+) | Admin, Staff | Sidebar navigation, multi-column layouts, full calendar |
| Tablet (768px–1023px) | Admin (on the go) | Collapsible sidebar, stacked layouts |
| Mobile (< 768px) | Client/Parent | Card-based UI, simplified views |

---

## Security & Compliance

### PDPA Compliance (Singapore Personal Data Protection Act)

- **Data minimization:** Only collect data necessary for service delivery
- **NRIC masking:** NRICs stored as masked values (`T****567A`), never in full
- **Unsubscribe:** Every email should include an unsubscribe link

### Row-Level Security

- RLS is enabled on every table with data
- Every query goes through Supabase client with the user's JWT — the database enforces access, not the application code
- Defense in depth: even if application logic has a bug, RLS prevents data leaks
- 48+ RLS policies across 12 tables, plus base policies for core tables

### Input Validation

- All user inputs validated with Zod schemas before reaching the database
- Server Actions validate inputs server-side regardless of client-side validation

### Auth Security

- Supabase Auth has built-in rate limiting for login attempts
- Invite tokens are UUID v4 (cryptographically random) with expiry
- Service role key is server-only (`lib/supabase/admin.ts`) — never exposed to client
- Middleware refreshes auth tokens on every request

---

## Testing

### Unit Tests (Vitest)

74 tests in `packages/utils/` covering pure business logic:

- **Scheduling logic:** RRULE parsing, holiday exclusion, instance generation
- **Credit calculations:** balance computation, refund eligibility
- **Conflict detection:** time overlap algorithm
- **GST calculation:** subtotal → GST amount → total
- **Date helpers:** Singapore timezone handling

### Manual Testing Playbook

Documented in `docs/testing-playbook.md` with:

- 5 test accounts across 2 tenants (Bright Learning Hub, Zen Yoga Studio)
- 10 test scenarios covering all roles and access patterns
- Route access matrix for all role × route combinations
- Seed data with realistic Singapore data (students, courses, invoices, enrollments)

---

## Constants

```typescript
SG_TIMEZONE = 'Asia/Singapore'
DEFAULT_ACCENT_COLOR = '#6366f1'
DEFAULT_GST_RATE = 9          // percent
DEFAULT_CURRENCY = 'SGD'
DEFAULT_CANCELLATION_HOURS = 24
DEFAULT_REMINDER_HOURS_BEFORE = 24
DEFAULT_CLASS_DURATION_MINUTES = 60
DEFAULT_BOOKING_LEAD_TIME_HOURS = 2
```

---

## Deployment

### Environments

| Environment | Database | Purpose |
|---|---|---|
| Development | Local Supabase (Docker) | Day-to-day development |
| Production | Supabase Cloud (Singapore region) | Live deployment |

### Infrastructure

- **Hosting:** Vercel
- **Database:** Supabase Cloud (PostgreSQL + RLS)
- **Email:** Resend (production), Supabase Inbucket (local dev)
- **Migrations:** 27 SQL files in `supabase/migrations/`, applied via `supabase db push`

### Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS (waitlist, invites, booking) |
| `NEXT_PUBLIC_APP_URL` | Public | Production URL for email links |
| `RESEND_API_KEY` | Server only | Email sending in production |
| `CHECKIN_SECRET` | Server only | HMAC secret for QR check-in tokens |

Full deployment guide in `docs/production-deployment.md` and `docs/supabase-deployment.md`.
