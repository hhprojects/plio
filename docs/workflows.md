# User Workflows

This document describes every actor in Plio, their purpose, and step-by-step flows through the application.

Plio is a **modular platform** — all businesses use the same system regardless of industry. Each tenant configures which modules are enabled, optionally renames them, and reorders the sidebar to match their workflow. There are no separate "education" or "wellness" modes.

---

## Actors Overview

| Actor | Authenticates? | Home Path |
|---|---|---|
| Super Admin | Yes | `/dashboard` |
| Admin | Yes | `/dashboard` |
| Staff | Yes | `/dashboard` |
| Client | Yes | `/dashboard` |
| Public Visitor | No | `/book/[slug]` |
| Prospective Business | No | `/register` |
| Invited Member | No → Yes | `/invite/[token]` |

All authenticated users share the same `(dashboard)/` route group. The sidebar adapts dynamically based on the user's role and the tenant's enabled modules.

---

## 1. Super Admin (Platform Owner)

**Purpose:** Manages the Plio platform itself — approving new businesses, overseeing all tenants.

**What they can do that regular Admins cannot:**
- Access `/platform` to view platform-wide statistics
- Access `/platform/waitlist` to review and approve business applications
- Access `/platform/tenants` to view and manage all tenants

### Workflow: Approve a New Business

1. Prospective business submits registration at `/register`
2. Super Admin navigates to `/platform/waitlist`
3. Reviews application (business name, email, phone, message)
4. Approves the entry → system auto-provisions:
   - New `tenant` row (with slug, default settings, default modules)
   - Admin profile for the business owner
5. Business owner receives email invitation to set their password
6. Business owner clicks invite link → sets password → redirected to `/onboarding`

---

## 2. Admin (Business Owner / Manager)

**Purpose:** Runs the day-to-day operations of a single business — managing staff, clients, services, schedules, and billing. The Admin has full access to all enabled modules.

### Workflow: Onboard a New Business

1. Accept invite from waitlist approval → log in for the first time
2. System detects first login → redirected to `/onboarding`
3. **Step 1 — Pick a Template:**
   - Choose from: Tuition Centre, Music School, Yoga Studio, Wellness Centre, General
   - Or select "Build Your Own" to start with a blank slate
   - Each template pre-enables relevant modules with sensible default titles
4. **Step 2 — Customize Modules:**
   - Toggle modules on or off
   - Rename module titles (e.g., "Clients" → "Students", "Services" → "Courses")
   - Drag to reorder sidebar items
5. **Step 3 — Add Branding:**
   - Upload business logo
   - Set business name
   - Choose accent color
6. Done → redirected to `/dashboard`

### Workflow: Set Up the Business

1. Arrive at `/dashboard` → see overview cards and getting-started guidance
2. Configure business settings at `/settings`:
   - **Branding tab:** Logo upload, business name, accent color
   - **Modules tab:** Enable/disable modules, rename titles, drag to reorder
   - General settings: Timezone (default: Asia/Singapore), currency (SGD), GST registration and rate, cancellation window
3. Create rooms at `/rooms` (e.g., "Room A — capacity 8", "Treatment Room 1")
4. Invite staff via `/team` → each staff member receives an email link
5. Create services at `/services`:
   - For recurring classes: name, default price, max capacity, color code, type = recurring
   - For bookable appointments: name, duration, price, category, buffer time, type = bookable
6. Create schedules on the calendar at `/calendar`:
   - Recurring classes: select service (type=recurring), staff member, room, day/time, recurrence rule → system auto-generates class instances
   - Appointments: select service (type=bookable), staff member, client, date/time
7. Add clients at `/clients` (or let them self-register via public booking)
8. Invite clients via `/team` if they need portal access
9. Share the booking link (`/book/[slug]`) on the business website, social media, etc.

### Workflow: Issue an Invoice

