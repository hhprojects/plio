# Testing Playbook

Manual testing checklist for verifying that each role (super_admin, admin, staff, client) has correct access throughout the app.

## Prerequisites

1. Local Supabase running (`supabase start`)
2. Dev server running (`pnpm --filter web dev`)
3. Run `supabase db reset` for a clean slate (applies migrations + seed)
4. Seed data creates all test accounts automatically (see below)

## Test Accounts

| Role | Email | Password | Tenant | Notes |
|---|---|---|---|---|
| super_admin | `admin@plio.dev` | `password123` | Plio Platform | Platform owner |
| admin | `admin@bright.test` | `password123` | Bright Learning Hub | Full access, tuition-style modules |
| staff | `staff@bright.test` | `password123` | Bright Learning Hub | Linked as team member "Sam Staff" |
| client | `client@bright.test` | `password123` | Bright Learning Hub | Has 2 children enrolled |
| admin | `admin@zen.test` | `password123` | Zen Yoga Studio | Tenant isolation test, yoga-style modules |

## Seed Data Summary

### Bright Learning Hub (aaaaaaaa-...-001)
- **Modules:** All 9 enabled. Custom titles: "Parents & Students", "Courses", "Tutors"
- **Rooms:** Room A (10), Room B (8), Room C Lab (6)
- **Team Members:** Sam Staff (Senior Tutor, linked to auth), Diana Lim (Tutor), Ravi Kumar (Tutor)
- **Services:** Sec 3 Math (recurring), Sec 4 English (recurring), P5 Science (recurring), Trial Lesson (bookable)
- **Contacts:** Charlie Client, Tan Wei Ming, Lim Shu Fen, Wong Kai Xiang — all tagged as "parent"
- **Dependents:** Chloe Client (Sec 3), Calvin Client (P5), Tan Jun Hao (Sec 3), Lim Jia Yi (Sec 3), Wong Shi Min (P5)
- **Schedules:** 4 recurring (Mon/Wed Sec 3 Math, Tue Sec 4 English, Thu P5 Science)
- **Sessions:** 2 past (completed), 2 today (scheduled), 2 next week, 1 trial appointment
- **Enrollments:** 3 students in today's Math, 2 in today's Science, past attended records, trial booking
- **Invoices:** 1 sent ($392.40), 1 paid ($218.00) — both for Charlie Client
- **Contact Notes:** 2 notes from Sam Staff about last week's Math class
- **Availability Override:** Sam Staff off next Monday

### Zen Yoga Studio (bbbbbbbb-...-001)
- **Modules:** 7 enabled (rooms + invoicing disabled). Custom titles: "Members", "Classes & Sessions", "Instructors"
- **Team Members:** Maya Chen (Lead Instructor), Arjun Patel (Instructor)
- **Services:** Morning Vinyasa (recurring), Evening Yin (recurring), Private Yoga (bookable)
- **Contacts:** Emily Tan, Jason Lim
- **Sessions:** 1 today (Morning Vinyasa), 1 tomorrow (Private appointment)

### Platform
- **Waitlist:** 1 pending entry (Star Music Academy)

---

## Test 1: Unauthenticated Access

Test while logged out (incognito or clear cookies).

| # | Action | Expected | Pass? |
|---|---|---|---|
| 1.1 | Navigate to `/dashboard` | Redirect to `/login` | |
| 1.2 | Navigate to `/calendar` | Redirect to `/login` | |
| 1.3 | Navigate to `/clients` | Redirect to `/login` | |
| 1.4 | Navigate to `/settings` | Redirect to `/login` | |
| 1.5 | Navigate to `/platform` | Redirect to `/login` | |
| 1.6 | Navigate to `/login` | Login page renders | |
| 1.7 | Navigate to `/register` | Registration page renders | |
| 1.8 | Navigate to `/book/bright-learning` | Booking page renders (no auth required) | |
| 1.9 | Navigate to `/book/nonexistent` | 404 page | |

---

## Test 2: Super Admin (`admin@plio.dev`)

Log in as super_admin.

### 2A. Login & Navigation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2A.1 | Log in at `/login` | Redirect to `/dashboard` | |
| 2A.2 | Check sidebar | All module tabs visible + "Platform" section | |
| 2A.3 | Navigate to `/platform` | Platform dashboard renders | |
| 2A.4 | Navigate to `/platform/waitlist` | Waitlist page renders, shows "Star Music Academy" | |
| 2A.5 | Navigate to `/platform/tenants` | Tenants list renders, shows all tenants | |

### 2B. Route Access

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2B.1 | Navigate to `/dashboard` | Dashboard renders | |
| 2B.2 | Navigate to `/calendar` | Calendar renders | |
| 2B.3 | Navigate to `/services` | Services page renders | |
| 2B.4 | Navigate to `/settings` | Settings page renders | |

---

## Test 3: Admin (`admin@bright.test`)

Log out, then log in as admin.

