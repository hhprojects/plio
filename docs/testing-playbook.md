# Role-Based Testing Playbook

Manual testing checklist for verifying that each role (super_admin, admin, tutor, parent) has correct access throughout the app.

## Prerequisites

1. Local Supabase running (`supabase start`)
2. Dev server running (`pnpm --filter web dev`)
3. Run `supabase db reset` for a clean slate (applies migrations + seed)
4. Run the SQL below in Supabase Studio SQL Editor (`http://127.0.0.1:54323`) to create all test accounts

## Test Account Setup

Run this SQL after `supabase db reset`. It creates:
- "Bright Tuition" tenant — education mode, 4 roles (admin, tutor, parent, super_admin)
- "Serenity Spa" tenant — wellness mode, wellness admin + practitioner with auth accounts

```sql
-- ============================================================
-- 1. Create the business tenant
-- ============================================================
INSERT INTO public.tenants (id, name, slug, subscription_tier, settings)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Bright Tuition',
  'bright-tuition',
  'pro',
  '{"timezone": "Asia/Singapore", "currency": "SGD"}'::jsonb
);

-- ============================================================
-- 2. Helper: create auth user function
-- ============================================================
-- (Using direct inserts like the existing seed.sql)

-- ADMIN user: admin@bright.test / password123
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000000',
  'admin@bright.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "aaaaaaaa-0000-0000-0000-000000000001", "role": "admin", "full_name": "Alice Admin"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000010',
  'aaaaaaaa-0000-0000-0000-000000000010',
  jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000010', 'email', 'admin@bright.test'),
  'email', 'aaaaaaaa-0000-0000-0000-000000000010', now(), now(), now()
);

-- TUTOR user: tutor@bright.test / password123
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000000',
  'tutor@bright.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "aaaaaaaa-0000-0000-0000-000000000001", "role": "tutor", "full_name": "Tom Tutor"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000020',
  'aaaaaaaa-0000-0000-0000-000000000020',
  jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000020', 'email', 'tutor@bright.test'),
  'email', 'aaaaaaaa-0000-0000-0000-000000000020', now(), now(), now()
);

-- PARENT user: parent@bright.test / password123
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000000',
  'parent@bright.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "aaaaaaaa-0000-0000-0000-000000000001", "role": "parent", "full_name": "Patty Parent"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000030',
  'aaaaaaaa-0000-0000-0000-000000000030',
  jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000030', 'email', 'parent@bright.test'),
  'email', 'aaaaaaaa-0000-0000-0000-000000000030', now(), now(), now()
);

-- ============================================================
-- 3. Sample data: course, room, class, student, enrollment
-- ============================================================

-- Get the tutor's profile ID (created by trigger)
-- It should be in profiles with user_id = 'aaaaaaaa-0000-0000-0000-000000000020'

-- Course
INSERT INTO public.courses (id, tenant_id, title, description, default_price, color_code, max_capacity)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000100',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Sec 3 Math',
  'Secondary 3 Mathematics',
  50.00,
  '#6366f1',
  8
);

-- Room
INSERT INTO public.rooms (id, tenant_id, name, capacity)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000200',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Room A',
  10
);

-- Class instance for today, assigned to tutor
INSERT INTO public.class_instances (id, course_id, tenant_id, date, start_time, end_time, tutor_id, room_id, status, max_capacity)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000300',
  'aaaaaaaa-0000-0000-0000-000000000100',
  'aaaaaaaa-0000-0000-0000-000000000001',
  CURRENT_DATE,
  '14:00',
  '16:00',
  (SELECT id FROM profiles WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000020'),
  'aaaaaaaa-0000-0000-0000-000000000200',
  'scheduled',
  8
);

-- Student (child of parent)
INSERT INTO public.students (id, tenant_id, parent_id, full_name, level)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000400',
  'aaaaaaaa-0000-0000-0000-000000000001',
  (SELECT id FROM profiles WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000030'),
  'Sam Student',
  'Sec 3'
);

-- Enrollment
INSERT INTO public.enrollments (id, student_id, class_instance_id, tenant_id, status)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000500',
  'aaaaaaaa-0000-0000-0000-000000000400',
  'aaaaaaaa-0000-0000-0000-000000000300',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'confirmed'
);

-- ============================================================
-- WELLNESS TEST DATA: Serenity Spa
-- ============================================================

-- Wellness tenant
INSERT INTO public.tenants (id, name, slug, subscription_tier, business_type, settings)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'Serenity Spa',
  'serenity-spa',
  'pro',
  'wellness',
  '{"timezone": "Asia/Singapore", "currency": "SGD", "default_buffer_minutes": 15, "slot_interval_minutes": 15, "cancellation_window_hours": 4}'::jsonb
);

-- WELLNESS ADMIN user: admin@serenity.test / password123
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000000',
  'admin@serenity.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "bbbbbbbb-0000-0000-0000-000000000001", "role": "admin", "full_name": "Wendy Wellness"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000010',
  'bbbbbbbb-0000-0000-0000-000000000010',
  jsonb_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000010', 'email', 'admin@serenity.test'),
  'email', 'bbbbbbbb-0000-0000-0000-000000000010', now(), now(), now()
);

-- PRACTITIONER user: practitioner@serenity.test / password123
-- The handle_new_user trigger will auto-create the profile with role='practitioner'
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000000',
  'practitioner@serenity.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "bbbbbbbb-0000-0000-0000-000000000001", "role": "practitioner", "full_name": "Pete Practitioner"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000020',
  'bbbbbbbb-0000-0000-0000-000000000020',
  jsonb_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000020', 'email', 'practitioner@serenity.test'),
  'email', 'bbbbbbbb-0000-0000-0000-000000000020', now(), now(), now()
);

-- A service for the Serenity Spa
INSERT INTO public.services (id, tenant_id, title, category, duration_minutes, price, color_code, is_active)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000100',
  'bbbbbbbb-0000-0000-0000-000000000001',
  '60-min Relaxation Massage',
  'Massage',
  60,
  100.00,
  '#6366f1',
  true
);

-- Practitioner availability: Mon-Fri 9-6
-- Profile id is auto-created by the trigger from the auth.users insert above
INSERT INTO public.practitioner_availability (tenant_id, practitioner_id, day_of_week, start_time, end_time)
SELECT
  'bbbbbbbb-0000-0000-0000-000000000001',
  p.id,
  d,
  '09:00',
  '18:00'
FROM public.profiles p, generate_series(1, 5) AS d
WHERE p.user_id = 'bbbbbbbb-0000-0000-0000-000000000020';
```

