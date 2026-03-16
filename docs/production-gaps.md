# Production Gap Analysis

What's left to do before bringing Plio to production, based on a full audit of the spec (`Plio.md`), deployment docs, workflows, and the actual codebase.

Last updated: 2026-03-12

---

## What's Done (Core Platform)

- Onboarding wizard (templates, module config, branding)
- All 9 module pages (dashboard, calendar, clients, services, team, rooms, invoicing, booking, settings)
- Multi-tenant RLS with 48+ policies across 12 tables
- Module system with custom titles, drag-drop reorder, enable/disable
- Calendar with FullCalendar (recurring classes, appointments, drag-drop rescheduling, conflict detection)
- Public booking page (`/book/[slug]`)
- Enrollment management with attendance tracking
- Parent portal (dashboard, schedule, attendance history, makeup booking, credit ledger)
- Tutor portal (schedule, attendance marking)
- Role-based access control (super_admin, admin, staff, client)
- Platform admin (waitlist approval with email, tenant management, tenant enable/disable)
- Invitation flow with email (Resend + SMTP fallback)
- Settings page (branding, modules)
- Email system (3 templates: invite, waitlist approved, waitlist rejected)

---

## Critical (Must Fix Before Production)

### 1. Logo Upload — Supabase Storage Integration

**Current state:** Logo field in settings is a text input (URL paste). Code says "Full upload support coming soon."

**What's needed:**
- Create `tenant-assets` storage bucket in Supabase (public, with authenticated upload policy)
- Add file upload handler in settings branding form
- Handle file size validation, image type checking
- Store the public URL in tenant settings

**Files:** `apps/web/components/settings/branding-form.tsx`, `apps/web/app/(dashboard)/settings/actions.ts`

### 2. Environment Variables

**What's needed:**
- Set `NEXT_PUBLIC_APP_URL` to production domain (invite emails currently contain `localhost:3000` links)
- Set `RESEND_API_KEY` for production email sending
- Set `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Generate and set `CHECKIN_SECRET` for QR check-in token HMAC

### 3. Error Tracking

**Current state:** No monitoring. Errors in production will be invisible.

**What's needed:**
- Add Sentry Next.js SDK (or equivalent)
- Configure source maps upload for readable stack traces
- Set up error alerts

### 4. Service Worker / PWA

**Current state:** `manifest.json` exists in `apps/web/public/` but there is no service worker, no `next-pwa` package, no offline support.

**What the spec says:** PWA with service worker caching static assets, network-first strategy for API calls, install prompt on mobile after second visit.

**What's needed:**
- Add `next-pwa` or `@serwist/next` package
- Configure service worker with cache strategies
- Add install prompt component for mobile clients
- Make manifest dynamic per-tenant (spec says served at `/api/manifest` with tenant branding)

---

## Important (Spec Says It Should Exist)

### 5. Real-Time Notifications

**Current state:** `notifications` table exists with RLS policies. `notification-store.ts` is a stub. No Supabase Realtime subscriptions anywhere. No in-app notification UI (bell icon, dropdown, etc.).

**What the spec says:** In-app and email notification records with realtime delivery.

**What's needed:**
- Notification bell UI in header with unread count
- Supabase Realtime subscription for new notifications
- Server actions to create notifications on key events (new booking, invoice paid, session cancelled, etc.)
- Mark as read functionality

**Verdict:** Can defer to post-launch. Not blocking core workflows.

### 6. Audit Log

**Current state:** `audit_log` table exists with proper schema (actor_id, action, entity_type, entity_id, metadata JSONB). Zero server actions write to it.

**What's needed:**
- Create a reusable `logAudit(action, entityType, entityId, metadata)` helper
- Instrument key server actions: create/update/delete for contacts, services, schedules, sessions, invoices, team members, enrollments
- Add an audit log viewer page (probably under `/settings` or `/platform`)

**Verdict:** Important for compliance and debugging. Medium effort.

### 7. Payment Gateway Integration

**Current state:** `payments` table supports methods (paynow, cash, bank_transfer, card) but payments are manually recorded via the invoicing page. No Stripe or PayNow API integration.

**What's needed for MVP:**
- Nothing — manual recording works for launch
- Stripe integration can come later as a Phase 2 feature

**What's needed for full spec:**
- Stripe SDK integration for card payments
- PayNow QR code generation for Singapore payments
- Webhook handler for payment confirmation
- Auto-update invoice status on successful payment

**Verdict:** Manual payment recording is fine for launch. Automate later.

### 8. Contact Notes (Spec Mismatch)

**Current state:** Contacts have a single `notes` text field. The spec defines a `contact_notes` table with timestamped entries, author tracking (`author_id` FK to profiles), and per-note content.

**What's needed:**
- Verify if `contact_notes` table exists in migrations (migration 00025 should have created it)
- Build notes tab in client detail panel showing chronological note history
- Add note creation form with author auto-populated from current user
- Display author name and timestamp per note

**Verdict:** Important for multi-staff businesses where note history matters.

---

## Nice to Have (Polish)

### 9. Tutor Portal — Enrollment Management

**Current state:** Tutor can view schedule and mark attendance. Cannot manage enrollments (add/remove students) from their view.

**What's needed:** Add enrollment list and add/remove UI to tutor class detail page.

### 10. QR Code Camera Scanning

**Current state:** Tutor check-in page says "camera scanning coming soon." Only supports manual token entry.

**What's needed:** Integrate a camera-based QR scanner library (e.g., `html5-qrcode` or `@zxing/browser`).

### 11. Booking Confirmation Email

**What the spec says:** Email sent via Resend after public booking confirmation.

**What's needed:** Verify if a booking confirmation email template exists and is triggered. If not, create one in `packages/email/src/templates/` and send it from the booking server action.

### 12. Dynamic PWA Manifest

**Current state:** Static `manifest.json` with hardcoded app name and colors.

**What the spec says:** Dynamic manifest generated per tenant from branding settings (business_name, accent_color, logo_url), served at `/api/manifest`.

**What's needed:** Create an API route that reads tenant settings and returns a customized manifest.

---

## Production Infrastructure Checklist

These are operational tasks, not code changes.

- [ ] Create Supabase Cloud project (region: Southeast Asia / Singapore)
- [ ] Run `supabase link --project-ref <ref> && supabase db push`
- [ ] Create `tenant-assets` storage bucket (public, authenticated upload policy)
- [ ] Create real super_admin user via Supabase Dashboard (do NOT run `seed.sql`)
- [ ] Sign up for Resend, verify sending domain, get API key
- [ ] Deploy to Vercel (or alternative host)
- [ ] Set all environment variables in hosting platform:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL` (production domain, not localhost)
  - `RESEND_API_KEY`
  - `CHECKIN_SECRET`