1. Navigate to `/invoicing`
2. Create a new invoice → select a contact (client)
3. Add line items (description, quantity, unit price)
4. System auto-calculates GST if the business is GST-registered
5. Set status to "sent" → client can see it on their portal
6. When payment is received, record it (PayNow, cash, bank transfer, or Stripe)
7. Invoice status updates to "paid"

### Workflow: Manage Team

1. Navigate to `/team`
2. View all team members with their roles and status
3. Click "Invite" → enter email, select role (admin, staff, or client)
4. System sends email with a signed invite link
5. Track pending invitations and resend or revoke as needed

### Workflow: Daily Operations

1. Open `/calendar` → see today's sessions at a glance
2. View by day, week, or month; filter by staff member, room, or service
3. If a staff member is absent → drag a session to reschedule or cancel it
4. Manage session statuses: confirmed → completed / cancelled / no_show
5. Walk-in clients: create an appointment directly from the calendar
6. Review attendance and enrollment after each session

---

## 3. Staff

**Purpose:** Views their assigned schedule and manages sessions. Staff have access to the calendar, their assigned sessions, and client information. They do not manage services, rooms, billing, or settings.

### Workflow: Daily Schedule

1. Log in → arrive at `/dashboard`
   - See summary of today's sessions and upcoming schedule
2. Navigate to `/calendar` → view their assigned sessions
   - See service name, time, room, enrolled clients
3. Tap a session to view its detail → see client roster
4. During/after a session:
   - Update attendance (attended, no_show, cancelled)
   - Update session status to "completed"
5. Navigate to `/clients` to view client details and history

---

## 4. Client

**Purpose:** Views their upcoming sessions, checks attendance history, and sees invoices. The Client portal is a simplified, read-oriented view of the dashboard.

### Workflow: Daily Use

1. Log in → arrive at `/dashboard`
   - See summary cards: upcoming sessions, recent attendance, outstanding invoices
2. Navigate to `/calendar` (limited view)
   - View their own upcoming and past sessions
3. Navigate to `/invoicing` (view only)
   - See all invoices (draft, sent, paid, overdue)
   - Tap an invoice to view line items and payment status

---

## 5. Public Visitor — Booking

**Purpose:** Books an appointment or registers for a class at a business without creating an account. The booking page is the business's public-facing scheduling tool.

### How they find the booking page

The business shares their booking link through:
- Their website (linked or embedded)
- Social media bios (Instagram, Facebook)
- Google Business listing
- QR code printed at the front desk, on business cards, or marketing materials
- WhatsApp/SMS messages to existing clients

### Workflow: Book a Session

1. Visit `/book/[business-slug]` (e.g., `/book/glow-wellness`)
2. See the business name, logo, and list of available services
3. Select a service (e.g., "Swedish Massage — 60 min, $90")
4. Select a team member (or "Any Available")
5. Pick a date → system shows available time slots based on:
   - Staff member's weekly availability
   - Minus existing booked sessions
   - Minus blocked dates (holidays, leave)
   - Respecting service duration + buffer minutes
6. Select a time slot
7. Enter contact details: name, phone number, email (optional)
8. Confirm booking
9. System creates a session (status: confirmed) and a client record (or matches existing by phone)
10. Session appears on the staff member's and admin's calendar

---

## 6. Prospective Business (Registration)

**Purpose:** A business owner who wants to use Plio signs up for the waitlist.

### Workflow: Register Interest

1. Visit `/register`
2. Fill in: business name, contact email, phone, optional message
3. Submit → creates a `waitlist` entry (status: pending)
4. Wait for Super Admin approval (see Super Admin workflow above)
5. Upon approval → receive invite email → set password → complete onboarding → start running the business

---

## 7. Invited Member

**Purpose:** Any new user joining an existing business — additional admins, staff members, or clients.

### Workflow: Accept Invitation

1. Admin sends invite from `/team` → system creates an `invitation` row with a signed token
2. User receives email with a link to `/invite/[token]`
3. Click the link → system validates the token (checks expiry, already-used)
4. Fill in: password, confirm details
5. System creates:
   - Supabase Auth user (with `role` and `tenant_id` in metadata)
   - `profiles` row (via `on_auth_user_created` trigger)
   - Marks invitation as accepted
