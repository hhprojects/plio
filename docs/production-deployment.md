# Production Deployment Guide

Everything needed to move Plio from local development to production.

## 1. Supabase (Hosted)

Create a project at [supabase.com/dashboard](https://supabase.com/dashboard):
- Organization: `Plio`
- Project name: `plio`
- Region: `Southeast Asia (Singapore)`
- Save the database password securely

### Apply migrations

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

There are 26 migrations total. The most significant are:
- `00013_rls_policies.sql` — Base RLS policies for tenants, profiles, rooms, holidays, etc.
- `00025_modular_redesign.sql` — Drops old business-type tables, creates the unified module-driven schema (12 new tables: modules, tenant_modules, contacts, contact_dependents, team_members, team_availability, availability_overrides, services, schedules, sessions, enrollments, contact_notes). Also seeds the 9 system modules.
- `00026_modular_rls_policies.sql` — 48 RLS policies for the new tables, including `anon` access for public booking.

**Module seed data:** Migration `00025_modular_redesign.sql` inserts 9 system modules into the `modules` table (dashboard, calendar, clients, services, team, rooms, invoicing, booking, settings). Three are `always_on` (dashboard, team, settings). These are required for the app to function — they are applied automatically via `supabase db push`.

### Auth settings (Supabase Dashboard > Authentication > URL Configuration)

| Setting | Local | Production |
|---------|-------|------------|
| Site URL | `http://127.0.0.1:3000` | `https://yourdomain.com` |
| Redirect URLs | `http://127.0.0.1:3000` | `https://yourdomain.com/**` |

These are currently hardcoded in `supabase/config.toml` (lines 154-156) for local dev only. In production, set them via the Supabase dashboard.

Go to **Authentication > Email Templates** to customize confirmation/invite emails if needed.

### RLS policies

Applied via migrations. The base policies from `00013_rls_policies.sql` cover tenants, profiles, rooms, holidays, waitlist, invitations, audit_log, notifications, invoices, and payments. The modular policies from `00026_modular_rls_policies.sql` add 48 policies across 12 new tables. No changes needed — they work the same on hosted Supabase.

### Storage bucket

Go to **Storage** in the Supabase Dashboard:

1. Create a bucket called `tenant-assets`
2. Set it to **public** (logos need to be publicly accessible)
3. Add a policy to allow authenticated users to upload:
   - Operation: INSERT
   - Target roles: authenticated
   - Policy: `(bucket_id = 'tenant-assets')`

### Create super admin

**Do NOT run `seed.sql`** — it contains a test super_admin account (`admin@plio.dev / password123`). Create your real super_admin manually:

1. Go to Authentication > Users > Add user (or sign up through the app)
2. Go to SQL Editor and set the profile:
   ```sql
   -- If profile already exists (e.g. from signup flow):
   UPDATE public.profiles SET role = 'super_admin' WHERE user_id = '<auth-user-uuid>';

   -- If profile doesn't exist yet:
   INSERT INTO profiles (id, tenant_id, role, full_name, email)
   VALUES ('<auth-user-uuid>', '<your-tenant-uuid>', 'super_admin', 'Your Name', 'you@example.com');
   ```

---

## 2. Environment Variables

Set these in your hosting platform (Vercel, etc.):

### Required

| Variable | Where to find it | Description |
|----------|-----------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API | Your Supabase project URL (e.g. `https://abc123.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API | Supabase anon/public key (safe to expose in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | **Server-only. Never expose to client.** Used by admin client for waitlist approval, invite acceptance, public booking |
| `NEXT_PUBLIC_APP_URL` | Your production domain | e.g. `https://plio.sg` — used for invite email links. Falls back to `http://localhost:3000` — **must be set in production** |
| `RESEND_API_KEY` | [resend.com](https://resend.com) | Required for sending emails in production |
| `CHECKIN_SECRET` | Generate with `openssl rand -hex 32` | HMAC secret for QR check-in tokens |

### Optional

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | Custom SMTP host (default: `127.0.0.1`, only used when `RESEND_API_KEY` is not set) |
| `SMTP_PORT` | Custom SMTP port (default: `54325`, only used when `RESEND_API_KEY` is not set) |

### Where these are used

- `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` — `lib/supabase/server.ts`, `client.ts`, `middleware.ts`
- `SUPABASE_SERVICE_ROLE_KEY` — `lib/supabase/admin.ts` (bypasses RLS for waitlist, invites, public booking)
- `NEXT_PUBLIC_APP_URL` — invite email links, public booking page URLs

---

## 3. Email (Resend)

**Local dev:** Emails route through Supabase Inbucket via SMTP (port 54325). See them at `http://127.0.0.1:54324/`.

**Production:**

1. Create account at [resend.com](https://resend.com)
2. Add and verify your sending domain (e.g. `plio.app`)
3. Create an API key
4. Set `RESEND_API_KEY` in your hosting provider's env vars
5. Update the `from` address in `packages/email/src/send.ts` if not using `noreply@plio.app`

### Email templates

Located in `packages/email/src/templates/`:
- `invite-email.tsx` — Team member invitations
- `waitlist-approved-email.tsx` — Waitlist approval notification
- `waitlist-rejected-email.tsx` — Waitlist rejection notification

---

## 4. Hosting (Next.js)

### Vercel (recommended)

```bash
# From repo root
vercel --prod
```

Set all environment variables in Vercel dashboard > Settings > Environment Variables.

### Other platforms

The app is a standard Next.js 15 App Router project. Build with:

```bash
pnpm build        # Turborepo builds all packages then the web app
pnpm --filter web start
```

### Build config

- `turbo.json` — Defines build pipeline (`build`, `dev`, `lint`, `type-check`)
- `next.config.ts` — Transpiles `@plio/ui`, `@plio/db`, `@plio/utils`
- No Dockerfile exists yet — add one if deploying to containers

---

## 5. Domain & DNS

1. Purchase/configure your domain
2. Point DNS to your hosting provider (Vercel, etc.)
3. Update in Supabase Dashboard:
   - Authentication > URL Configuration > Site URL → `https://yourdomain.com`
   - Authentication > URL Configuration > Redirect URLs → `https://yourdomain.com/**`
4. Set `NEXT_PUBLIC_APP_URL=https://yourdomain.com` in hosting env vars

---

## 6. Security Checklist

### Must fix before production

- [ ] **`NEXT_PUBLIC_APP_URL`** — Set this. Without it, invite emails contain `http://localhost:3000` links
- [ ] **Remove seed data** — Do not run `supabase/seed.sql` in production (contains test credentials)
- [ ] **Service role key** — Ensure `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client. It's only imported in `lib/supabase/admin.ts` (server-only file) — verify this stays true
- [ ] **`CHECKIN_SECRET`** — Generate and set for QR check-in token security

### Already handled

- RLS policies enforce tenant isolation across all tables
- Module guard (`requireModule()`) prevents access to disabled modules
- Middleware refreshes auth tokens on every request
- Admin client (`createAdminClient`) is server-only with clear usage boundaries
- Passwords are handled by Supabase Auth (bcrypt)
- Invite tokens are UUID v4 (cryptographically random)
- System modules are seeded via migration (not user-editable)

---

## 7. Deployment Checklist

### Before deploying

- [ ] All env vars set in hosting platform
- [ ] `supabase db push` completed successfully
- [ ] Auth URL configuration set in Supabase Dashboard
- [ ] `tenant-assets` storage bucket created with upload policy
- [ ] Super admin user created
- [ ] Resend API key configured and domain verified
- [ ] `CHECKIN_SECRET` generated and set
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain (not localhost)

### After deploying

- [ ] Test login/signup flow
- [ ] Test invite email sends and links work
- [ ] Test logo upload in tenant settings
- [ ] Test QR check-in token generation
- [ ] Verify RLS — confirm users can only see their own tenant's data

---

## 8. Monitoring (Recommended)

Not yet implemented, but consider adding:
- **Error tracking:** Sentry (Next.js SDK)
- **Analytics:** Vercel Analytics or PostHog
- **Uptime monitoring:** BetterStack or similar
- **Database monitoring:** Supabase dashboard (built-in)

---

## Quick Start Summary

```
1. Create Supabase project → get URL, anon key, service role key
2. Run migrations:          supabase link && supabase db push
3. Create storage bucket:   tenant-assets (public, authenticated uploads)
4. Create super_admin:      manually via Supabase dashboard
5. Sign up for Resend:      get API key, verify domain
6. Deploy to Vercel:        set env vars, deploy
7. Configure domain:        DNS + Supabase redirect URLs
```

## Notes

- **No code changes required** for production. All source code reads from environment variables.
- **No edge functions** to deploy — all server logic is in Next.js server actions.
- `supabase/config.toml` is local dev only. Production settings are managed via the Supabase Dashboard.
- Free tier: 2 projects, 500MB database, 1GB storage, 50K auth MAUs. Pro plan: $25/month.
