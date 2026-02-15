# Plio

**Flexible Management for Modern Studios.**

A multi-tenant SaaS platform that digitizes operations for tuition centers, yoga studios, music schools, and enrichment providers in Singapore. One deployment serves many centers — each with its own isolated data, branding, and configuration.

---

## Value Proposition

Small education and enrichment businesses in Singapore still run on WhatsApp groups, spreadsheets, and paper sign-in sheets. Plio replaces that chaos with a single system that handles scheduling, attendance, credits, invoicing, and parent communication — purpose-built for the local market (PayNow, PDPA, public holidays, GST).

**For portfolio reviewers:** This project demonstrates multi-tenant database design, complex scheduling logic (recurring events, conflict detection, makeup credits), role-based access control via Row-Level Security, real-time updates, and a payment verification workflow — all in a production-grade Next.js + Supabase stack.

---

## Multi-Tenant SaaS Model

Plio follows a **shared-database, shared-schema** multi-tenancy strategy:

- Every data table carries a `tenant_id` column
- Supabase Row-Level Security (RLS) policies enforce tenant isolation at the database level — no application code can accidentally leak data across tenants
- Each tenant gets a unique slug (e.g., `bright-tuition`) used in URLs and configuration
- Tenant-level settings (timezone, currency, cancellation policy hours, GST registration) are stored as JSONB, avoiding schema changes per tenant
- A single Vercel deployment serves all tenants; tenant resolution happens via subdomain or slug in the URL path

---

## Tech Stack & Justifications

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server Components, Server Actions, streaming, file-based routing |
| Styling | **Tailwind CSS 4** | Utility-first, consistent design tokens, zero runtime |
| Components | **Shadcn UI** | Accessible, composable, owns the source code (no black-box library) |
| Backend / DB | **Supabase (PostgreSQL)** | Auth, RLS, Realtime subscriptions, Edge Functions, Storage — one platform |
| State | **Zustand** | Minimal boilerplate vs Redux; built-in devtools; works with Server Components |
| Calendar | **FullCalendar** | Mature, drag-and-drop, resource timeline views, recurring event support |
| Email | **React Email + Resend** | Type-safe email templates, reliable delivery, free tier covers demo |
| Payments | **Stripe (PayNow mode)** | Official PayNow support via Stripe; test mode for portfolio demo |
| Monorepo | **Turborepo** | Shared packages, parallel builds, remote caching |
| Testing | **Vitest + Playwright** | Fast unit tests (Vitest), reliable E2E (Playwright) |
| Deployment | **Vercel** | Preview URLs per PR, edge network, zero-config Next.js hosting |
| CI/CD | **GitHub Actions** | Lint, type-check, test, deploy pipeline |

### Monorepo Structure

```
plio/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages & layouts
│       │   ├── (auth)/         # Login, signup, forgot password
│       │   ├── (dashboard)/    # Authenticated routes
│       │   │   ├── admin/      # Admin command center
│       │   │   ├── tutor/      # Tutor portal
│       │   │   └── parent/     # Parent portal
│       │   └── api/            # API routes (webhooks)
│       ├── components/         # App-specific components
│       ├── lib/                # Supabase client, utils, constants
│       ├── stores/             # Zustand stores
│       └── hooks/              # Custom React hooks
├── packages/
│   ├── ui/                     # Shared Shadcn components
│   ├── db/                     # Supabase types, migrations, seed scripts
│   ├── email/                  # React Email templates
│   └── utils/                  # Shared utilities (date helpers, RRULE parser, GST calc)
├── supabase/
│   ├── migrations/             # SQL migration files
│   ├── seed.sql                # Demo data
│   └── config.toml             # Supabase project config
├── turbo.json
├── package.json
└── .github/
    └── workflows/
        └── ci.yml
```

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js App (SSR + RSC)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │  │
│  │  │  Server   │  │  Server  │  │  API Routes   │   │  │
│  │  │Components │  │ Actions  │  │  (Webhooks)   │   │  │
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
│  ┌──────────────────┐                                   │
│  │  Edge Functions   │ ← Cron jobs (invoice generation) │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
    ┌──────────┐                   ┌──────────┐
    │  Stripe  │                   │  Resend  │
    │ (PayNow) │                   │ (Email)  │
    └──────────┘                   └──────────┘
```

### Auth Flow

1. User signs up or logs in via Supabase Auth (email/password or magic link)
2. `on_auth_user_created` trigger inserts a row into `profiles` with default role `parent`
3. Admin assigns user to a tenant and upgrades role if needed
4. Every authenticated request carries a JWT; RLS policies extract `auth.uid()` and match against `profiles.user_id` and `profiles.tenant_id`
5. Client-side route guards redirect users to their role-appropriate dashboard

### API Layer

- **Server Actions** for all mutations (create class, enroll student, generate invoice)
- **Server Components** for data fetching (calendar view, student list, dashboard stats)
- **API Routes** only for external webhooks (Stripe payment confirmation, Resend delivery status)
- Supabase client is instantiated server-side with the user's JWT for RLS enforcement

### Realtime

- Supabase Realtime channels scoped by `tenant_id`
- Calendar subscribes to `class_instances` changes — drag-and-drop updates appear instantly for all admin users in the same tenant
- Parents receive real-time notifications for class cancellations, schedule changes, payment confirmations

---

## Database Schema

### Entity-Relationship Overview

```
tenants ─┬─< profiles ──< notifications
         │       │
         │       ├──< students ──< enrollments >── class_instances
         │       │        │                              │
         │       │        └──< credit_ledger >───────────┘
         │       │
         │       └── (as tutor) ──< recurring_schedules ──< class_instances
         │
         ├─< courses ──< recurring_schedules
         │
         ├─< rooms
         ├─< holidays
         ├─< invoices ──< payments
         └─< audit_log
