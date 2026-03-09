-- =============================================================================
-- Plio Seed Data — Modular Platform
-- Run: supabase db reset  (applies migrations + this seed)
-- =============================================================================
-- WARNING: Do NOT run in production. Contains test credentials.
--
-- Test Accounts:
--   super_admin : admin@plio.dev / password123        → Plio Platform
--   admin       : admin@bright.test / password123     → Bright Learning Hub
--   staff       : staff@bright.test / password123     → Bright Learning Hub
--   client      : client@bright.test / password123    → Bright Learning Hub
--   admin (2nd) : admin@zen.test / password123        → Zen Yoga Studio
-- =============================================================================

-- =============================================================================
-- 1. TENANTS
-- =============================================================================

-- Platform tenant (super_admin's home)
INSERT INTO public.tenants (id, name, slug, subscription_tier, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Plio Platform',
  'plio-platform',
  'pro',
  '{"timezone": "Asia/Singapore", "currency": "SGD"}'::jsonb
);

-- Demo business 1: Tuition centre style
INSERT INTO public.tenants (id, name, slug, subscription_tier, settings)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Bright Learning Hub',
  'bright-learning',
  'pro',
  '{"timezone": "Asia/Singapore", "currency": "SGD", "business_name": "Bright Learning Hub", "accent_color": "#6366f1"}'::jsonb
);

-- Demo business 2: Yoga/wellness style (for tenant isolation tests)
INSERT INTO public.tenants (id, name, slug, subscription_tier, settings)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'Zen Yoga Studio',
  'zen-yoga',
  'starter',
  '{"timezone": "Asia/Singapore", "currency": "SGD", "business_name": "Zen Yoga Studio", "accent_color": "#10b981"}'::jsonb
);

-- =============================================================================
-- 2. AUTH USERS + IDENTITIES
-- =============================================================================

-- SUPER ADMIN: admin@plio.dev / password123
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'admin@plio.dev',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "00000000-0000-0000-0000-000000000001", "role": "super_admin", "full_name": "Platform Admin"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'admin@plio.dev'),
  'email', '00000000-0000-0000-0000-000000000002', now(), now(), now()
);

-- ADMIN (Bright): admin@bright.test / password123
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user
) VALUES (
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

-- STAFF (Bright): staff@bright.test / password123
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000000',
  'staff@bright.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "aaaaaaaa-0000-0000-0000-000000000001", "role": "staff", "full_name": "Sam Staff"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000020',
  'aaaaaaaa-0000-0000-0000-000000000020',
  jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000020', 'email', 'staff@bright.test'),
  'email', 'aaaaaaaa-0000-0000-0000-000000000020', now(), now(), now()
);

-- CLIENT (Bright): client@bright.test / password123
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000000',
  'client@bright.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "aaaaaaaa-0000-0000-0000-000000000001", "role": "client", "full_name": "Charlie Client"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000030',
  'aaaaaaaa-0000-0000-0000-000000000030',
  jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000030', 'email', 'client@bright.test'),
  'email', 'aaaaaaaa-0000-0000-0000-000000000030', now(), now(), now()
);

-- ADMIN (Zen): admin@zen.test / password123
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  aud, role, phone, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status, is_sso_user
) VALUES (
  'bbbbbbbb-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000000',
  'admin@zen.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "bbbbbbbb-0000-0000-0000-000000000001", "role": "admin", "full_name": "Zara Zen"}'::jsonb,
  now(), now(), '', '', '', '', 'authenticated', 'authenticated', NULL, '', '', '', 0, false
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000010',
  'bbbbbbbb-0000-0000-0000-000000000010',
  jsonb_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000010', 'email', 'admin@zen.test'),
  'email', 'bbbbbbbb-0000-0000-0000-000000000010', now(), now(), now()
);

-- =============================================================================
-- 3. TENANT MODULES
-- =============================================================================