- [ ] Purchase and configure domain
- [ ] Point DNS to hosting provider
- [ ] Update Supabase Auth settings (Site URL + Redirect URLs to production domain)
- [ ] Update `from` address in `packages/email/src/send.ts` if not using `noreply@plio.app`

### Post-Deploy Verification

- [ ] Test login/signup flow
- [ ] Test invite email sends and links resolve correctly
- [ ] Test logo upload (once storage bucket is set up)
- [ ] Test public booking flow end-to-end
- [ ] Test QR check-in token generation
- [ ] Verify tenant isolation (log in as two different tenants, confirm no data leakage)
- [ ] Test waitlist approval → email → onboarding flow

---

## Recommended Priority Order

| Priority | Item | Effort | Blocking Launch? |
|----------|------|--------|------------------|
| 1 | Logo upload (Supabase Storage) | Medium | Yes — onboarding asks for it |
| 2 | Error tracking (Sentry) | Small | Yes — blind without it |
| 3 | Contact notes (per-spec implementation) | Medium | No |
| 4 | Audit logging | Medium | No |
| 5 | Service worker + PWA | Medium | No |
| 6 | Production infra setup | Config | Yes |
| 7 | Booking confirmation email | Small | No |
| 8 | Dynamic PWA manifest | Small | No |
| 9 | Notifications (realtime) | Large | No — defer to post-launch |
| 10 | Payment integration (Stripe) | Large | No — manual entry works |

---

## Phase 2+ (Explicitly Future Work)

These are documented in the spec as future features, not blocking production:

- Stripe/PayNow payment automation
- Analytics & reporting dashboards
- Multi-location support
- AI scheduling suggestions
- Per-service waitlist UI (table supports it, no UI)
- Native mobile app
- Full offline PWA with background sync