```

### Tables

#### `tenants`

The root entity. Every other table references a tenant.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `name` | `text` | e.g., "Bright Tuition Centre" |
| `slug` | `text` UNIQUE | URL-safe identifier, e.g., `bright-tuition` |
| `settings` | `jsonb` | `{ timezone, currency, cancellation_hours, gst_registered, gst_rate, logo_url }` |
| `subscription_tier` | `text` | `free`, `starter`, `pro` |
| `created_at` | `timestamptz` | Default `now()` |

#### `profiles`

Every authenticated user has one profile per tenant. Linked to Supabase Auth via `user_id`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `user_id` | `uuid` FK → auth.users | Supabase Auth reference |
| `role` | `text` | `super_admin`, `admin`, `tutor`, `parent` |
| `full_name` | `text` | |
| `email` | `text` | |
| `phone` | `text` | E.164 format, e.g., `+6591234567` |
| `avatar_url` | `text` | Nullable |
| `nric_masked` | `text` | e.g., `T****567A` — stored masked, never stored in full |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, user_id)` UNIQUE — one profile per user per tenant.

#### `students`

Students are dependents of parent profiles. A student is not a user — they don't log in.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `parent_id` | `uuid` FK → profiles | The parent who manages this student |
| `full_name` | `text` | |
| `date_of_birth` | `date` | Nullable |
| `school` | `text` | Nullable, e.g., "Raffles Institution" |
| `level` | `text` | e.g., "Sec 3", "P5" |
| `notes` | `text` | Internal admin notes |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, parent_id)`.

#### `courses`

A course is a template (e.g., "Sec 3 E-Math"). Classes are instances of courses.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `title` | `text` | e.g., "Sec 3 E-Math" |
| `description` | `text` | Nullable |
| `default_price` | `numeric(10,2)` | Per-session price in SGD |
| `color_code` | `text` | Hex color for calendar display |
| `max_capacity` | `integer` | Default capacity for new classes |
| `is_active` | `boolean` | Default `true` |
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

#### `holidays`

Tenant-specific and national holidays. Used to exclude dates when generating class instances from recurring schedules.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `date` | `date` | |
| `name` | `text` | e.g., "Chinese New Year Day 1" |
| `is_national` | `boolean` | `true` for SG public holidays, `false` for tenant-specific closures |

**Index:** `(tenant_id, date)` UNIQUE.

#### `recurring_schedules`

Defines a repeating class pattern. Does not store individual instances — those are materialized into `class_instances`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `course_id` | `uuid` FK → courses | |
| `tenant_id` | `uuid` FK → tenants | Denormalized for RLS |
| `day_of_week` | `smallint` | 0 = Sunday, 6 = Saturday |
| `start_time` | `time` | |
| `end_time` | `time` | |
| `tutor_id` | `uuid` FK → profiles | Must have role `tutor` |
| `room_id` | `uuid` FK → rooms | Nullable |
| `recurrence_rule` | `text` | RRULE string, e.g., `FREQ=WEEKLY;COUNT=12` |
| `effective_from` | `date` | Start of recurrence window |
| `effective_until` | `date` | End of recurrence window |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | |

#### `class_instances`

A single occurrence of a class on a specific date. Materialized from recurring schedules or created ad-hoc. This is the core scheduling table.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `recurring_schedule_id` | `uuid` FK → recurring_schedules | Nullable (null for ad-hoc classes) |
| `course_id` | `uuid` FK → courses | |
| `tenant_id` | `uuid` FK → tenants | |
| `date` | `date` | |
| `start_time` | `time` | |
| `end_time` | `time` | |
| `tutor_id` | `uuid` FK → profiles | |
| `room_id` | `uuid` FK → rooms | Nullable |
| `status` | `text` | `scheduled`, `cancelled`, `holiday` |
| `max_capacity` | `integer` | Copied from course default, overridable |
| `override_notes` | `text` | Reason for cancellation, room change, etc. |
| `created_at` | `timestamptz` | |

**Indexes:**
- `(tenant_id, date)` — calendar queries
- `(tenant_id, tutor_id, date)` — tutor schedule
- `(tenant_id, room_id, date, start_time, end_time)` — conflict detection

#### `enrollments`

Links a student to a specific class instance. Tracks attendance status.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `student_id` | `uuid` FK → students | |
| `class_instance_id` | `uuid` FK → class_instances | |
| `tenant_id` | `uuid` FK → tenants | Denormalized for RLS |
| `status` | `text` | `confirmed`, `attended`, `no_show`, `cancelled`, `makeup` |
| `checked_in_at` | `timestamptz` | Nullable, set by QR scan |
| `cancelled_at` | `timestamptz` | Nullable |
| `cancellation_reason` | `text` | Nullable |
| `created_at` | `timestamptz` | |

**Index:** `(student_id, class_instance_id)` UNIQUE — no duplicate enrollments.

#### `credit_ledger`

An append-only ledger tracking credit movements. Student balance = `SUM(amount)` for that student.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `student_id` | `uuid` FK → students | |
| `amount` | `integer` | Positive = credit added, negative = credit consumed |
| `reason` | `text` | `purchase`, `cancellation_refund`, `makeup_booking`, `admin_adjustment`, `expiry` |
| `class_instance_id` | `uuid` FK → class_instances | Nullable — links to the class that consumed/generated the credit |
| `invoice_id` | `uuid` FK → invoices | Nullable — links to the invoice that purchased the credits |
| `created_by` | `uuid` FK → profiles | Who performed the action |
| `created_at` | `timestamptz` | |

**Balance query:**
```sql
SELECT student_id, SUM(amount) AS balance
FROM credit_ledger
WHERE tenant_id = :tenant_id
GROUP BY student_id;
```

#### `invoices`

Monthly or on-demand invoices sent to parents.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `invoice_number` | `text` | Sequential per tenant, e.g., `INV-2026-0042` |
| `parent_id` | `uuid` FK → profiles | |
| `line_items` | `jsonb` | `[{ description, student_name, quantity, unit_price, amount }]` |
| `subtotal` | `numeric(10,2)` | |
| `gst_rate` | `numeric(4,2)` | e.g., `9.00` for 9% GST |
| `gst_amount` | `numeric(10,2)` | |
| `total` | `numeric(10,2)` | |
| `status` | `text` | `draft`, `sent`, `paid`, `overdue`, `void` |
| `due_date` | `date` | |
| `paid_at` | `timestamptz` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, parent_id, status)`.