-- Bright Learning Hub: all modules enabled, tuition-style titles
INSERT INTO tenant_modules (tenant_id, module_id, enabled, custom_title, sort_order, config)
SELECT
  'aaaaaaaa-0000-0000-0000-000000000001',
  m.id,
  true,
  CASE m.slug
    WHEN 'clients' THEN 'Parents & Students'
    WHEN 'services' THEN 'Courses'
    WHEN 'team' THEN 'Tutors'
    ELSE NULL
  END,
  CASE m.slug
    WHEN 'dashboard' THEN 0
    WHEN 'calendar' THEN 1
    WHEN 'clients' THEN 2
    WHEN 'services' THEN 3
    WHEN 'team' THEN 4
    WHEN 'rooms' THEN 5
    WHEN 'invoicing' THEN 6
    WHEN 'booking' THEN 7
    WHEN 'settings' THEN 8
  END,
  CASE m.slug
    WHEN 'calendar' THEN '{"recurring_enabled": true, "appointments_enabled": false}'::jsonb
    ELSE '{}'::jsonb
  END
FROM modules m;

-- Zen Yoga Studio: subset of modules, yoga-style titles
INSERT INTO tenant_modules (tenant_id, module_id, enabled, custom_title, sort_order, config)
SELECT
  'bbbbbbbb-0000-0000-0000-000000000001',
  m.id,
  CASE m.slug
    WHEN 'rooms' THEN false
    WHEN 'invoicing' THEN false
    ELSE true
  END,
  CASE m.slug
    WHEN 'clients' THEN 'Members'
    WHEN 'services' THEN 'Classes & Sessions'
    WHEN 'team' THEN 'Instructors'
    ELSE NULL
  END,
  CASE m.slug
    WHEN 'dashboard' THEN 0
    WHEN 'calendar' THEN 1
    WHEN 'services' THEN 2
    WHEN 'clients' THEN 3
    WHEN 'team' THEN 4
    WHEN 'booking' THEN 5
    WHEN 'settings' THEN 6
    WHEN 'rooms' THEN 7
    WHEN 'invoicing' THEN 8
  END,
  CASE m.slug
    WHEN 'calendar' THEN '{"recurring_enabled": true, "appointments_enabled": true}'::jsonb
    ELSE '{}'::jsonb
  END
FROM modules m;

-- =============================================================================
-- 4. ROOMS (Bright Learning Hub)
-- =============================================================================

INSERT INTO public.rooms (id, tenant_id, name, capacity) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000101', 'aaaaaaaa-0000-0000-0000-000000000001', 'Room A', 10),
  ('aaaaaaaa-0000-0000-0000-000000000102', 'aaaaaaaa-0000-0000-0000-000000000001', 'Room B', 8),
  ('aaaaaaaa-0000-0000-0000-000000000103', 'aaaaaaaa-0000-0000-0000-000000000001', 'Room C (Lab)', 6);

-- =============================================================================
-- 5. TEAM MEMBERS
-- =============================================================================

-- Bright Learning Hub: 3 tutors (Sam Staff linked to auth user)
INSERT INTO public.team_members (id, tenant_id, profile_id, name, email, phone, role_title, color) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000201',
   'aaaaaaaa-0000-0000-0000-000000000001',
   (SELECT id FROM profiles WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000020'),
   'Sam Staff', 'staff@bright.test', '+6591111111', 'Senior Tutor', '#6366f1'),
  ('aaaaaaaa-0000-0000-0000-000000000202',
   'aaaaaaaa-0000-0000-0000-000000000001',
   NULL,
   'Diana Lim', 'diana@bright.test', '+6592222222', 'Tutor', '#ec4899'),
  ('aaaaaaaa-0000-0000-0000-000000000203',
   'aaaaaaaa-0000-0000-0000-000000000001',
   NULL,
   'Ravi Kumar', 'ravi@bright.test', '+6593333333', 'Tutor', '#f59e0b');

-- Zen Yoga Studio: 2 instructors
INSERT INTO public.team_members (id, tenant_id, profile_id, name, email, phone, role_title, color) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000201',
   'bbbbbbbb-0000-0000-0000-000000000001',
   NULL,
   'Maya Chen', 'maya@zen.test', '+6594444444', 'Lead Instructor', '#10b981'),
  ('bbbbbbbb-0000-0000-0000-000000000202',
   'bbbbbbbb-0000-0000-0000-000000000001',
   NULL,
   'Arjun Patel', 'arjun@zen.test', '+6595555555', 'Instructor', '#8b5cf6');