## Test Accounts

| Role | Email | Password | Landing page | Tenant |
|---|---|---|---|---|
| super_admin | `admin@plio.dev` | `password123` | `/admin` | Plio Platform |
| admin (education) | `admin@bright.test` | `password123` | `/admin` | Bright Tuition |
| tutor | `tutor@bright.test` | `password123` | `/tutor/schedule` | Bright Tuition |
| parent | `parent@bright.test` | `password123` | `/parent/dashboard` | Bright Tuition |
| admin (wellness) | `admin@serenity.test` | `password123` | `/admin` | Serenity Spa |
| admin (wellness, seed) | `admin@glow.dev` | `password123` | `/admin` | Glow Wellness Clinic |
| practitioner | `practitioner@serenity.test` | `password123` | `/practitioner/schedule` | Serenity Spa |

---

## Test 1: Unauthenticated Access

Test while logged out (use incognito or clear cookies).

| # | Action | Expected | Pass? |
|---|---|---|---|
| 1.1 | Navigate to `/admin` | Redirect to `/login` | |
| 1.2 | Navigate to `/tutor/schedule` | Redirect to `/login` | |
| 1.3 | Navigate to `/parent/dashboard` | Redirect to `/login` | |
| 1.4 | Navigate to `/admin/students` | Redirect to `/login` | |
| 1.5 | Navigate to `/login` | Login page renders | |
| 1.6 | Navigate to `/register` | Registration page renders | |
| 1.7 | Navigate to `/` | Landing page renders | |

---

## Test 2: Super Admin (`admin@plio.dev`)

Log in as super_admin.

### 2A. Login & Redirect

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2A.1 | Log in at `/login` | Redirect to `/admin` | |
| 2A.2 | Navigate to `/` | Redirect to `/admin` | |
| 2A.3 | Navigate to `/login` while logged in | Redirect to `/admin` | |

### 2B. Sidebar & Navigation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2B.1 | Check sidebar tabs | All 8 tabs visible: Calendar, Students, Tutors, Rooms, Courses, Schedules, Scan, Team | |
| 2B.2 | Check Platform section | "Platform" section visible with Waitlist tab | |
| 2B.3 | Check bottom nav | Settings tab visible | |