#### `payments`

Individual payment attempts against an invoice.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `invoice_id` | `uuid` FK → invoices | |
| `tenant_id` | `uuid` FK → tenants | |
| `method` | `text` | `paynow`, `stripe`, `cash`, `bank_transfer` |
| `amount` | `numeric(10,2)` | |
| `status` | `text` | `pending_verification`, `verified`, `rejected` |
| `receipt_url` | `text` | Supabase Storage path for uploaded receipt screenshot |
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
| `type` | `text` | `class_cancelled`, `payment_received`, `invoice_sent`, `makeup_booked`, `schedule_changed` |
| `title` | `text` | Short heading |
| `body` | `text` | Detail message |
| `metadata` | `jsonb` | `{ class_instance_id, invoice_id, ... }` — for deep linking |
| `read_at` | `timestamptz` | Nullable — null means unread |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, user_id, read_at)` — efficiently query unread notifications.

#### `audit_log`

Immutable log of all significant actions. Essential for compliance and debugging.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `tenant_id` | `uuid` FK → tenants | |
| `actor_id` | `uuid` FK → profiles | Who performed the action |
| `action` | `text` | `create`, `update`, `delete`, `cancel`, `verify`, `login` |
| `entity_type` | `text` | `class_instance`, `enrollment`, `invoice`, `payment`, etc. |
| `entity_id` | `uuid` | ID of the affected record |
| `changes` | `jsonb` | `{ field: { old: ..., new: ... } }` |
| `ip_address` | `inet` | Nullable |
| `created_at` | `timestamptz` | |

**Index:** `(tenant_id, entity_type, entity_id)` — look up history for a specific record.

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|---|---|
| `super_admin` | Platform operator. Can manage tenants, impersonate users, view all data. |
| `admin` | Tenant owner/manager. Full access to their tenant's data. |
| `tutor` | Instructor. Can view their own schedule, mark attendance, see enrolled students. |
| `parent` | Parent/guardian. Can view their children, book makeup classes, pay invoices. |

### Permission Matrix

| Resource | super_admin | admin | tutor | parent |
|---|---|---|---|---|
| Tenants | CRUD | Read own | - | - |
| Profiles (own tenant) | CRUD | CRUD | Read own | Read own |
| Students | CRUD | CRUD | Read (enrolled) | Read own children |
| Courses | CRUD | CRUD | Read | Read |
| Recurring Schedules | CRUD | CRUD | Read own | - |
| Class Instances | CRUD | CRUD | Read/Update own | Read enrolled |
| Enrollments | CRUD | CRUD | Read/Update own classes | Create/Cancel own |
| Credit Ledger | CRUD | CRUD | Read | Read own |
| Invoices | CRUD | CRUD | - | Read own |
| Payments | CRUD | CRUD | - | Create, Read own |
| Notifications | CRUD | CRUD | Read own | Read own |
| Audit Log | Read all | Read own tenant | - | - |
| Rooms | CRUD | CRUD | Read | - |
| Holidays | CRUD | CRUD | Read | Read |

### RLS Policy Examples

**Tenant isolation (applied to every table):**

```sql
CREATE POLICY "tenant_isolation" ON class_instances
  USING (
    tenant_id = (
      SELECT tenant_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );
```

**Tutor sees only their assigned classes:**

```sql
CREATE POLICY "tutor_own_classes" ON class_instances
  FOR SELECT
  USING (
    tutor_id = (
      SELECT id FROM profiles
      WHERE user_id = auth.uid() AND role = 'tutor'
    )
  );
```

**Parent sees only their children's enrollments:**

```sql
CREATE POLICY "parent_own_enrollments" ON enrollments
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students
      WHERE parent_id = (
        SELECT id FROM profiles
        WHERE user_id = auth.uid() AND role = 'parent'
      )
    )
  );
