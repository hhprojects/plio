/**
 * Role-based access test runner
 * Tests middleware redirects and route guards for all 4 roles.
 *
 * Usage: node scripts/test-roles.mjs
 * Requires: dev server on localhost:3000, Supabase running
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read env
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const APP_URL = 'http://localhost:3000';

// Sign in via Supabase, then login through the app to get session cookies
async function getSessionCookies(email, password) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);

  // Build the cookie that @supabase/ssr expects
  // The cookie name is derived from the Supabase URL
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionData = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    expires_at: data.session.expires_at,
    token_type: 'bearer',
    type: 'access',
  });

  // Supabase SSR may chunk cookies if > 3180 chars. Ours is small enough.
  return `${cookieName}=${encodeURIComponent(sessionData)}`;
}

// Test a route - returns redirect location or status
async function testRoute(path, cookies = '') {
  const res = await fetch(`${APP_URL}${path}`, {
    headers: cookies ? { Cookie: cookies } : {},
    redirect: 'manual',
  });

  const location = res.headers.get('location');
  return {
    status: res.status,
    redirectTo: location ? new URL(location, APP_URL).pathname : null,
  };
}

// Test framework
let passed = 0;
let failed = 0;
const failures = [];

function test(name, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed++;
    failures.push({ name, actual, expected });
    console.log(`  \x1b[31m✗\x1b[0m ${name} (got: ${actual}, expected: ${expected})`);
  }
}

function isRedirect(status) {
  return status >= 300 && status < 400;
}

// ============================================================
console.log('\n🔐 Plio Role-Based Access Tests\n');

// Test 1: Unauthenticated
console.log('Test 1: Unauthenticated Access');
{
  const r1 = await testRoute('/admin');
  test('1.1 /admin → /login', r1.redirectTo, '/login');

  const r2 = await testRoute('/tutor/schedule');
  test('1.2 /tutor/schedule → /login', r2.redirectTo, '/login');

  const r3 = await testRoute('/parent/dashboard');
  test('1.3 /parent/dashboard → /login', r3.redirectTo, '/login');

  const r4 = await testRoute('/admin/students');
  test('1.4 /admin/students → /login', r4.redirectTo, '/login');

  const r5 = await testRoute('/login');
  test('1.5 /login → 200', r5.status, 200);
}

// Test 2: Super Admin
console.log('\nTest 2: Super Admin (admin@plio.dev)');
{
  const cookies = await getSessionCookies('admin@plio.dev', 'password123');

  const r1 = await testRoute('/', cookies);
  test('2A.1 / → /admin', r1.redirectTo, '/admin');

  const r2 = await testRoute('/login', cookies);
  test('2A.2 /login → /admin', r2.redirectTo, '/admin');

  const r3 = await testRoute('/admin', cookies);
  test('2C.1 /admin → 200', r3.status, 200);

  const r4 = await testRoute('/admin/students', cookies);
  test('2C.2 /admin/students → 200', r4.status, 200);

  const r5 = await testRoute('/tutor/schedule', cookies);
  test('2C.4 /tutor/schedule → /admin (blocked)', r5.redirectTo, '/admin');

  const r6 = await testRoute('/parent/dashboard', cookies);
  test('2C.5 /parent/dashboard → /admin (blocked)', r6.redirectTo, '/admin');
}

// Test 3: Admin
console.log('\nTest 3: Admin (admin@bright.test)');
{
  const cookies = await getSessionCookies('admin@bright.test', 'password123');

  const r1 = await testRoute('/', cookies);
  test('3A.1 / → /admin', r1.redirectTo, '/admin');

  const r2 = await testRoute('/login', cookies);
  test('3A.2 /login → /admin', r2.redirectTo, '/admin');

  const r3 = await testRoute('/admin', cookies);
  test('3C.1 /admin → 200', r3.status, 200);

  const r4 = await testRoute('/admin/students', cookies);
  test('3C.2 /admin/students → 200', r4.status, 200);

  const r5 = await testRoute('/tutor/schedule', cookies);
  test('3C.3 /tutor/schedule → /admin (blocked)', r5.redirectTo, '/admin');

  const r6 = await testRoute('/parent/dashboard', cookies);
  test('3C.4 /parent/dashboard → /admin (blocked)', r6.redirectTo, '/admin');
}

// Test 4: Tutor
console.log('\nTest 4: Tutor (tutor@bright.test)');
{
  const cookies = await getSessionCookies('tutor@bright.test', 'password123');

  const r1 = await testRoute('/', cookies);
  test('4A.1 / → /tutor/schedule', r1.redirectTo, '/tutor/schedule');

  const r2 = await testRoute('/login', cookies);
  test('4A.2 /login → /tutor/schedule', r2.redirectTo, '/tutor/schedule');

  const r3 = await testRoute('/admin', cookies);
  test('4C.1 /admin → /tutor/schedule (blocked)', r3.redirectTo, '/tutor/schedule');

  const r4 = await testRoute('/admin/students', cookies);
  test('4C.2 /admin/students → /tutor/schedule (blocked)', r4.redirectTo, '/tutor/schedule');

  const r5 = await testRoute('/admin/team', cookies);
  test('4C.3 /admin/team → /tutor/schedule (blocked)', r5.redirectTo, '/tutor/schedule');

  const r6 = await testRoute('/admin/courses', cookies);
  test('4C.4 /admin/courses → /tutor/schedule (blocked)', r6.redirectTo, '/tutor/schedule');

  const r7 = await testRoute('/admin/rooms', cookies);
  test('4C.5 /admin/rooms → /tutor/schedule (blocked)', r7.redirectTo, '/tutor/schedule');

  const r8 = await testRoute('/admin/schedules', cookies);
  test('4C.6 /admin/schedules → /tutor/schedule (blocked)', r8.redirectTo, '/tutor/schedule');

  const r9 = await testRoute('/admin/platform/waitlist', cookies);
  test('4C.7 /admin/platform/waitlist → /tutor/schedule (blocked)', r9.redirectTo, '/tutor/schedule');

  const r10 = await testRoute('/parent/dashboard', cookies);
  test('4C.8 /parent/dashboard → /tutor/schedule (blocked)', r10.redirectTo, '/tutor/schedule');

  const r11 = await testRoute('/tutor/schedule', cookies);
  test('4D.1 /tutor/schedule → 200 (allowed)', r11.status, 200);

  const r12 = await testRoute('/tutor/scan', cookies);
  test('4D.2 /tutor/scan → 200 (allowed)', r12.status, 200);
}

// Test 5: Parent
console.log('\nTest 5: Parent (parent@bright.test)');
{
  const cookies = await getSessionCookies('parent@bright.test', 'password123');

  const r1 = await testRoute('/', cookies);
  test('5A.1 / → /parent/dashboard', r1.redirectTo, '/parent/dashboard');

  const r2 = await testRoute('/login', cookies);
  test('5A.2 /login → /parent/dashboard', r2.redirectTo, '/parent/dashboard');

  const r3 = await testRoute('/admin', cookies);
  test('5B.1 /admin → /parent/dashboard (blocked)', r3.redirectTo, '/parent/dashboard');

  const r4 = await testRoute('/admin/students', cookies);
  test('5B.2 /admin/students → /parent/dashboard (blocked)', r4.redirectTo, '/parent/dashboard');

  const r5 = await testRoute('/admin/team', cookies);
  test('5B.3 /admin/team → /parent/dashboard (blocked)', r5.redirectTo, '/parent/dashboard');

  const r6 = await testRoute('/tutor/schedule', cookies);
  test('5B.4 /tutor/schedule → /parent/dashboard (blocked)', r6.redirectTo, '/parent/dashboard');

  const r7 = await testRoute('/tutor/scan', cookies);
  test('5B.5 /tutor/scan → /parent/dashboard (blocked)', r7.redirectTo, '/parent/dashboard');
}

// Test 6: Wellness Admin
console.log('\nTest 6: Wellness Admin (admin@serenity.test)');
{
  const cookies = await getSessionCookies('admin@serenity.test', 'password123');

  const r1 = await testRoute('/', cookies);
  test('6A.1 / → /admin', r1.redirectTo, '/admin');

  const r2 = await testRoute('/login', cookies);
  test('6A.2 /login → /admin', r2.redirectTo, '/admin');

  const r3 = await testRoute('/admin', cookies);
  test('6C.1 /admin → 200', r3.status, 200);

  const r4 = await testRoute('/admin/appointments', cookies);
  test('6C.2 /admin/appointments → 200', r4.status, 200);

  const r5 = await testRoute('/admin/clients', cookies);
  test('6C.3 /admin/clients → 200', r5.status, 200);

  const r6 = await testRoute('/admin/services', cookies);
  test('6C.4 /admin/services → 200', r6.status, 200);

  const r7 = await testRoute('/admin/practitioners', cookies);
  test('6C.5 /admin/practitioners → 200', r7.status, 200);

  const r8 = await testRoute('/tutor/schedule', cookies);
  test('6C.6 /tutor/schedule → /admin (blocked)', r8.redirectTo, '/admin');

  const r9 = await testRoute('/practitioner/schedule', cookies);
  test('6C.7 /practitioner/schedule → /admin (blocked)', r9.redirectTo, '/admin');

  const r10 = await testRoute('/parent/dashboard', cookies);
  test('6C.8 /parent/dashboard → /admin (blocked)', r10.redirectTo, '/admin');
}

// Test 7: Practitioner
console.log('\nTest 7: Practitioner (practitioner@serenity.test)');
{
  const cookies = await getSessionCookies('practitioner@serenity.test', 'password123');

  // Middleware redirects to /practitioner/dashboard; page then redirects to /schedule
  const r1 = await testRoute('/', cookies);
  test('7A.1 / → /practitioner/dashboard', r1.redirectTo, '/practitioner/dashboard');

  const r2 = await testRoute('/login', cookies);
  test('7A.2 /login → /practitioner/dashboard', r2.redirectTo, '/practitioner/dashboard');

  const r3 = await testRoute('/practitioner/schedule', cookies);
  test('7B.1 /practitioner/schedule → 200 (allowed)', r3.status, 200);

  const r4 = await testRoute('/practitioner/availability', cookies);
  test('7B.2 /practitioner/availability → 200 (allowed)', r4.status, 200);

  const r5 = await testRoute('/admin', cookies);
  test('7C.1 /admin → /practitioner/dashboard (blocked)', r5.redirectTo, '/practitioner/dashboard');

  const r6 = await testRoute('/admin/appointments', cookies);
  test('7C.2 /admin/appointments → /practitioner/dashboard (blocked)', r6.redirectTo, '/practitioner/dashboard');

  const r7 = await testRoute('/tutor/schedule', cookies);
  test('7C.3 /tutor/schedule → /practitioner/dashboard (blocked)', r7.redirectTo, '/practitioner/dashboard');

  const r8 = await testRoute('/parent/dashboard', cookies);
  test('7C.4 /parent/dashboard → /practitioner/dashboard (blocked)', r8.redirectTo, '/practitioner/dashboard');
}

// Test 8: Public booking page (no auth)
console.log('\nTest 8: Public Booking (unauthenticated)');
{
  const r1 = await testRoute('/book/glow-wellness');
  test('8.1 /book/glow-wellness → 200 (public, no auth)', r1.status, 200);

  const r2 = await testRoute('/book/nonexistent-slug');
  test('8.2 /book/nonexistent-slug → 404', r2.status, 404);
}

// Summary
console.log(`\n${'─'.repeat(50)}`);
console.log(`\x1b[${failed > 0 ? '31' : '32'}m${passed} passed, ${failed} failed\x1b[0m`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  \x1b[31m✗\x1b[0m ${f.name}`);
    console.log(`    Expected: ${f.expected}`);
    console.log(`    Actual:   ${f.actual}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
