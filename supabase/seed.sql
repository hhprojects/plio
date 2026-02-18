-- Seed: Bootstrap super_admin account for local development
-- Login: admin@plio.dev / password123

-- 1. Create the platform tenant
INSERT INTO public.tenants (id, name, slug, subscription_tier, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Plio Platform',
  'plio-platform',
  'pro',
  '{"timezone": "Asia/Singapore", "currency": "SGD"}'::jsonb
);

-- 2. Create auth user with password 'password123'
-- All string columns must be non-null empty strings for GoTrue compatibility
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  aud,
  role,
  phone,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  is_sso_user
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'admin@plio.dev',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "00000000-0000-0000-0000-000000000001", "role": "super_admin", "full_name": "Platform Admin"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated',
  NULL,
  '',
  '',
  '',
  0,
  false
);

-- 3. Create identity for the auth user (required for email/password login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'admin@plio.dev'),
  'email',
  '00000000-0000-0000-0000-000000000002',
  now(),
  now(),
  now()
);

-- ============================================================================
-- WELLNESS DEMO DATA: Glow Wellness Clinic
-- ============================================================================

-- 4. Create wellness demo tenant
INSERT INTO public.tenants (id, name, slug, subscription_tier, business_type, settings)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  'Glow Wellness Clinic',
  'glow-wellness',
  'pro',
  'wellness',
  '{"timezone": "Asia/Singapore", "currency": "SGD", "default_buffer_minutes": 15, "slot_interval_minutes": 15, "cancellation_window_hours": 4}'::jsonb
);

-- 5. Create wellness admin auth user (admin@glow.dev / password123)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  aud,
  role,
  phone,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  is_sso_user
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000000',
  'admin@glow.dev',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"tenant_id": "00000000-0000-0000-0000-000000000100", "role": "admin", "full_name": "Glow Admin"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated',
  NULL,
  '',
  '',
  '',
  0,
  false
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000101',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000101', 'email', 'admin@glow.dev'),
  'email',
  '00000000-0000-0000-0000-000000000101',
  now(),
  now(),
  now()
);

-- 6. Create 3 practitioner profiles (no auth user, just profiles)
INSERT INTO public.profiles (id, tenant_id, user_id, role, full_name, email, phone, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000100', NULL, 'practitioner', 'Dr. Sarah Chen', 'sarah@glow.dev', '+6591234567', true),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000100', NULL, 'practitioner', 'Marcus Tan', 'marcus@glow.dev', '+6592345678', true),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000100', NULL, 'practitioner', 'Lisa Wong', 'lisa@glow.dev', '+6593456789', true);

-- 7. Create 6 services
INSERT INTO public.services (id, tenant_id, title, category, duration_minutes, price, buffer_minutes, color_code, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000100', '60-min Deep Tissue Massage', 'Massage', 60, 120.00, NULL, '#6366f1', true),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000100', '90-min Swedish Massage', 'Massage', 90, 160.00, NULL, '#8b5cf6', true),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000100', 'TCM Consultation', 'TCM', 30, 80.00, 10, '#10b981', true),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000100', 'Acupuncture Session', 'TCM', 60, 120.00, 10, '#059669', true),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000100', 'Sports Physio Assessment', 'Physiotherapy', 60, 150.00, 15, '#f59e0b', true),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000100', 'Rehab Session', 'Physiotherapy', 45, 100.00, NULL, '#d97706', true);

-- 8. Create 3 rooms
INSERT INTO public.rooms (id, tenant_id, name, capacity, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000100', 'Treatment Room A', 1, true),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000100', 'Treatment Room B', 1, true),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000100', 'TCM Suite', 2, true);

-- 9. Create 10 clients
INSERT INTO public.clients (id, tenant_id, full_name, phone, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000100', 'Tan Wei Ming', '+6581234567', true),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000100', 'Lim Shu Fen', '+6582345678', true),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000100', 'Wong Kai Xiang', '+6583456789', true),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000100', 'Chia Mei Ling', '+6584567890', true),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000100', 'Ng Jun Wei', '+6585678901', true),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000100', 'Lee Hui Min', '+6586789012', true),
  ('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000100', 'Koh Zhi Hao', '+6587890123', true),
  ('00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000100', 'Teo Ying Xuan', '+6588901234', true),
  ('00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000100', 'Goh Jia Wen', '+6589012345', true),
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000100', 'Ong Shi Ting', '+6590123456', true);