```

**Parent can cancel enrollments (with time constraint enforced in application):**

```sql
CREATE POLICY "parent_cancel_enrollment" ON enrollments
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM students
      WHERE parent_id = (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    status IN ('cancelled')
  );
```

---

## Feature Specification

### Phase 1: Admin Command Center

**Target:** Desktop-first admin interface. The operational backbone of the system.

#### Master Calendar

- **Views:** Week, month, day — switchable via tabs
- **Display:** Classes color-coded by course, showing tutor name and enrollment count (e.g., "5/8")
- **Drag-and-drop:** Admin drags a class to a new time slot. System checks for conflicts before confirming
- **Click to open:** Clicking a class opens a detail panel showing enrolled students, attendance status, and quick actions (cancel, reassign tutor, change room)
- **Holiday overlay:** Public holidays and tenant closures are grayed out with a label

**Conflict detection algorithm:**

```
When moving/creating a class instance:
1. Query class_instances WHERE tenant_id = :tid AND date = :date
   AND status = 'scheduled'
2. For the target tutor: check no overlap in (start_time, end_time)
3. For the target room: check no overlap in (start_time, end_time)
4. If conflict found → return { conflict_type, conflicting_class } → show modal asking admin to resolve
5. If clear → update and broadcast via Realtime
```

#### Student CRM

- Searchable, filterable list of all students in the tenant
- Filters: course, level, status (active/inactive), outstanding balance
- Each student card shows: name, parent, enrolled courses, credit balance, last attendance
- WhatsApp deep link: click the phone icon → opens `https://wa.me/6591234567?text=Hi%20Mrs%20Tan%2C%20regarding%20[Student]...`
- Enrollment history: timeline view of all past and upcoming classes

#### Tutor Management

- List of tutors with their assigned courses and weekly hours
- Availability grid: tutors set their available time slots; admin sees at a glance who's free
- Payroll summary: total hours taught per period (calculated from attended class instances)

#### Room Management

- Room list with capacity
- Utilization view: which rooms are in use at any given time
- Conflict detection shared with the calendar (no double-booking)

#### Recurring Schedule Engine

- Admin defines: course + day of week + time + tutor + room + recurrence rule (e.g., "Every Tuesday for 12 weeks starting 2026-03-03")
- System parses the RRULE and generates `class_instances` in bulk
- Holiday exclusion: cross-references the `holidays` table and skips those dates
- Generated instances can be individually edited or cancelled without affecting the recurring rule
- Regeneration: if the rule changes, admin can choose to regenerate future instances (past instances are preserved)

### Phase 2: Parent Portal

**Target:** Mobile-first PWA. Parents use this on their phones.

#### Dashboard

- **Next class** card: course name, date, time, tutor, room — prominent at the top
- **Credit balance** card: current credits per student
- **Outstanding fees** card: unpaid invoice total with a "Pay Now" CTA
- **Recent activity** feed: last 5 notifications

#### QR Check-in

- Parent opens the app at the center → taps "Check In"
- App displays a QR code containing a signed token: `{ student_id, class_instance_id, timestamp }`
- Admin/tutor scans with their device (or a tablet at the front desk)
- System validates the token, marks `enrollments.checked_in_at`, updates attendance status to `attended`
- Fallback: admin can manually mark attendance from the class detail panel

#### Makeup Class Booking

This is the signature feature — the flow that demonstrates complex business logic.

**Cancellation flow:**
1. Parent views upcoming enrolled classes
2. Taps "Cancel" on a future class
3. System checks: is the class more than `tenant.settings.cancellation_hours` (default 24) hours away?
4. If **yes**: enrollment status → `cancelled`, one credit is added to `credit_ledger` with reason `cancellation_refund`
5. If **no**: show warning "Cancellation window has passed. No credit will be refunded." Parent can still cancel but gets no credit
6. Notification sent to admin

**Makeup booking flow:**
1. Parent taps "Book Makeup"
2. System shows available classes: `class_instances WHERE status = 'scheduled' AND date > now()` filtered to classes where `current_enrollment < max_capacity` and matching the same course (or any course, depending on tenant settings)
3. Parent selects a slot → enrollment created with status `makeup`, one credit deducted from `credit_ledger`
4. Notification sent to admin
5. If no credits available → show "Purchase more credits or contact the center"

#### Attendance History

- Per-student timeline: date, class, status (attended / no-show / cancelled / makeup)
- Summary stats: attendance rate, cancellation rate
- Filterable by date range and course

### Phase 3: Payments

#### Invoice Generation

- **Manual:** Admin generates an invoice for a specific parent
- **Batch:** Admin triggers "Generate Monthly Invoices" → system creates invoices for all parents with attended sessions in the billing period
- Line items auto-populated from enrollment data: `{ student_name, course_title, sessions_attended, unit_price, amount }`
- GST calculated based on `tenant.settings.gst_registered` and `tenant.settings.gst_rate`
- Invoice number auto-incremented per tenant: `INV-2026-0042`
- Email notification sent via Resend with invoice details