-- =============================================================================
-- 6. TEAM AVAILABILITY
-- =============================================================================

-- Sam Staff: Mon-Fri 14:00-20:00 (after-school hours)
INSERT INTO public.team_availability (tenant_id, team_member_id, day_of_week, start_time, end_time)
SELECT 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000201', d, '14:00', '20:00'
FROM generate_series(1, 5) AS d;

-- Diana Lim: Mon-Sat 10:00-18:00
INSERT INTO public.team_availability (tenant_id, team_member_id, day_of_week, start_time, end_time)
SELECT 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000202', d, '10:00', '18:00'
FROM generate_series(1, 6) AS d;

-- Ravi Kumar: Mon-Fri 14:00-21:00
INSERT INTO public.team_availability (tenant_id, team_member_id, day_of_week, start_time, end_time)
SELECT 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000203', d, '14:00', '21:00'
FROM generate_series(1, 5) AS d;

-- Maya Chen (Zen): Mon-Sat 7:00-15:00
INSERT INTO public.team_availability (tenant_id, team_member_id, day_of_week, start_time, end_time)
SELECT 'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000201', d, '07:00', '15:00'
FROM generate_series(1, 6) AS d;

-- Arjun Patel (Zen): Mon-Fri 16:00-21:00
INSERT INTO public.team_availability (tenant_id, team_member_id, day_of_week, start_time, end_time)
SELECT 'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000202', d, '16:00', '21:00'
FROM generate_series(1, 5) AS d;

-- =============================================================================
-- 7. SERVICES
-- =============================================================================