### 3A. Login & Sidebar

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3A.1 | Log in at `/login` | Redirect to `/dashboard` | |
| 3A.2 | Check sidebar titles | Custom titles: "Parents & Students", "Courses", "Tutors" | |
| 3A.3 | Check sidebar order | Dashboard → Calendar → Parents & Students → Courses → Tutors → Rooms → Invoicing → Booking → Settings | |
| 3A.4 | Platform section | **NOT visible** | |

### 3B. Route Access

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3B.1 | Navigate to `/platform/waitlist` | Blocked (redirect or 404) | |
| 3B.2 | Navigate to `/dashboard` | Dashboard renders with stats | |
| 3B.3 | Navigate to `/calendar` | Calendar renders with today's sessions | |
| 3B.4 | Navigate to `/services` | Services page shows 4 services | |
| 3B.5 | Navigate to `/clients` | Clients page shows 4 contacts | |
| 3B.6 | Navigate to `/team` | Team page shows 3 team members | |
| 3B.7 | Navigate to `/rooms` | Rooms page shows 3 rooms | |
| 3B.8 | Navigate to `/invoicing` | Invoicing page shows 2 invoices | |
| 3B.9 | Navigate to `/settings` | Settings page renders | |

### 3C. Dashboard

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3C.1 | View dashboard stats | Shows count cards (contacts, services, sessions, team) | |
| 3C.2 | Today's sessions | Shows 2 sessions (Sec 3 Math at 4pm, P5 Science at 4pm) | |

### 3D. Services Module

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3D.1 | View services list | Shows 4 services (3 recurring, 1 bookable) | |
| 3D.2 | Create a new service | Form works, row appears in table | |
| 3D.3 | Edit existing service | Form pre-fills, save updates row | |
| 3D.4 | Check color picker | Color dot shows next to service name | |

### 3E. Clients Module

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3E.1 | View contacts list | 4 contacts visible | |
| 3E.2 | Click "Charlie Client" | Detail panel opens with 2 dependents (Chloe, Calvin) | |
| 3E.3 | View notes tab | Shows 2 notes from Sam Staff | |
| 3E.4 | Add a new contact | Form works, row appears | |
| 3E.5 | Add a dependent | Dependent appears under contact | |

### 3F. Team Module

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3F.1 | View team list | 3 members: Sam Staff, Diana Lim, Ravi Kumar | |
| 3F.2 | Click Sam Staff | Detail shows availability (Mon-Fri 2-8pm) | |
| 3F.3 | View override | Shows "Medical appointment" next Monday | |
| 3F.4 | Invite new team member | Invitation form works | |

### 3G. Calendar Module

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3G.1 | View calendar (week view) | Today shows 2 sessions | |
| 3G.2 | Click a session | Session detail panel opens | |
| 3G.3 | View enrollments | Sec 3 Math shows 3 enrolled (Chloe, Jun Hao, Jia Yi) | |
| 3G.4 | Create recurring class | Form works, session generated | |
| 3G.5 | Create appointment | Appointment form works (Trial Lesson type) | |
| 3G.6 | Toggle color mode | Switch between "by service" and "by team member" | |

### 3H. Invoicing Module

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3H.1 | View invoices list | 2 invoices (1 sent, 1 paid) | |
| 3H.2 | Click INV-2026-0001 | Detail shows line items, $392.40 total, status "sent" | |
| 3H.3 | Create new invoice | Form works, line items can be added | |
| 3H.4 | Record payment | Payment recorded, status updates | |

### 3I. Settings Module

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3I.1 | View branding tab | Shows business name, accent color, logo upload | |
| 3I.2 | View modules tab | Shows all 9 modules with toggles and custom titles | |
| 3I.3 | Rename a module | Custom title updates, sidebar reflects change | |
| 3I.4 | Disable a module | Module disappears from sidebar | |
| 3I.5 | Reorder modules | Drag-and-drop changes sidebar order | |

### 3J. Rooms Module

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3J.1 | View rooms list | 3 rooms: Room A (10), Room B (8), Room C Lab (6) | |
| 3J.2 | Create a room | Form works, row appears | |
| 3J.3 | Edit room capacity | Capacity updates | |

---

## Test 4: Staff (`staff@bright.test`)

Log out, then log in as staff.

### 4A. Login & Navigation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4A.1 | Log in at `/login` | Redirect to `/dashboard` | |
| 4A.2 | Check sidebar | Fewer items than admin (no Settings, no Invoicing management) | |

### 4B. Dashboard

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4B.1 | View dashboard | Shows today's sessions assigned to Sam Staff | |
| 4B.2 | Stats | Shows relevant counts | |

### 4C. Calendar

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4C.1 | View calendar | Shows sessions (may be filtered to own assignments) | |
| 4C.2 | View session detail | Can see enrolled students | |
| 4C.3 | Mark attendance | Can update enrollment status (attended/no_show) | |

### 4D. Route Access (Blocked)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4D.1 | Navigate to `/settings` | Blocked or limited view | |
| 4D.2 | Navigate to `/platform` | Blocked | |

---

## Test 5: Client (`client@bright.test`)

Log out, then log in as client.