#### PayNow QR

- Parent views outstanding invoice → taps "Pay with PayNow"
- System generates a dynamic PayNow QR via Stripe PayNow integration (in test mode for portfolio)
- Alternatively: display a static PayNow QR for the tenant's registered UEN with the invoice amount pre-filled
- After payment, Stripe webhook updates payment status → marks invoice as `paid`

#### Receipt Upload & Verification

For manual bank transfers (common in Singapore):

1. Parent taps "I've Paid" → uploads a screenshot of their banking app transfer confirmation
2. Image stored in Supabase Storage under `receipts/{tenant_id}/{invoice_id}/`
3. Payment record created with status `pending_verification`
4. Admin sees the payment in a "Pending Approvals" queue
5. Admin views the receipt image alongside the invoice details
6. Admin taps "Verify" (updates status to `verified`, marks invoice as `paid`) or "Reject" with a reason
7. Notification sent to parent either way

#### Payment History

- Parent view: list of all invoices with status badges (paid, pending, overdue)
- Admin view: full payment ledger with filters (date range, status, method, parent)

### Phase 4: Notifications & Communication

#### In-App Notifications

- Bell icon in the header with unread count badge
- Dropdown panel showing recent notifications
- Powered by Supabase Realtime — notifications appear instantly without page refresh
- Clicking a notification deep-links to the relevant screen (e.g., class detail, invoice)

**Notification triggers:**

| Event | Recipients | Channel |
|---|---|---|
| Class cancelled | Enrolled parents | In-app, Email |
| Schedule changed (time/tutor/room) | Enrolled parents | In-app, Email |
| Makeup class booked | Admin | In-app |
| Invoice generated | Parent | In-app, Email |
| Payment received | Admin | In-app |
| Payment verified | Parent | In-app, Email |
| Payment rejected | Parent | In-app, Email |
| Credit balance low | Parent | In-app |

#### Email Notifications

- Built with React Email for consistent, branded templates
- Sent via Resend API
- Templates: invoice sent, payment confirmation, class cancellation, welcome email
- Each email includes an unsubscribe link (PDPA compliance)

#### WhatsApp Integration

- Deep links via `wa.me/{phone}?text={encoded_message}` — no API needed
- Pre-filled message templates for common scenarios:
  - "Hi {parent_name}, a reminder that {student_name} has {course} tomorrow at {time}."
  - "Hi {parent_name}, we noticed {student_name} was absent from {course} today. Is everything okay?"
- Future: WhatsApp Business API for automated messaging

### Phase 5: Analytics & Reporting

#### Dashboards (Admin)

- **Occupancy rate:** per class, per course, per day of week — bar charts and heatmaps
- **Revenue:** monthly revenue trend, breakdown by course, outstanding vs collected
- **Student retention:** new enrollments vs churned students per month
- **Tutor utilization:** hours taught vs available hours per tutor

#### Export

- CSV export for any data table (students, invoices, attendance)
- PDF generation for invoices and attendance reports (using `@react-pdf/renderer`)

### Phase 6: Future Vision

Features documented for future development. Not in initial scope but the schema supports them.

- **Multi-location support:** Add a `location_id` to `rooms` and `class_instances`; tenants can manage multiple branches
- **Waitlist system:** When a class is full, parents can join a waitlist; auto-promoted when a spot opens
- **Referral program:** Parent-to-parent referral codes that grant bonus credits
- **AI schedule optimization:** Suggest optimal class times based on enrollment patterns and tutor availability
- **Mobile app:** React Native / Expo, sharing the same Supabase backend
- **White-label theming:** Per-tenant color schemes, logos, and custom domains

---

## API Contracts

All mutations are implemented as Next.js Server Actions. Types are generated from the Supabase schema via `supabase gen types`.

### Schedule

```typescript
// Create a recurring schedule and generate class instances
async function createRecurringSchedule(input: {
  courseId: string;
  dayOfWeek: number;          // 0-6
  startTime: string;          // "14:00"
  endTime: string;            // "16:00"
  tutorId: string;
  roomId?: string;
  recurrenceRule: string;     // "FREQ=WEEKLY;COUNT=12"
  effectiveFrom: string;      // "2026-03-03"
  effectiveUntil: string;     // "2026-05-26"
}): Promise<{
  schedule: RecurringSchedule;
  instances: ClassInstance[];  // generated instances
  skippedDates: string[];     // dates skipped due to holidays
}>

// Reschedule a single class instance (drag-and-drop)
async function rescheduleClassInstance(input: {
  classInstanceId: string;
  date: string;
  startTime: string;
  endTime: string;
  tutorId?: string;           // optional tutor change
  roomId?: string;            // optional room change
}): Promise<{
  instance: ClassInstance;
  conflicts: Conflict[];      // empty if successful
}>

// Cancel a class instance
async function cancelClassInstance(input: {
  classInstanceId: string;
  reason: string;
  refundCredits: boolean;     // refund enrolled students
}): Promise<{
  instance: ClassInstance;
  refundedStudents: number;
  notificationsSent: number;
}>
```