-- Bright Learning Hub: recurring courses + 1 bookable trial
INSERT INTO public.services (id, tenant_id, name, description, type, duration_minutes, capacity, price, color, active) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000301', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Sec 3 Mathematics', 'Secondary 3 Math — weekly class', 'recurring', 120, 8, 50.00, '#6366f1', true),
  ('aaaaaaaa-0000-0000-0000-000000000302', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Sec 4 English', 'Secondary 4 English — weekly class', 'recurring', 120, 8, 55.00, '#ec4899', true),
  ('aaaaaaaa-0000-0000-0000-000000000303', 'aaaaaaaa-0000-0000-0000-000000000001',
   'P5 Science', 'Primary 5 Science — weekly class', 'recurring', 90, 10, 40.00, '#f59e0b', true),
  ('aaaaaaaa-0000-0000-0000-000000000304', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Trial Lesson', 'Free 1-on-1 trial lesson', 'bookable', 60, 1, 0.00, '#10b981', true);

-- Zen Yoga Studio: mix of recurring and bookable
INSERT INTO public.services (id, tenant_id, name, description, type, duration_minutes, capacity, price, buffer_minutes, color, active) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000301', 'bbbbbbbb-0000-0000-0000-000000000001',
   'Morning Vinyasa', 'Energising morning flow', 'recurring', 60, 15, 25.00, 0, '#10b981', true),
  ('bbbbbbbb-0000-0000-0000-000000000302', 'bbbbbbbb-0000-0000-0000-000000000001',
   'Evening Yin Yoga', 'Relaxing evening stretch', 'recurring', 75, 12, 28.00, 0, '#8b5cf6', true),
  ('bbbbbbbb-0000-0000-0000-000000000303', 'bbbbbbbb-0000-0000-0000-000000000001',
   'Private Yoga Session', '1-on-1 personalised session', 'bookable', 60, 1, 80.00, 15, '#f59e0b', true);

-- =============================================================================
-- 8. CONTACTS
-- =============================================================================

-- Bright Learning Hub: parents
INSERT INTO public.contacts (id, tenant_id, name, email, phone, tags) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000401', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Charlie Client', 'client@bright.test', '+6581111111', '{parent}'),
  ('aaaaaaaa-0000-0000-0000-000000000402', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Tan Wei Ming', 'weiming@example.com', '+6582222222', '{parent}'),
  ('aaaaaaaa-0000-0000-0000-000000000403', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Lim Shu Fen', 'shufen@example.com', '+6583333333', '{parent}'),
  ('aaaaaaaa-0000-0000-0000-000000000404', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Wong Kai Xiang', 'kaixiang@example.com', '+6584444444', '{parent}');

-- Zen Yoga Studio: members
INSERT INTO public.contacts (id, tenant_id, name, email, phone, tags) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000401', 'bbbbbbbb-0000-0000-0000-000000000001',
   'Emily Tan', 'emily@example.com', '+6586666666', '{member,regular}'),
  ('bbbbbbbb-0000-0000-0000-000000000402', 'bbbbbbbb-0000-0000-0000-000000000001',
   'Jason Lim', 'jason@example.com', '+6587777777', '{member}');

-- =============================================================================
-- 9. CONTACT DEPENDENTS (children of Bright parents)
-- =============================================================================

INSERT INTO public.contact_dependents (id, tenant_id, contact_id, name, date_of_birth, notes) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000501', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000401', 'Chloe Client', '2011-03-15', 'Sec 3 — strong in math'),
  ('aaaaaaaa-0000-0000-0000-000000000502', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000401', 'Calvin Client', '2013-08-22', 'P5 — needs help with science'),
  ('aaaaaaaa-0000-0000-0000-000000000503', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000402', 'Tan Jun Hao', '2011-06-10', 'Sec 3'),
  ('aaaaaaaa-0000-0000-0000-000000000504', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000403', 'Lim Jia Yi', '2011-01-28', 'Sec 3 — excels in English'),
  ('aaaaaaaa-0000-0000-0000-000000000505', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000404', 'Wong Shi Min', '2013-11-05', 'P5');

-- =============================================================================
-- 10. SCHEDULES (Recurring patterns)
-- =============================================================================

INSERT INTO public.schedules (id, tenant_id, service_id, team_member_id, room_id, day_of_week, start_time, end_time, rrule, effective_from) VALUES
  -- Sec 3 Math: Sam Staff, Mon 4-6pm, Room A
  ('aaaaaaaa-0000-0000-0000-000000000601', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000301', 'aaaaaaaa-0000-0000-0000-000000000201',
   'aaaaaaaa-0000-0000-0000-000000000101', 1, '16:00', '18:00',
   'FREQ=WEEKLY;BYDAY=MO', '2026-01-06'),
  -- Sec 3 Math: Sam Staff, Wed 4-6pm, Room A
  ('aaaaaaaa-0000-0000-0000-000000000602', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000301', 'aaaaaaaa-0000-0000-0000-000000000201',
   'aaaaaaaa-0000-0000-0000-000000000101', 3, '16:00', '18:00',
   'FREQ=WEEKLY;BYDAY=WE', '2026-01-06'),
  -- Sec 4 English: Diana Lim, Tue 4-6pm, Room B
  ('aaaaaaaa-0000-0000-0000-000000000603', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000302', 'aaaaaaaa-0000-0000-0000-000000000202',
   'aaaaaaaa-0000-0000-0000-000000000102', 2, '16:00', '18:00',
   'FREQ=WEEKLY;BYDAY=TU', '2026-01-06'),
  -- P5 Science: Ravi Kumar, Thu 4-5:30pm, Room C
  ('aaaaaaaa-0000-0000-0000-000000000604', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000303', 'aaaaaaaa-0000-0000-0000-000000000203',
   'aaaaaaaa-0000-0000-0000-000000000103', 4, '16:00', '17:30',
   'FREQ=WEEKLY;BYDAY=TH', '2026-01-06');

-- =============================================================================
-- 11. SESSIONS (class instances + appointments)
-- =============================================================================

-- Past completed classes (last week)
INSERT INTO public.sessions (id, tenant_id, service_id, schedule_id, team_member_id, room_id, date, start_time, end_time, status, type) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000701', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000301', 'aaaaaaaa-0000-0000-0000-000000000601',
   'aaaaaaaa-0000-0000-0000-000000000201', 'aaaaaaaa-0000-0000-0000-000000000101',
   CURRENT_DATE - INTERVAL '7 days', '16:00', '18:00', 'completed', 'class'),
  ('aaaaaaaa-0000-0000-0000-000000000702', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000302', 'aaaaaaaa-0000-0000-0000-000000000603',
   'aaaaaaaa-0000-0000-0000-000000000202', 'aaaaaaaa-0000-0000-0000-000000000102',
   CURRENT_DATE - INTERVAL '6 days', '16:00', '18:00', 'completed', 'class');

-- Today's classes
INSERT INTO public.sessions (id, tenant_id, service_id, schedule_id, team_member_id, room_id, date, start_time, end_time, status, type) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000703', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000301', 'aaaaaaaa-0000-0000-0000-000000000601',
   'aaaaaaaa-0000-0000-0000-000000000201', 'aaaaaaaa-0000-0000-0000-000000000101',
   CURRENT_DATE, '16:00', '18:00', 'scheduled', 'class'),
  ('aaaaaaaa-0000-0000-0000-000000000704', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000303', 'aaaaaaaa-0000-0000-0000-000000000604',
   'aaaaaaaa-0000-0000-0000-000000000203', 'aaaaaaaa-0000-0000-0000-000000000103',
   CURRENT_DATE, '16:00', '17:30', 'scheduled', 'class');

-- Upcoming classes (next week)
INSERT INTO public.sessions (id, tenant_id, service_id, schedule_id, team_member_id, room_id, date, start_time, end_time, status, type) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000705', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000301', 'aaaaaaaa-0000-0000-0000-000000000601',
   'aaaaaaaa-0000-0000-0000-000000000201', 'aaaaaaaa-0000-0000-0000-000000000101',
   CURRENT_DATE + INTERVAL '7 days', '16:00', '18:00', 'scheduled', 'class'),
  ('aaaaaaaa-0000-0000-0000-000000000706', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000302', 'aaaaaaaa-0000-0000-0000-000000000603',
   'aaaaaaaa-0000-0000-0000-000000000202', 'aaaaaaaa-0000-0000-0000-000000000102',
   CURRENT_DATE + INTERVAL '8 days', '16:00', '18:00', 'scheduled', 'class');

-- Bookable appointment (Trial Lesson)
INSERT INTO public.sessions (id, tenant_id, service_id, schedule_id, team_member_id, room_id, date, start_time, end_time, status, type) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000707', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000304', NULL,
   'aaaaaaaa-0000-0000-0000-000000000202', 'aaaaaaaa-0000-0000-0000-000000000102',
   CURRENT_DATE + INTERVAL '2 days', '10:00', '11:00', 'scheduled', 'appointment');

-- Zen Yoga Studio: sessions
INSERT INTO public.sessions (id, tenant_id, service_id, schedule_id, team_member_id, room_id, date, start_time, end_time, status, type) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000701', 'bbbbbbbb-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000301', NULL,
   'bbbbbbbb-0000-0000-0000-000000000201', NULL,
   CURRENT_DATE, '07:00', '08:00', 'scheduled', 'class'),
  ('bbbbbbbb-0000-0000-0000-000000000702', 'bbbbbbbb-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000303', NULL,
   'bbbbbbbb-0000-0000-0000-000000000201', NULL,
   CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', 'scheduled', 'appointment');

-- =============================================================================
-- 12. ENROLLMENTS
-- =============================================================================

-- Today's Sec 3 Math enrollments
INSERT INTO public.enrollments (tenant_id, session_id, contact_id, dependent_id, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000703',
   'aaaaaaaa-0000-0000-0000-000000000401', 'aaaaaaaa-0000-0000-0000-000000000501', 'confirmed'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000703',
   'aaaaaaaa-0000-0000-0000-000000000402', 'aaaaaaaa-0000-0000-0000-000000000503', 'confirmed'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000703',
   'aaaaaaaa-0000-0000-0000-000000000403', 'aaaaaaaa-0000-0000-0000-000000000504', 'confirmed');

-- Today's P5 Science enrollments
INSERT INTO public.enrollments (tenant_id, session_id, contact_id, dependent_id, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000704',
   'aaaaaaaa-0000-0000-0000-000000000401', 'aaaaaaaa-0000-0000-0000-000000000502', 'confirmed'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000704',
   'aaaaaaaa-0000-0000-0000-000000000404', 'aaaaaaaa-0000-0000-0000-000000000505', 'confirmed');

-- Past class enrollments (attended)
INSERT INTO public.enrollments (tenant_id, session_id, contact_id, dependent_id, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000701',
   'aaaaaaaa-0000-0000-0000-000000000401', 'aaaaaaaa-0000-0000-0000-000000000501', 'attended'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000701',
   'aaaaaaaa-0000-0000-0000-000000000402', 'aaaaaaaa-0000-0000-0000-000000000503', 'attended'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000702',
   'aaaaaaaa-0000-0000-0000-000000000403', 'aaaaaaaa-0000-0000-0000-000000000504', 'attended');

-- Trial lesson enrollment
INSERT INTO public.enrollments (tenant_id, session_id, contact_id, dependent_id, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000707',
   'aaaaaaaa-0000-0000-0000-000000000404', 'aaaaaaaa-0000-0000-0000-000000000505', 'confirmed');

-- Zen Yoga enrollments
INSERT INTO public.enrollments (tenant_id, session_id, contact_id, status) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000701',
   'bbbbbbbb-0000-0000-0000-000000000401', 'confirmed'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000702',
   'bbbbbbbb-0000-0000-0000-000000000401', 'confirmed');