### 5A. Login & Navigation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5A.1 | Log in at `/login` | Redirect to `/dashboard` | |
| 5A.2 | Check sidebar | Minimal — dashboard + possibly invoicing (view own) | |

### 5B. Dashboard

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5B.1 | View dashboard | Shows own upcoming sessions | |
| 5B.2 | See children's classes | Chloe in Sec 3 Math today, Calvin in P5 Science today | |

### 5C. Invoicing (Own Invoices)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5C.1 | View invoices | Shows 2 invoices (INV-2026-0001 sent, INV-2026-0002 paid) | |
| 5C.2 | Click invoice | Can view details but cannot edit or create | |

### 5D. Route Access (Blocked)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5D.1 | Navigate to `/services` | Blocked | |
| 5D.2 | Navigate to `/team` | Blocked | |
| 5D.3 | Navigate to `/settings` | Blocked | |
| 5D.4 | Navigate to `/platform` | Blocked | |

---

## Test 6: Public Booking (`/book/bright-learning`)

Test while **logged out** (incognito).

| # | Action | Expected | Pass? |
|---|---|---|---|
| 6.1 | Navigate to `/book/bright-learning` | Booking page renders with "Bright Learning Hub" heading | |
| 6.2 | Step 1: View services | Shows bookable services (Trial Lesson) | |
| 6.3 | Select "Trial Lesson" | Advances to team member selection | |
| 6.4 | Select team member or "Any available" | Advances to date picker | |
| 6.5 | Pick a date | Available time slots appear | |
| 6.6 | Pick a slot | Advances to confirmation form | |
| 6.7 | Enter name + phone | Submit works | |
| 6.8 | Booking confirmed | Green confirmation screen | |
| 6.9 | Navigate to `/book/zen-yoga` | Zen Yoga booking page renders | |
| 6.10 | Navigate to `/book/nonexistent` | 404 | |

---

## Test 7: Module Guard

Test that disabled modules are properly blocked.

### Setup
Log in as `admin@zen.test` (Zen Yoga Studio — rooms and invoicing disabled).

| # | Action | Expected | Pass? |
|---|---|---|---|
| 7.1 | Check sidebar | No "Rooms" or "Invoicing" tabs | |
| 7.2 | Navigate to `/rooms` | 404 or "Module not enabled" page | |
| 7.3 | Navigate to `/invoicing` | 404 or "Module not enabled" page | |
| 7.4 | Navigate to `/calendar` | Calendar renders (enabled) | |
| 7.5 | Check custom titles | "Members" instead of "Clients", "Classes & Sessions" instead of "Services", "Instructors" instead of "Team" | |

---

## Test 8: Tenant Isolation

Verify data doesn't leak between tenants.

| # | Action | Expected | Pass? |
|---|---|---|---|
| 8.1 | As `admin@bright.test`, view contacts | Only Bright contacts (4), no Zen contacts | |
| 8.2 | As `admin@bright.test`, view services | Only Bright services (4), no Zen services | |
| 8.3 | As `admin@bright.test`, view team | Only Bright team (3), no Zen instructors | |
| 8.4 | As `admin@zen.test`, view contacts | Only Zen contacts (2), no Bright contacts | |
| 8.5 | As `admin@zen.test`, view services | Only Zen services (3), no Bright services | |
| 8.6 | As `admin@zen.test`, view calendar | Only Zen sessions, no Bright sessions | |

---

## Test 9: Onboarding Flow

Test the new tenant onboarding wizard.

### Setup
This requires a fresh admin account that hasn't completed onboarding. Either:
- Approve a waitlist entry as super_admin, or
- Create a new tenant manually and mark onboarding incomplete

| # | Action | Expected | Pass? |
|---|---|---|---|
| 9.1 | First login → `/onboarding` | Step 1: Template picker renders | |
| 9.2 | Select "Tuition Centre" template | Pre-fills modules with education-style titles | |
| 9.3 | Click "Build Your Own" instead | Shows all modules with toggles | |
| 9.4 | Step 2: Customize modules | Can toggle, rename, reorder modules | |
| 9.5 | Step 3: Add branding | Logo upload, business name, accent color fields | |
| 9.6 | Complete onboarding | Redirect to `/dashboard` | |
| 9.7 | Sidebar reflects choices | Custom titles and enabled modules match selections | |

---

## Test 10: Invitation Flow

| # | Action | Expected | Pass? |
|---|---|---|---|
| 10.1 | As admin, go to Team, invite `newstaff@test.com` as staff | Invitation row appears with "Pending" status | |
| 10.2 | Check Inbucket (`http://127.0.0.1:54324/`) | Email received with "Accept Invitation" link | |
| 10.3 | Open invite link in incognito | Invite acceptance page renders | |
| 10.4 | Set password and submit | Account created, redirected to `/login` | |
| 10.5 | Log in as new staff member | Redirect to `/dashboard` | |
| 10.6 | Check sidebar | Staff-level access (not admin) | |

---

## Quick Reference: Access Matrix

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

**Note:** Module-level access also depends on whether the module is enabled for the tenant. A route for a disabled module returns 404 regardless of role.