### Enrollment

```typescript
// Enroll a student in a class
async function enrollStudent(input: {
  studentId: string;
  classInstanceId: string;
}): Promise<{
  enrollment: Enrollment;
  currentEnrollment: number;  // updated count
  maxCapacity: number;
}>

// Cancel enrollment (parent or admin)
async function cancelEnrollment(input: {
  enrollmentId: string;
  reason?: string;
}): Promise<{
  enrollment: Enrollment;
  creditRefunded: boolean;
  creditBalance: number;      // updated balance
}>

// Book a makeup class
async function bookMakeup(input: {
  studentId: string;
  classInstanceId: string;    // target class
}): Promise<{
  enrollment: Enrollment;
  creditBalance: number;      // after deduction
}>

// Get available makeup slots
async function getAvailableMakeupSlots(input: {
  studentId: string;
  courseId?: string;           // filter by same course
  dateFrom: string;
  dateTo: string;
}): Promise<{
  slots: Array<{
    classInstance: ClassInstance;
    currentEnrollment: number;
    availableSpots: number;
  }>;
}>
```

### Credits

```typescript
// Admin adjusts a student's credit balance
async function adjustCredits(input: {
  studentId: string;
  amount: number;             // positive or negative
  reason: string;
}): Promise<{
  ledgerEntry: CreditLedger;
  newBalance: number;
}>

// Get credit balance and transaction history
async function getCreditHistory(input: {
  studentId: string;
  limit?: number;
  offset?: number;
}): Promise<{
  balance: number;
  transactions: CreditLedger[];
  total: number;
}>
```

### Invoices & Payments

```typescript
// Generate monthly invoices in batch
async function generateMonthlyInvoices(input: {
  billingMonth: string;       // "2026-03"
}): Promise<{
  invoicesCreated: number;
  invoices: Invoice[];
  errors: Array<{ parentId: string; error: string }>;
}>

// Record a payment (parent uploads receipt)
async function submitPayment(input: {
  invoiceId: string;
  method: 'paynow' | 'bank_transfer' | 'cash';
  amount: number;
  receiptFile?: File;         // uploaded screenshot
}): Promise<{
  payment: Payment;
}>

// Admin verifies a payment
async function verifyPayment(input: {
  paymentId: string;
  action: 'verify' | 'reject';
  reason?: string;            // required for rejection
}): Promise<{
  payment: Payment;
  invoice: Invoice;           // updated status
}>
```

---

## State Management Patterns

### Zustand Store Structure

```typescript
// stores/calendar.ts — Calendar UI state
interface CalendarStore {
  view: 'week' | 'month' | 'day';
  currentDate: Date;
  selectedInstance: ClassInstance | null;
  isDetailPanelOpen: boolean;

  setView: (view: CalendarStore['view']) => void;
  navigateDate: (direction: 'prev' | 'next' | 'today') => void;
  selectInstance: (instance: ClassInstance | null) => void;
}

// stores/notifications.ts — Notification state with Realtime
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}
```

### Optimistic Updates for Calendar Drag

```typescript
// When admin drags a class to a new time:
1. Immediately update the local FullCalendar state (optimistic)
2. Fire the `rescheduleClassInstance` server action
3. If successful → Supabase Realtime broadcasts the change to other clients
4. If conflict detected → revert local state, show conflict modal
```

### Realtime Subscription Pattern

```typescript
// In a layout or provider component:
useEffect(() => {
  const channel = supabase
    .channel(`tenant:${tenantId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'class_instances',
      filter: `tenant_id=eq.${tenantId}`,
    }, (payload) => {
      // Invalidate React Query cache or update Zustand store
      queryClient.invalidateQueries(['class-instances']);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      notificationStore.addNotification(payload.new);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [tenantId, userId]);
```

---

## UI/UX Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#ffffff` | Main content area |
| `--foreground` | `#0f172a` | Primary text (Slate 900) |
| `--primary` | `#6366f1` | Buttons, active states (Indigo 500) |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#f1f5f9` | Secondary backgrounds (Slate 100) |
| `--muted` | `#94a3b8` | Placeholder text (Slate 400) |
| `--destructive` | `#ef4444` | Delete, cancel, error (Red 500) |
| `--success` | `#22c55e` | Paid, confirmed (Green 500) |
| `--warning` | `#f59e0b` | Pending, overdue (Amber 500) |
| `--sidebar` | `#0f172a` | Sidebar background (Slate 900) |
| `--sidebar-foreground` | `#e2e8f0` | Sidebar text (Slate 200) |

### Typography

- **Font:** Inter (Google Fonts)
- **Headings:** `font-semibold`, sizes via Tailwind (`text-2xl`, `text-xl`, `text-lg`)
- **Body:** `text-sm` (14px) for data-dense admin views, `text-base` (16px) for parent portal
- **Monospace:** `font-mono` for invoice numbers, credit amounts

### Component Library

Built on Shadcn UI. Key components:

- **DataTable** — sortable, filterable tables for student lists, invoices, payments
- **Calendar** — FullCalendar wrapped in a Shadcn-styled container
- **Command** — command palette (Cmd+K) for quick navigation (search students, jump to class)
- **Sheet** — slide-over panels for class details, student profiles
- **Dialog** — confirmation modals (cancel class, verify payment)
- **Toast** — success/error notifications
- **Badge** — status indicators (paid, pending, overdue, cancelled)

### Responsive Strategy

| Viewport | Target User | Layout |
|---|---|---|
| Desktop (1024px+) | Admin, Tutor | Sidebar navigation, multi-column layouts, full calendar |
| Tablet (768px–1023px) | Admin (on the go) | Collapsible sidebar, stacked layouts |
| Mobile (< 768px) | Parent | Bottom navigation bar, single-column, card-based UI |

### Mobile (Parent Portal) Navigation

```
┌──────────────────────────┐
│                          │
│      [Main Content]      │
│                          │
├──────────────────────────┤
│  🏠    📅    💳    👤   │
│ Home  Schedule Fees Profile│
└──────────────────────────┘
```

- Bottom nav bar fixed at the bottom (PWA-style)
- Disable pinch-to-zoom for native app feel: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`
- Add to home screen manifest for PWA

### Key Screen Descriptions

**Admin — Calendar View:** Full-width calendar taking up ~80% of the screen. Sidebar with upcoming classes list. Top bar with date navigation and view switcher. Clicking a class opens a right-side sheet with details.

**Admin — Student CRM:** DataTable with columns: Name, Parent, Courses, Credits, Last Attendance, Status. Search bar and filter pills at the top. Clicking a row opens a detail sheet with full history.

**Parent — Dashboard:** Stack of cards: Next Class (blue accent), Credit Balance (green), Outstanding Fees (amber if unpaid). Below: recent activity feed. Clean, minimal, fast.

**Parent — Makeup Booking:** Step wizard: 1) Select student → 2) View available slots (list of cards with date, time, spots remaining) → 3) Confirm booking.

---

## Security & Compliance

### PDPA Compliance (Singapore Personal Data Protection Act)

- **Data minimization:** Only collect data necessary for service delivery
- **NRIC masking:** NRICs stored as masked values (`T****567A`), never in full. The masking happens client-side before submission
- **Consent:** Signup flow includes explicit consent checkbox for data collection and usage
- **Access requests:** Admin can export all data for a specific parent (data subject access request)
- **Data deletion:** Admin can anonymize a profile (replace PII with placeholders) while preserving aggregate data for reporting
- **Unsubscribe:** Every email includes an unsubscribe link

### Row-Level Security

- RLS is enabled on every table with data
- Every query goes through Supabase client with the user's JWT — the database enforces access, not the application code
- Defense in depth: even if application logic has a bug, RLS prevents data leaks
- RLS policies are tested in integration tests (see Testing Strategy)

### Input Sanitization

- All user inputs validated with Zod schemas before reaching the database
- Server Actions validate inputs server-side regardless of client-side validation
- File uploads restricted to image types (JPEG, PNG) with a 5MB size limit
- Filenames sanitized before storage

### Rate Limiting

- Supabase Auth has built-in rate limiting for login attempts
- Server Actions implement rate limiting via Vercel Edge Middleware for sensitive operations (payment submission, invoice generation)

### CORS Configuration

- Supabase project configured to accept requests only from the Vercel deployment domain
- No wildcard origins in production

### Audit Logging

- All create, update, delete operations on sensitive tables write to `audit_log`
- Logs include: actor, action, entity, changes (before/after), timestamp, IP address
- Audit log is append-only — no UPDATE or DELETE policies
- Retained for 12 months minimum

---

## Testing Strategy

### Unit Tests (Vitest)

Focus on pure business logic:

- **Scheduling logic:** RRULE parsing, holiday exclusion, instance generation
- **Credit calculations:** balance computation, refund eligibility, ledger operations
- **Conflict detection:** time overlap algorithm, tutor/room availability
- **GST calculation:** subtotal → GST amount → total
- **Invoice line item generation:** from enrollment data to line items

```typescript
// Example: credit refund eligibility
describe('cancelEnrollment', () => {
  it('refunds credit when cancelled > 24h before class', () => {
    const classTime = new Date('2026-03-10T14:00:00+08:00');
    const cancelTime = new Date('2026-03-09T10:00:00+08:00');
    const result = calculateRefundEligibility(classTime, cancelTime, 24);
    expect(result.eligible).toBe(true);
  });

  it('does not refund when cancelled < 24h before class', () => {
    const classTime = new Date('2026-03-10T14:00:00+08:00');
    const cancelTime = new Date('2026-03-10T08:00:00+08:00');
    const result = calculateRefundEligibility(classTime, cancelTime, 24);
    expect(result.eligible).toBe(false);
  });
});
```

### Integration Tests (RLS Policies)

Test that RLS policies correctly enforce access control:

```typescript
// Test that a parent cannot see another parent's students
describe('RLS: students table', () => {
  it('parent can only see own children', async () => {
    const parentClient = createClient(parentAJwt);
    const { data } = await parentClient.from('students').select('*');
    expect(data.every(s => s.parent_id === parentAProfileId)).toBe(true);
  });

  it('parent cannot see other tenants data', async () => {
    const parentClient = createClient(tenantAParentJwt);
    const { data } = await parentClient
      .from('students')
      .select('*')
      .eq('tenant_id', tenantBId);
    expect(data).toHaveLength(0);
  });
});
```

### E2E Tests (Playwright)

Critical user flows tested end-to-end:

1. **Admin creates a recurring schedule** → verify class instances appear on the calendar
2. **Parent cancels and rebooks a makeup class** → verify credit ledger updates correctly
3. **Parent uploads a payment receipt** → admin verifies → invoice status updates to paid
4. **Tutor marks attendance** → enrollment status updates, parent sees it on their dashboard
5. **Multi-tenant isolation** → log in as tenant A, verify tenant B's data is invisible

### Test Data Seeding

- `supabase/seed.sql` creates two demo tenants with realistic Singapore data:
  - **Bright Tuition Centre:** 3 tutors, 8 courses (Math, Science, English by level), 20 students, 3 rooms
  - **Zen Flow Yoga Studio:** 2 instructors, 4 class types (Vinyasa, Yin, Hot, Prenatal), 15 students, 2 studios
- Seed data includes past enrollments, completed invoices, and credit history for a realistic demo

---

## Deployment & Infrastructure

### Environments

| Environment | URL | Database | Purpose |
|---|---|---|---|
| Development | `localhost:3000` | Local Supabase (Docker) | Day-to-day development |
| Staging | `staging.plio.app` | Supabase staging project | PR previews, QA |
| Production | `app.plio.app` | Supabase production project | Live demo |

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  lint-and-type-check:
    - pnpm lint
    - pnpm type-check

  unit-tests:
    - pnpm test

  e2e-tests:
    - Start local Supabase
    - Seed test data
    - pnpm playwright test

  deploy:
    needs: [lint-and-type-check, unit-tests, e2e-tests]
    if: github.ref == 'refs/heads/main'
    - Deploy to Vercel production
```