6. Auto-redirected to `/dashboard`

---

## Onboarding Flow (Detail)

The onboarding wizard runs once for newly approved businesses. It lives at `/onboarding` and consists of three steps.

### Step 1 — Pick a Template

| Template | Pre-enabled Modules | Renamed Titles |
|---|---|---|
| Tuition Centre | calendar, clients, services, rooms, invoicing, booking | Clients → Students, Services → Courses |
| Music School | calendar, clients, services, rooms, invoicing, booking | Clients → Students, Services → Lessons |
| Yoga Studio | calendar, clients, services, rooms, booking | Services → Classes |
| Wellness Centre | calendar, clients, services, rooms, invoicing, booking | — |
| General | calendar, clients, services, team, rooms, invoicing, booking | — |
| Build Your Own | (only always-on: dashboard, team, settings) | — |

Always-on modules (dashboard, team, settings) are enabled regardless of template.

### Step 2 — Customize Modules

- Each module displays as a toggleable card with its icon and current title
- Always-on modules show as locked (cannot be disabled)
- Rename any module title via an inline edit field
- Drag and drop to reorder the sidebar

### Step 3 — Add Branding

- Upload a business logo (stored in Supabase Storage)
- Enter or confirm the business name
- Pick an accent color (defaults to Indigo `#6366f1`)

---

## Settings Page (Detail)

Accessible at `/settings` by Admin and Super Admin roles.

### Branding Tab

- Upload / replace business logo
- Edit business name
- Choose accent color via color picker

### Modules Tab

- Toggle modules on/off (except always-on modules)
- Rename module titles inline
- Drag to reorder sidebar items
- Changes take effect immediately across the tenant

---

## Calendar Workflows (Detail)

The calendar at `/calendar` is the operational hub. Admin and Staff can interact with it; Clients see a limited read-only view.

### Create a Recurring Class

1. Click "New" on the calendar → select "Recurring Class"
2. Pick a service (type = recurring)
3. Assign a staff member and room
4. Set day of week, start time, end time
5. Define recurrence rule (e.g., weekly for 12 weeks, or until a specific date)
6. Confirm → system generates `class_instances` for the entire date range
7. Instances appear on the calendar; each can be individually managed

### Create an Appointment

1. Click "New" on the calendar → select "Appointment"
2. Pick a service (type = bookable)
3. Assign a staff member
4. Select or create a client
5. Pick date and time
6. Confirm → session appears on the calendar

### Manage Sessions

- Click any session on the calendar to open its detail panel
- Update status: confirmed → completed / cancelled / no_show
- View and manage enrollment (for recurring classes)
- Reschedule by dragging the session to a new time slot

---

## Route Access Matrix

| Route | super_admin | admin | staff | client | public |
|---|---|---|---|---|---|
| `/dashboard` | Yes | Yes | Yes | Yes | → `/login` |
| `/calendar` | Yes | Yes | Yes | Limited | → `/login` |
| `/clients` | Yes | Yes | Yes | No | → `/login` |
| `/services` | Yes | Yes | Yes | No | → `/login` |
| `/team` | Yes | Yes | Limited | No | → `/login` |
| `/rooms` | Yes | Yes | Yes | No | → `/login` |
| `/invoicing` | Yes | Yes | No | View own | → `/login` |
| `/settings` | Yes | Yes | No | No | → `/login` |
| `/platform/*` | Yes | No | No | No | → `/login` |
| `/onboarding` | Yes | Yes | No | No | → `/login` |
| `/book/[slug]` | Yes | Yes | Yes | Yes | Yes |
| `/register` | Yes | Yes | Yes | Yes | Yes |
| `/invite/[token]` | — | — | — | — | Yes |
| `/login` | Auto-redirect | Auto-redirect | Auto-redirect | Auto-redirect | Yes |

**Note:** Module-level access also depends on whether the module is enabled for the tenant. If a module is disabled, its route returns a 404 for all roles.