### 2C. Route Access

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2C.1 | Navigate to `/admin/platform/waitlist` | Waitlist page renders | |
| 2C.2 | Navigate to `/admin/students` | Students page renders | |
| 2C.3 | Navigate to `/admin/team` | Team page renders | |
| 2C.4 | Navigate to `/tutor/schedule` | Redirect to `/admin` (blocked) | |
| 2C.5 | Navigate to `/parent/dashboard` | Redirect to `/admin` (blocked) | |

### 2D. Feature Tests

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2D.1 | View Waitlist page | Can see pending waitlist entries | |
| 2D.2 | Create a student | Student form works, row appears | |
| 2D.3 | Create a course | Course form works, row appears | |
| 2D.4 | Create a room | Room form works, row appears | |
| 2D.5 | Send a team invite | Invitation created, email appears in Inbucket | |

---

## Test 3: Admin (`admin@bright.test`)

Log out, then log in as admin.

### 3A. Login & Redirect

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3A.1 | Log in at `/login` | Redirect to `/admin` | |
| 3A.2 | Navigate to `/` | Redirect to `/admin` | |

### 3B. Sidebar & Navigation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3B.1 | Check sidebar tabs | All 8 main tabs visible | |
| 3B.2 | Check Platform section | **NOT visible** (no Waitlist tab) | |
| 3B.3 | Check bottom nav | Settings tab visible | |

### 3C. Route Access

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3C.1 | Navigate to `/admin/platform/waitlist` | Redirect to `/admin` (blocked by platform layout guard) | |
| 3C.2 | Navigate to `/admin/students` | Students page renders | |
| 3C.3 | Navigate to `/tutor/schedule` | Redirect to `/admin` (blocked) | |
| 3C.4 | Navigate to `/parent/dashboard` | Redirect to `/admin` (blocked) | |

### 3D. Feature Tests

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3D.1 | View Students page | See "Sam Student" | |
| 3D.2 | Create a new student | Form works, row appears | |
| 3D.3 | View Courses page | See "Sec 3 Math" | |
| 3D.4 | View Rooms page | See "Room A" | |
| 3D.5 | View Team page | Can send invitations | |
| 3D.6 | View Calendar | See today's class on the calendar | |

### 3E. Tenant Isolation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3E.1 | Check Students page | Only shows students from "Bright Tuition", not "Plio Platform" tenant | |
| 3E.2 | Check Courses page | Only shows courses from "Bright Tuition" | |
| 3E.3 | Check Team page | Only shows profiles from "Bright Tuition" | |

---

## Test 4: Tutor (`tutor@bright.test`)

Log out, then log in as tutor.

### 4A. Login & Redirect

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4A.1 | Log in at `/login` | Redirect to `/tutor/schedule` | |
| 4A.2 | Navigate to `/` | Redirect to `/tutor/schedule` | |
| 4A.3 | Navigate to `/login` while logged in | Redirect to `/tutor/schedule` | |

### 4B. Navigation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4B.1 | Check bottom nav | 2 tabs: Schedule, Scan | |
| 4B.2 | Check header | Shows "Plio" logo and tutor name "Tom Tutor" | |

### 4C. Route Access (Blocked Routes)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4C.1 | Navigate to `/admin` | Redirect to `/tutor/schedule` | |
| 4C.2 | Navigate to `/admin/students` | Redirect to `/tutor/schedule` | |
| 4C.3 | Navigate to `/admin/team` | Redirect to `/tutor/schedule` | |
| 4C.4 | Navigate to `/admin/courses` | Redirect to `/tutor/schedule` | |
| 4C.5 | Navigate to `/admin/rooms` | Redirect to `/tutor/schedule` | |
| 4C.6 | Navigate to `/admin/schedules` | Redirect to `/tutor/schedule` | |
| 4C.7 | Navigate to `/admin/platform/waitlist` | Redirect to `/tutor/schedule` | |
| 4C.8 | Navigate to `/parent/dashboard` | Redirect to `/tutor/schedule` | |

### 4D. Feature Tests — Schedule

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4D.1 | View schedule page | Shows "Today" with today's class card | |
| 4D.2 | Check class card | Shows "Sec 3 Math", time "2:00 PM - 4:00 PM", "Room A", "1/8" | |
| 4D.3 | Navigate to previous day | Shows different date, possibly "No classes scheduled" | |
| 4D.4 | Navigate to next day | Returns to today or shows next day | |
| 4D.5 | Tap class card | Navigates to `/tutor/classes/<id>` | |