-- =============================================================================
-- 13. CONTACT NOTES
-- =============================================================================

INSERT INTO public.contact_notes (tenant_id, contact_id, team_member_id, session_id, content) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000401',
   'aaaaaaaa-0000-0000-0000-000000000201',
   'aaaaaaaa-0000-0000-0000-000000000701',
   'Chloe did well on algebra exercises. Needs more practice on quadratic equations.'),
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000402',
   'aaaaaaaa-0000-0000-0000-000000000201',
   'aaaaaaaa-0000-0000-0000-000000000701',
   'Jun Hao struggling with simultaneous equations. Assigned extra homework.');

-- =============================================================================
-- 14. INVOICES
-- =============================================================================

INSERT INTO public.invoices (id, tenant_id, invoice_number, parent_id, line_items, subtotal, gst_rate, gst_amount, total, status, due_date) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000801', 'aaaaaaaa-0000-0000-0000-000000000001',
   'INV-2026-0001',
   (SELECT id FROM profiles WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000030'),
   '[{"description": "Sec 3 Math — March 2026 (4 sessions)", "quantity": 4, "unit_price": 50, "amount": 200}, {"description": "P5 Science — March 2026 (4 sessions)", "quantity": 4, "unit_price": 40, "amount": 160}]'::jsonb,
   360.00, 9.00, 32.40, 392.40, 'sent', CURRENT_DATE + INTERVAL '14 days'),
  ('aaaaaaaa-0000-0000-0000-000000000802', 'aaaaaaaa-0000-0000-0000-000000000001',
   'INV-2026-0002',
   (SELECT id FROM profiles WHERE user_id = 'aaaaaaaa-0000-0000-0000-000000000030'),
   '[{"description": "Sec 3 Math — February 2026 (4 sessions)", "quantity": 4, "unit_price": 50, "amount": 200}]'::jsonb,
   200.00, 9.00, 18.00, 218.00, 'paid', CURRENT_DATE - INTERVAL '14 days');

-- =============================================================================
-- 15. WAITLIST ENTRY (for super_admin testing)
-- =============================================================================

INSERT INTO public.waitlist (id, business_name, contact_email, contact_phone, business_type, message, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000901',
   'Star Music Academy',
   'info@starmusic.sg',
   '+6599887766',
   'music',
   'We run a music school in Jurong with 5 instructors. Looking for a scheduling system.',
   'pending');

-- =============================================================================
-- 16. AVAILABILITY OVERRIDES
-- =============================================================================

-- Sam Staff taking next Monday off
INSERT INTO public.availability_overrides (tenant_id, team_member_id, date, is_available, reason) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000201',
   CURRENT_DATE + INTERVAL '7 days',
   false,
   'Medical appointment');