-- 10. Practitioner availability (Mon-Fri 9-6, Sat 9-1)
-- Dr. Sarah Chen
INSERT INTO public.practitioner_availability (tenant_id, practitioner_id, day_of_week, start_time, end_time)
VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000102', 1, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000102', 2, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000102', 3, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000102', 4, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000102', 5, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000102', 6, '09:00', '13:00');

-- Marcus Tan
INSERT INTO public.practitioner_availability (tenant_id, practitioner_id, day_of_week, start_time, end_time)
VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000103', 1, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000103', 2, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000103', 3, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000103', 4, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000103', 5, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000103', 6, '09:00', '13:00');

-- Lisa Wong
INSERT INTO public.practitioner_availability (tenant_id, practitioner_id, day_of_week, start_time, end_time)
VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000104', 1, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000104', 2, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000104', 3, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000104', 4, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000104', 5, '09:00', '18:00'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000104', 6, '09:00', '13:00');

-- 11. Sample appointments (15 total)
-- 5 completed (past dates)
INSERT INTO public.appointments (id, tenant_id, service_id, practitioner_id, client_id, date, start_time, end_time, status)
VALUES
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000401', CURRENT_DATE - INTERVAL '7 days', '09:00', '10:00', 'completed'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000402', CURRENT_DATE - INTERVAL '6 days', '10:00', '10:30', 'completed'),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000403', CURRENT_DATE - INTERVAL '5 days', '14:00', '15:00', 'completed'),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000404', CURRENT_DATE - INTERVAL '4 days', '11:00', '12:00', 'completed'),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000405', CURRENT_DATE - INTERVAL '3 days', '15:00', '16:30', 'completed');

-- 5 confirmed (future dates)
INSERT INTO public.appointments (id, tenant_id, service_id, practitioner_id, client_id, date, start_time, end_time, status)
VALUES
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000406', CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', 'confirmed'),
  ('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000407', CURRENT_DATE + INTERVAL '2 days', '10:00', '10:45', 'confirmed'),
  ('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000408', CURRENT_DATE + INTERVAL '3 days', '11:00', '11:30', 'confirmed'),
  ('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000409', CURRENT_DATE + INTERVAL '4 days', '14:00', '15:00', 'confirmed'),
  ('00000000-0000-0000-0000-000000000510', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000410', CURRENT_DATE + INTERVAL '5 days', '15:00', '16:00', 'confirmed');

-- 3 no_show (past dates)
INSERT INTO public.appointments (id, tenant_id, service_id, practitioner_id, client_id, date, start_time, end_time, status)
VALUES
  ('00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000407', CURRENT_DATE - INTERVAL '10 days', '09:00', '10:00', 'no_show'),
  ('00000000-0000-0000-0000-000000000512', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000408', CURRENT_DATE - INTERVAL '9 days', '14:00', '14:30', 'no_show'),
  ('00000000-0000-0000-0000-000000000513', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000409', CURRENT_DATE - INTERVAL '8 days', '11:00', '11:45', 'no_show');

-- 2 cancelled (past dates, with cancellation_reason)
INSERT INTO public.appointments (id, tenant_id, service_id, practitioner_id, client_id, date, start_time, end_time, status, cancellation_reason)
VALUES
  ('00000000-0000-0000-0000-000000000514', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000401', CURRENT_DATE - INTERVAL '12 days', '15:00', '16:30', 'cancelled', 'Client requested reschedule due to work commitment'),
  ('00000000-0000-0000-0000-000000000515', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000403', CURRENT_DATE - INTERVAL '11 days', '10:00', '11:00', 'cancelled', 'Practitioner on emergency leave');

-- 12. Client notes (linked to completed appointments)
INSERT INTO public.client_notes (id, tenant_id, client_id, appointment_id, practitioner_id, content)
VALUES
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000102', 'Client reports tension in lower back. Applied deep tissue technique focusing on lumbar region and glutes. Recommend follow-up in 2 weeks.'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000103', 'First TCM consultation. Pulse diagnosis indicates weak kidney qi and slight liver stagnation. Prescribed herbal formula (Liu Wei Di Huang Wan). Follow up in 1 week.'),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000104', 'Acupuncture session for shoulder pain. Needled GB21, SI11, LI15. Client tolerated well. Pain reduced from 7/10 to 3/10 post-session.'),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000102', 'Sports physio assessment for knee injury. ROM limited at 90 degrees flexion. Suspect meniscal involvement. Referred for MRI. Started gentle quad strengthening exercises.'),
  ('00000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000103', 'Full body Swedish massage. Client noted stress from work. Focused on neck and shoulders. Used lavender essential oil for relaxation. Client fell asleep during session - good sign of relaxation.');