### 4E. Feature Tests — Class Detail & Attendance

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4E.1 | View class detail | Shows "Sec 3 Math" header with date, time, room | |
| 4E.2 | See student list | Shows "Sam Student" with status "confirmed" | |
| 4E.3 | Tap check mark on Sam | Status changes to "Present", toast "Marked as attended" | |
| 4E.4 | Tap X on Sam | Status changes to "Absent", toast "Marked as absent" | |
| 4E.5 | Tap "Back to schedule" | Returns to `/tutor/schedule` | |
| 4E.6 | Check attendance count | Header shows updated count (e.g. "1/1 attended") | |

### 4F. Feature Tests — Scan

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4F.1 | Navigate to Scan tab | Scan page renders with token input | |
| 4F.2 | Enter invalid token | Error: "Invalid token format" | |
| 4F.3 | Enter valid check-in token | Success: shows student name and course | |

---

## Test 5: Parent (`parent@bright.test`)

Log out, then log in as parent.

### 5A. Login & Redirect

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5A.1 | Log in at `/login` | Redirect to `/parent/dashboard` | |
| 5A.2 | Navigate to `/` | Redirect to `/parent/dashboard` | |

### 5B. Route Access (Blocked Routes)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5B.1 | Navigate to `/admin` | Redirect to `/parent/dashboard` | |
| 5B.2 | Navigate to `/admin/students` | Redirect to `/parent/dashboard` | |
| 5B.3 | Navigate to `/admin/team` | Redirect to `/parent/dashboard` | |
| 5B.4 | Navigate to `/tutor/schedule` | Redirect to `/parent/dashboard` | |
| 5B.5 | Navigate to `/tutor/scan` | Redirect to `/parent/dashboard` | |

### 5C. Feature Tests

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5C.1 | View Dashboard | Shows next class card, child info | |
| 5C.2 | View Schedule | Shows enrolled classes for children | |
| 5C.3 | View Check-in | Can generate QR code for today's enrollment | |
| 5C.4 | View Attendance | Shows attendance history | |
| 5C.5 | View Fees | Shows fee/invoice information | |

---

## Test 6: Wellness Admin (`admin@serenity.test`)

Log out, then log in as wellness admin.

### 6A. Login & Redirect

| # | Action | Expected | Pass? |
|---|---|---|---|
| 6A.1 | Log in at `/login` | Redirect to `/admin` | |
| 6A.2 | Navigate to `/` | Redirect to `/admin` | |

### 6B. Sidebar

| # | Action | Expected | Pass? |
|---|---|---|---|
| 6B.1 | Check sidebar tabs | Wellness nav: Appointments, Clients, Services, Practitioners, Rooms, Team, Settings, Invoices | |
| 6B.2 | Education tabs **not** visible | No Students, Courses, Tutors, Schedules, Calendar, Scan | |

### 6C. Wellness Route Access

| # | Action | Expected | Pass? |
|---|---|---|---|
| 6C.1 | Navigate to `/admin/appointments` | Appointments page renders with calendar + list toggle | |
| 6C.2 | Navigate to `/admin/clients` | Clients page renders | |
| 6C.3 | Navigate to `/admin/services` | Services page renders | |
| 6C.4 | Navigate to `/admin/practitioners` | Practitioners page renders | |
| 6C.5 | Navigate to `/admin/settings` | Settings page with buffer/slot interval controls | |
| 6C.6 | Navigate to `/tutor/schedule` | Redirect to `/admin` (blocked) | |
| 6C.7 | Navigate to `/practitioner/schedule` | Redirect to `/admin` (blocked) | |

### 6D. Feature Tests

| # | Action | Expected | Pass? |
|---|---|---|---|
| 6D.1 | View Services page | Empty (no services created yet for Serenity Spa) | |
| 6D.2 | Create a service "Deep Tissue Massage", 60min, $100 | Row appears in table | |
| 6D.3 | View Practitioners page | Shows "Pete Practitioner" (invited user) | |
| 6D.4 | Click Pete's row → detail sheet | Shows weekly availability grid | |
| 6D.5 | View Clients page | Empty initially | |
| 6D.6 | Create a client "Test Client", phone "91234567" | Row appears | |
| 6D.7 | View Appointments page | Calendar view, no appointments yet | |
| 6D.8 | Click "New Appointment" → book flow | 6-step dialog: client → service → practitioner → date → slot → confirm | |
| 6D.9 | Complete booking flow | Appointment appears on calendar in indigo | |