### Database Migrations

- Managed via Supabase CLI: `supabase migration new`, `supabase db push`
- Every schema change is a versioned SQL file in `supabase/migrations/`
- Migrations run automatically on `supabase db push` in CI before deployment
- Rollback strategy: write a reverse migration; never manually edit production schema

### Vercel Configuration

- Framework preset: Next.js
- Build command: `turbo build --filter=web`
- Root directory: `apps/web`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`
- Preview deployments enabled for every PR

---

## Demo Scenario Script

A walkthrough demonstrating the full platform across two tenants.

### Setup

Two browser windows open side by side:
- **Left:** Desktop browser — Admin of "Bright Tuition Centre"
- **Right:** Mobile viewport — Parent "Mrs Tan" at the same center

### Scene 1: The Admin's Morning

1. Admin logs in → lands on the **Calendar** (week view)
2. Calendar shows color-coded classes: Math (blue), Science (green), English (purple)
3. Public holiday "Good Friday" is grayed out — no classes scheduled
4. Admin notices "Sec 3 Math" on Tuesday has 8/8 students (full) → a waitlist indicator is visible

### Scene 2: Schedule Change

5. Admin drags "Sec 4 Science" from 2:00 PM to 4:00 PM on Wednesday
6. System checks for conflicts → no conflict → class moves
7. **On the parent's phone (right screen):** a notification pops up: "Schedule Changed: Sec 4 Science moved to 4:00 PM"
8. The real-time update appears without any page refresh

### Scene 3: Parent Cancels a Class

9. Mrs Tan opens the Parent Portal → sees "Next Class: Sec 3 E-Math, Tuesday 2:00 PM"
10. She taps "Cancel" → system confirms: "More than 24 hours away. 1 credit will be refunded."
11. She confirms → credit balance updates from 3 → 4
12. She taps "Book Makeup" → sees available Sec 3 Math slots with open spots
13. Selects Thursday 3:00 PM (5/8 enrolled) → confirms → credit balance: 4 → 3
14. **On admin's screen:** notification appears: "Mrs Tan booked a makeup class for Ethan — Sec 3 Math, Thursday"

### Scene 4: Payment Flow

15. Mrs Tan navigates to "Fees" → sees "March Invoice: $360.00 (incl. GST)"
16. She taps "Pay with PayNow" → a QR code appears
17. She opens her banking app (simulated), scans, transfers → comes back to Plio and taps "I've Paid"
18. Uploads a screenshot of the bank transfer confirmation
19. **On admin's screen:** "Pending Approvals" tab shows 1 new payment
20. Admin clicks → sees the receipt screenshot alongside the invoice → taps "Verify"
21. Invoice status turns green: "Paid". Mrs Tan receives a confirmation notification.

### Scene 5: Multi-Tenant Isolation

22. Admin logs out → logs in as admin of "Zen Flow Yoga Studio"
23. Completely different data: yoga classes, different tutors, different students
24. None of Bright Tuition's data is visible — RLS enforced at the database level

### Scene 6: Analytics

25. Back to Bright Tuition admin → opens "Analytics"
26. Occupancy heatmap shows Tuesday afternoons are the busiest
27. Revenue chart shows steady month-over-month growth
28. Student retention: 92% — only 2 students churned last quarter

**Closing:** The demo shows a potential client: "I can digitize your entire business — scheduling, payments, communication — in one platform, isolated from every other center on the system."
