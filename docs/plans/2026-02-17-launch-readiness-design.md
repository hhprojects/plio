# Launch Readiness: Design Document

**Date:** 2026-02-17
**Status:** Approved
**Scope:** Mark as Paid workflow, CSV Student Import, Privacy Policy & Terms of Service

---

## 1. "Mark as Paid" Payment Workflow

### 1.1 Database

Two new tables in a single migration, matching the spec in `Plio.md` (lines 344–384).

#### `invoices` table

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `tenant_id` | `uuid` FK → tenants | NOT NULL |
| `invoice_number` | `text` UNIQUE per tenant | Auto-generated `INV-YYYY-NNNN` |
| `parent_id` | `uuid` FK → profiles | NOT NULL |
| `line_items` | `jsonb` | `[{ description, student_name, quantity, unit_price, amount }]` |
| `subtotal` | `numeric(10,2)` | |
| `gst_rate` | `numeric(4,2)` | `0.00` if not GST-registered |
| `gst_amount` | `numeric(10,2)` | |
| `total` | `numeric(10,2)` | |
| `status` | `text` | `draft`, `sent`, `paid`, `overdue`, `void` |
| `due_date` | `date` | |
| `paid_at` | `timestamptz` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | `now()` |

Index: `(tenant_id, parent_id, status)`

#### `payments` table

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `invoice_id` | `uuid` FK → invoices | NOT NULL |
| `tenant_id` | `uuid` FK → tenants | NOT NULL |
| `method` | `text` | `paynow`, `cash`, `bank_transfer`, `stripe` |
| `amount` | `numeric(10,2)` | |
| `status` | `text` | `pending_verification`, `verified`, `rejected` |
| `receipt_url` | `text` | Nullable |
| `stripe_payment_id` | `text` | Nullable |
| `verified_by` | `uuid` FK → profiles | Nullable |
| `verified_at` | `timestamptz` | Nullable |
| `rejection_reason` | `text` | Nullable |
| `created_at` | `timestamptz` | `now()` |

#### RLS Policies

- **invoices:** Admin/super_admin full CRUD within tenant. Parents SELECT own invoices only.
- **payments:** Admin/super_admin full CRUD within tenant. Parents INSERT payments against own invoices, SELECT own payments.

### 1.2 TypeScript Types

Add to `packages/db/src/types.ts`:
- `InvoiceStatus` union type
- `PaymentMethod` union type
- `PaymentStatus` union type
- `Invoice` interface
- `Payment` interface
- `LineItem` interface

### 1.3 Admin UI — `/admin/invoices`

Following existing page pattern: server `page.tsx` → `page-client.tsx`

**Components:**
- `invoices-table.tsx` — columns: Invoice #, Parent, Total, Status badge, Due Date, Actions dropdown
- `invoice-form.tsx` — Dialog: select parent, add line items (description, student, qty, unit price), auto-calc totals with GST toggle based on tenant settings
- `mark-paid-dialog.tsx` — Quick dialog: payment method dropdown, amount (pre-filled), notes, confirm
- `generate-invoices-dialog.tsx` — Select month → auto-generate invoices for all parents with active enrollments

**Server Actions (`actions.ts`):**
- `getInvoices()` — list with parent join
- `createInvoice()` — manual creation with Zod validation
- `generateMonthlyInvoices()` — batch creation from enrollments
- `markInvoiceAsPaid()` — creates payment record + updates invoice status
- `voidInvoice()` — status change to void
- `updateInvoice()` — edit draft invoices

### 1.4 Parent UI — `/parent/fees` (replace "Coming soon")

- Outstanding invoices as cards with amount, due date, status badge
- Payment history list with paid/void status
- No payment submission from parent side for MVP

### 1.5 Sidebar Navigation

Add "Invoices" to admin sidebar navigation (under existing items).

---

## 2. CSV Student Import

### 2.1 Dependencies

- `papaparse` — CSV parsing library (~14KB)

### 2.2 UI — `/admin/students/import`

**Step 1: Upload**
- Drag-and-drop zone or file picker
- Accept `.csv` files only, max 1MB / 1000 rows
- Client-side parsing with papaparse

**Step 2: Column Mapping**
- Display detected CSV columns
- Dropdowns to map each to target fields:
  - `full_name` (required)
  - `level` (optional)
  - `school` (optional)
  - `date_of_birth` (optional)
  - `notes` (optional)
  - `parent_name` (required)
  - `parent_email` (required)
  - `parent_phone` (optional)

**Step 3: Preview & Validate**
- Show first 5 rows with mapped data
- Highlight validation errors (missing required fields, invalid email)
- Show total valid/invalid row counts

**Step 4: Import**
- Server action processes valid rows
- For each unique parent email: find existing profile or create new (role=parent, no user_id)
- For each student: create linked to parent
- Duplicate detection: skip if student with same `full_name` + `parent_id` exists
- Return summary: "Imported X students, created Y parents, Z rows skipped"

### 2.3 Entry Point

"Import CSV" button on the existing Students page, linking to `/admin/students/import`.

---

## 3. Privacy Policy & Terms of Service

### 3.1 Routes

- `/privacy` — under `(public)` route group, no auth required
- `/terms` — under `(public)` route group, no auth required

### 3.2 Privacy Policy Content

Covers:
- Data collected (name, email, phone, student info, attendance)
- Purpose (scheduling, attendance, invoicing)
- PDPA: Plio = Data Intermediary, tuition center = Data Controller
- Cookies (session management only)
- No third-party data selling
- Data retention and deletion rights
- Contact info

### 3.3 Terms of Service Content

Covers:
- Service description
- Account responsibilities
- Acceptable use
- Data ownership (tenant owns their data)
- Service availability (reasonable efforts, no SLA)
- Limitation of liability
- Singapore governing law
- Termination and data export

### 3.4 Footer Links

Add Privacy Policy and Terms of Service links to:
- Auth layout footer
- Admin sidebar footer
- Parent bottom-nav or footer
- Public pages footer

### 3.5 Disclaimer

Both pages include: "Last updated: 2026-02-17. Please review with your legal advisor before relying on these terms."