### 6E. Tenant Isolation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 6E.1 | View Clients | Only Serenity Spa clients (not Glow Wellness or Bright Tuition) | |
| 6E.2 | View Services | Only Serenity Spa services | |

---

## Test 7: Practitioner (`practitioner@serenity.test`)

Log out, then log in as practitioner.

### 7A. Login & Redirect

| # | Action | Expected | Pass? |
|---|---|---|---|
| 7A.1 | Log in at `/login` | Redirect to `/practitioner/schedule` (via `/practitioner/dashboard`) | |
| 7A.2 | Navigate to `/` | Redirect to `/practitioner/schedule` | |

### 7B. Navigation

| # | Action | Expected | Pass? |
|---|---|---|---|
| 7B.1 | Check bottom nav | 2 tabs: Schedule (calendar icon), Availability (clock icon) | |
| 7B.2 | Check header | Shows "Plio" logo and practitioner name "Pete Practitioner" | |

### 7C. Route Access (Blocked Routes)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 7C.1 | Navigate to `/admin` | Redirect to `/practitioner/dashboard` | |
| 7C.2 | Navigate to `/admin/appointments` | Redirect to `/practitioner/dashboard` | |
| 7C.3 | Navigate to `/tutor/schedule` | Redirect to `/practitioner/dashboard` | |
| 7C.4 | Navigate to `/parent/dashboard` | Redirect to `/practitioner/dashboard` | |

### 7D. Feature Tests — Schedule

| # | Action | Expected | Pass? |
|---|---|---|---|
| 7D.1 | View schedule page | Shows "Today" with date navigation buttons | |
| 7D.2 | Day with no appointments | Shows "No appointments scheduled" + "Try navigating to another day" | |
| 7D.3 | Navigate to a day with an appointment | Appointment card shows: service title, time, client name, status | |
| 7D.4 | Tap appointment card | Navigates to `/practitioner/appointments/<id>` | |

### 7E. Feature Tests — Appointment Detail

| # | Action | Expected | Pass? |
|---|---|---|---|
| 7E.1 | View appointment detail | Shows: service, date, time, client info, status | |
| 7E.2 | Status is "confirmed" | Mark Complete, No-Show, Cancel buttons visible | |
| 7E.3 | Click "Mark Complete" | Status updates to "completed", action buttons disappear | |
| 7E.4 | Client notes section visible | Add note textarea + submit button | |
| 7E.5 | Add a note | Note appears in list with practitioner name and date | |
| 7E.6 | Tap "Back to schedule" button | Returns to `/practitioner/schedule` | |

### 7F. Feature Tests — Availability

| # | Action | Expected | Pass? |
|---|---|---|---|
| 7F.1 | Navigate to Availability tab | Shows weekly schedule grid (Mon-Sun) and overrides section | |
| 7F.2 | Weekly schedule pre-populated | Mon-Fri shows 09:00-18:00 (from seed), Sat/Sun show "Off" | |
| 7F.3 | Uncheck Wednesday | Wednesday row collapses to "Off" | |
| 7F.4 | Click "Save Availability" | Toast "Availability saved" | |
| 7F.5 | Add override (date override, block full day) | Override appears in list with "Blocked" badge | |
| 7F.6 | Delete the override | Override removed from list | |

---

## Test 8: Public Booking Page

Test while **logged out** (use incognito or clear cookies).

| # | Action | Expected | Pass? |
|---|---|---|---|
| 8.1 | Navigate to `/book/glow-wellness` | Booking page renders with "Glow Wellness Clinic" heading, no login required | |
| 8.2 | Navigate to `/book/nonexistent-slug` | 404 Not Found page | |
| 8.3 | Navigate to `/book/bright-tuition` (education tenant) | 404 (only wellness tenants are bookable) | |
| 8.4 | Step 1: View services | Services grouped by category (Massage, TCM, Physiotherapy) shown as cards | |
| 8.5 | Select "60-min Deep Tissue Massage" | Advances to Step 2 | |
| 8.6 | Step 2: Practitioner selection | Shows "Any available" + Dr. Sarah Chen, Marcus Tan, Lisa Wong | |
| 8.7 | Select "Any available" | Advances to Step 3 | |
| 8.8 | Step 3: Pick a date within 14 days (a weekday) | Available time slots appear as chip buttons (e.g. "9:00 AM", "9:15 AM"…) | |
| 8.9 | Pick a slot | Advances to Step 4 | |
| 8.10 | Step 4: Confirmation form | Shows summary (service, practitioner, date, time, price) + name/phone/email fields | |
| 8.11 | Submit with Name + Phone only | Booking confirmed, green checkmark screen with appointment details | |
| 8.12 | Click "Book Another" | Resets to Step 1 | |
| 8.13 | Attempt double-booking same slot (two tabs) | Second submission shows "This time slot is no longer available" error | |

