# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (Turborepo)
pnpm dev              # Start all dev servers
pnpm build            # Build all apps + packages
pnpm lint             # Lint all workspaces
pnpm type-check       # TypeScript check all workspaces

# Web app only
pnpm --filter @plio/web dev
pnpm --filter @plio/web build
pnpm --filter @plio/web lint
pnpm --filter @plio/web type-check    # tsc --noEmit

# Tests (only in packages/utils)
pnpm --filter @plio/utils test        # vitest run (once)
pnpm --filter @plio/utils test:watch  # vitest watch
# Single test: cd packages/utils && pnpm vitest run src/__tests__/date-helpers.test.ts

# Supabase
supabase db push      # Apply migrations locally
```

## Architecture

**Monorepo:** Turborepo + pnpm workspaces. Package manager is pnpm 9.15.9.

```
apps/web/          → Next.js 16 (App Router), React 19, TypeScript 5.9
packages/db/       → Database types (@plio/db) — manually maintained, mirrors Supabase schema
packages/utils/    → Pure utilities (@plio/utils) — date-helpers, rrule-parser, gst-calculator
packages/ui/       → Shared UI components (@plio/ui)
packages/email/    → Email templates (@plio/email)
supabase/          → Migrations (SQL) and config
```

**Import alias:** `@/*` resolves to `apps/web/*` (NOT `apps/web/app/*`). So `@/components/ui/button` = `apps/web/components/ui/button.tsx`. Cross-package imports use `@plio/db`, `@plio/utils`, `@plio/ui`.

### Web App Structure

`components/`, `lib/`, `stores/`, `hooks/` are **siblings** to `app/` (not nested inside it).

**Route groups** in `app/`:
- `(auth)/` — Auth pages (login, signup, forgot-password)
- `(public)/` — Unauthenticated pages (booking, privacy, terms, invite, register)
- `(dashboard)/` — Protected, single layout for all roles (redirects to `/login` if no session)
  - `dashboard/`, `calendar/`, `clients/`, `services/`, `team/`, `rooms/`, `invoicing/`, `settings/` — Module pages
  - `admin/`, `booking/`, `parent/`, `tutor/` — Role-specific pages
  - `platform/` — Super admin only (waitlist, tenants)
- `onboarding/` — Multi-step wizard for new tenants

### Page Pattern

Server `page.tsx` → `page-client.tsx` ("use client") → table/form/detail components.

Server page fetches data via `getTenantId()` + Supabase query. Client page manages UI state (dialogs, sheets, forms).

### Server Actions Pattern

```
getTenantId() → Zod validation → Supabase query (RLS-scoped) → revalidatePath
```

`getTenantId()` is in `lib/auth/cached.ts` — uses React `cache()` so it only runs once per request. Returns `{ tenantId, profileId, role }`.

`getTenantModules()` is in `lib/auth/cached.ts` — fetches enabled modules for the tenant. `requireModule(slug)` in `lib/auth/module-guard.ts` — returns `notFound()` if module not enabled.

### Supabase Clients

- `lib/supabase/server.ts` — `createClient()`: SSR client with cookie auth. Used in Server Components and Actions for authenticated users.
- `lib/supabase/client.ts` — `createBrowserClient()`: For "use client" components.
- `lib/supabase/admin.ts` — `createAdminClient()`: Service role key, bypasses RLS. Server-only. Used for public/unauthenticated operations (booking page, waitlist, invites).

### Multi-Tenancy

Every table has `tenant_id`. RLS policies in `supabase/migrations/00013_rls_policies.sql` enforce tenant isolation via `get_user_tenant_ids()` and `get_user_role(tenant_id)` helper functions. Module system: `modules` table (9 system modules, seeded) + `tenant_modules` table (per-tenant config with enabled, custom_title, sort_order). Additional modular policies in `00026_modular_rls_policies.sql` including `anon` access for public booking.

### State Management

Zustand stores in `stores/`. Used in "use client" components only.

- `module-store.ts` — `useModuleStore` with `isModuleEnabled`, `getModuleTitle`
- `tenant-store.ts` — simplified TenantSettings (logo_url, accent_color, business_name)
- `calendar-store.ts` — view, colorBy, filters
- `notification-store.ts` — unread count tracking
- `parent-store.ts` — parent portal state

## Conventions

- **Styling:** Tailwind CSS v4 (`@import "tailwindcss"` syntax in `globals.css`). shadcn UI (New York style). Use `cn()` from `@/lib/utils` for conditional classes.
- **Validation:** Zod v4 for schema validation, paired with React Hook Form via `@hookform/resolvers`.
- **Icons:** Lucide React (`lucide-react`).
- **Calendar:** FullCalendar v6 (`@fullcalendar/react`).
- **Toasts:** Sonner (`sonner`).
- **Design tokens:** Primary = Indigo `#6366f1`, Sidebar = Slate 900 `#0f172a`.
- **Module system:** 9 modules (dashboard, calendar, clients, services, team, rooms, invoicing, booking, settings). 3 always-on (dashboard, team, settings).
- **Roles:** `super_admin`, `admin`, `staff`, `client`.
- **Timezone:** Singapore (`Asia/Singapore`) throughout. Date helpers in `@plio/utils` use `Intl.DateTimeFormat`.