---

## Test 9: Cross-Role Data Isolation

These tests verify that RLS policies prevent data leakage between roles.

| # | Action | Expected | Pass? |
|---|---|---|---|
| 9.1 | As tutor, check schedule | Only sees classes assigned to "Tom Tutor", not other tutors' classes | |
| 9.2 | As tutor, open class detail | Only sees students enrolled in their own classes | |
| 9.3 | As parent, check dashboard | Only sees their own children, not other parents' children | |
| 9.4 | As admin (Bright Tuition), check students | Only sees Bright Tuition students, not Plio Platform data | |
| 9.5 | As super_admin, access Waitlist | Can see waitlist entries (admin cannot) | |
| 9.6 | As wellness admin (Serenity Spa), check clients | Only sees Serenity Spa clients, not Glow Wellness clients | |
| 9.7 | As practitioner (Serenity Spa), view schedule | Only sees own appointments, not other practitioners' | |

---

## Test 10: Invitation Flow (E2E)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 10.1 | As admin, go to Team, invite `newtutor@test.com` as tutor | Invitation row appears with "Pending" status | |
| 10.2 | Check Inbucket (`http://127.0.0.1:54324/`) | Email received with "Accept Invitation" link | |
| 10.3 | Open invite link in incognito | Invite acceptance page renders with pre-filled email and role | |
| 10.4 | Set password and submit | Account created, redirected to `/login` | |
| 10.5 | Log in as new tutor | Redirect to `/tutor/schedule` | |
| 10.6 | Navigate to `/admin` | Redirect to `/tutor/schedule` (blocked) | |

---

## Quick Reference: Expected Access Matrix

| Route | super_admin | admin | tutor | parent | practitioner | public |
|---|---|---|---|---|---|---|
| `/admin` | Yes | Yes | Blocked | Blocked | Blocked | → `/login` |
| `/admin/platform/waitlist` | Yes | Blocked | Blocked | Blocked | Blocked | → `/login` |
| `/admin/students` | Yes | Yes | Blocked | Blocked | Blocked | → `/login` |
| `/admin/appointments` | Yes | Yes | Blocked | Blocked | Blocked | → `/login` |
| `/admin/clients` | Yes | Yes | Blocked | Blocked | Blocked | → `/login` |
| `/admin/services` | Yes | Yes | Blocked | Blocked | Blocked | → `/login` |
| `/admin/practitioners` | Yes | Yes | Blocked | Blocked | Blocked | → `/login` |
| `/admin/settings` | Yes | Yes | Blocked | Blocked | Blocked | → `/login` |
| `/admin/team` | Yes | Yes | Blocked | Blocked | Blocked | → `/login` |
| `/tutor/schedule` | Blocked | Blocked | Yes | Blocked | Blocked | → `/login` |
| `/tutor/classes/[id]` | Blocked | Blocked | Yes | Blocked | Blocked | → `/login` |
| `/tutor/scan` | Blocked | Blocked | Yes | Blocked | Blocked | → `/login` |
| `/parent/dashboard` | Blocked | Blocked | Blocked | Yes | Blocked | → `/login` |
| `/parent/check-in` | Blocked | Blocked | Blocked | Yes | Blocked | → `/login` |
| `/practitioner/schedule` | Blocked | Blocked | Blocked | Blocked | Yes | → `/login` |
| `/practitioner/availability` | Blocked | Blocked | Blocked | Blocked | Yes | → `/login` |
| `/practitioner/appointments/[id]` | Blocked | Blocked | Blocked | Blocked | Yes | → `/login` |
| `/book/[slug]` | Yes (200) | Yes (200) | Yes (200) | Yes (200) | Yes (200) | Yes (200) |
| `/login` (while logged in) | → `/admin` | → `/admin` | → `/tutor/schedule` | → `/parent/dashboard` | → `/practitioner/dashboard` | 200 |
| `/` (while logged in) | → `/admin` | → `/admin` | → `/tutor/schedule` | → `/parent/dashboard` | → `/practitioner/dashboard` | 200 |
