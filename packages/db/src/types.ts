// @plio/db — TypeScript types matching Supabase schema
// These types mirror the database tables defined in supabase/migrations/.
// Format follows Supabase generated types conventions.

// ============================================================================
// Enums / Union Types
// ============================================================================

export type SubscriptionTier = 'free' | 'starter' | 'pro';

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'client';

export type ServiceType = 'recurring' | 'bookable';

export type SessionStatus = 'scheduled' | 'cancelled' | 'completed' | 'no_show';

export type SessionType = 'class' | 'appointment';

export type EnrollmentStatus =
  | 'confirmed'
  | 'attended'
  | 'no_show'
  | 'cancelled'
  | 'makeup';

export type CreditReason =
  | 'purchase'
  | 'cancellation_refund'
  | 'makeup_booking'
  | 'admin_adjustment'
  | 'expiry';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'cancel'
  | 'verify'
  | 'login';

export type WaitlistStatus = 'pending' | 'approved' | 'rejected';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';
export type WaitlistBusinessType = 'tuition' | 'yoga' | 'music' | 'enrichment' | 'other';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type PaymentMethod = 'paynow' | 'cash' | 'bank_transfer' | 'stripe';
export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';

// ============================================================================
// Settings & Config types
// ============================================================================

export interface TenantSettings {
  logo_url?: string;
  accent_color?: string;
  business_name?: string;
  timezone?: string;
  currency?: string;
  cancellation_hours?: number;
  gst_registered?: boolean;
  gst_rate?: number;
}

export interface CalendarModuleConfig {
  recurring_enabled?: boolean;
  appointments_enabled?: boolean;
}

export type ModuleConfig = CalendarModuleConfig | Record<string, unknown>;

export interface AuditChanges {
  [field: string]: {
    old: unknown;
    new: unknown;
  };
}

// ============================================================================
// Table Row Types
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings | null;
  subscription_tier: SubscriptionTier;
  active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  user_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  nric_masked: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Module {
  id: string;
  slug: string;
  default_title: string;
  icon: string;
  always_on: boolean;
  dependencies: string[];
  created_at: string;
}

export interface TenantModule {
  id: string;
  tenant_id: string;
  module_id: string;
  enabled: boolean;
  custom_title: string | null;
  sort_order: number;
  config: ModuleConfig;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactDependent {
  id: string;
  tenant_id: string;
  contact_id: string;
  name: string;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamAvailability {
  id: string;
  tenant_id: string;
  team_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface AvailabilityOverride {
  id: string;
  tenant_id: string;
  team_member_id: string;
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  type: ServiceType;
  duration_minutes: number | null;
  capacity: number | null;
  price: number | null;
  currency: string;
  buffer_minutes: number;
  color: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  tenant_id: string;
  service_id: string;
  team_member_id: string;
  room_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  rrule: string | null;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  tenant_id: string;
  service_id: string;
  schedule_id: string | null;
  team_member_id: string;
  room_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  type: SessionType;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  tenant_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface Holiday {
  id: string;
  tenant_id: string;
  date: string;
  name: string;
  is_national: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  tenant_id: string;
  session_id: string;
  contact_id: string;
  dependent_id: string | null;
  status: EnrollmentStatus;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  tenant_id: string;
  contact_id: string;
  amount: number;
  reason: CreditReason;
  session_id: string | null;
  invoice_id: string | null;
  created_by: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  actor_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  changes: AuditChanges | null;
  ip_address: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface Waitlist {
  id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string;
  business_type: WaitlistBusinessType;
  message: string | null;
  status: WaitlistStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  tenant_id: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  invited_by: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface LineItem {
  description: string;
  student_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  contact_id: string;
  line_items: LineItem[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  tenant_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  receipt_url: string | null;
  stripe_payment_id: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface ContactNote {
  id: string;
  tenant_id: string;
  contact_id: string;
  team_member_id: string | null;
  session_id: string | null;
  content: string;
  created_at: string;
}

// ============================================================================
// Joined types
// ============================================================================

export interface TenantModuleWithModule extends TenantModule {
  module: Module;
}

// ============================================================================
// Insert types (omit server-generated fields)
// ============================================================================

export type TenantInsert = Omit<Tenant, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ProfileInsert = Omit<Profile, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ModuleInsert = Omit<Module, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type TenantModuleInsert = Omit<TenantModule, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ContactDependentInsert = Omit<ContactDependent, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TeamMemberInsert = Omit<TeamMember, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TeamAvailabilityInsert = Omit<TeamAvailability, 'id'> & {
  id?: string;
};

export type AvailabilityOverrideInsert = Omit<AvailabilityOverride, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ScheduleInsert = Omit<Schedule, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SessionInsert = Omit<Session, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RoomInsert = Omit<Room, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type HolidayInsert = Omit<Holiday, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type EnrollmentInsert = Omit<Enrollment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CreditLedgerInsert = Omit<CreditLedgerEntry, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type AuditLogInsert = Omit<AuditLogEntry, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type WaitlistInsert = Omit<Waitlist, 'id' | 'created_at' | 'status' | 'reviewed_by' | 'reviewed_at' | 'tenant_id'> & {
  id?: string;
  created_at?: string;
  status?: WaitlistStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  tenant_id?: string | null;
};

export type InvitationInsert = Omit<Invitation, 'id' | 'created_at' | 'status' | 'expires_at' | 'accepted_at'> & {
  id?: string;
  created_at?: string;
  status?: InvitationStatus;
  expires_at?: string;
  accepted_at?: string | null;
};

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type PaymentInsert = Omit<Payment, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ContactNoteInsert = Omit<ContactNote, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// ============================================================================
// Update types (all fields optional except id)
// ============================================================================

export type TenantUpdate = Partial<Omit<Tenant, 'id'>> & { id: string };
export type ProfileUpdate = Partial<Omit<Profile, 'id'>> & { id: string };
export type TenantModuleUpdate = Partial<Omit<TenantModule, 'id'>> & { id: string };
export type ContactUpdate = Partial<Omit<Contact, 'id'>> & { id: string };
export type ContactDependentUpdate = Partial<Omit<ContactDependent, 'id'>> & { id: string };
export type TeamMemberUpdate = Partial<Omit<TeamMember, 'id'>> & { id: string };
export type TeamAvailabilityUpdate = Partial<Omit<TeamAvailability, 'id'>> & { id: string };
export type AvailabilityOverrideUpdate = Partial<Omit<AvailabilityOverride, 'id'>> & { id: string };
export type ServiceUpdate = Partial<Omit<Service, 'id'>> & { id: string };
export type ScheduleUpdate = Partial<Omit<Schedule, 'id'>> & { id: string };
export type SessionUpdate = Partial<Omit<Session, 'id'>> & { id: string };
export type RoomUpdate = Partial<Omit<Room, 'id'>> & { id: string };
export type HolidayUpdate = Partial<Omit<Holiday, 'id'>> & { id: string };
export type EnrollmentUpdate = Partial<Omit<Enrollment, 'id'>> & { id: string };
export type NotificationUpdate = Partial<Omit<Notification, 'id'>> & { id: string };
export type WaitlistUpdate = Partial<Omit<Waitlist, 'id'>> & { id: string };
export type InvitationUpdate = Partial<Omit<Invitation, 'id'>> & { id: string };
export type InvoiceUpdate = Partial<Omit<Invoice, 'id'>> & { id: string };
export type PaymentUpdate = Partial<Omit<Payment, 'id'>> & { id: string };
export type ContactNoteUpdate = Partial<Omit<ContactNote, 'id'>> & { id: string };

// ============================================================================
// Database type (Supabase-style)
// ============================================================================

export interface DatabaseTables {
  tenants: {
    Row: Tenant;
    Insert: TenantInsert;
    Update: TenantUpdate;
  };
  profiles: {
    Row: Profile;
    Insert: ProfileInsert;
    Update: ProfileUpdate;
  };
  modules: {
    Row: Module;
    Insert: ModuleInsert;
    Update: never;
  };
  tenant_modules: {
    Row: TenantModule;
    Insert: TenantModuleInsert;
    Update: TenantModuleUpdate;
  };
  contacts: {
    Row: Contact;
    Insert: ContactInsert;
    Update: ContactUpdate;
  };
  contact_dependents: {
    Row: ContactDependent;
    Insert: ContactDependentInsert;
    Update: ContactDependentUpdate;
  };
  team_members: {
    Row: TeamMember;
    Insert: TeamMemberInsert;
    Update: TeamMemberUpdate;
  };
  team_availability: {
    Row: TeamAvailability;
    Insert: TeamAvailabilityInsert;
    Update: TeamAvailabilityUpdate;
  };
  availability_overrides: {
    Row: AvailabilityOverride;
    Insert: AvailabilityOverrideInsert;
    Update: AvailabilityOverrideUpdate;
  };
  services: {
    Row: Service;
    Insert: ServiceInsert;
    Update: ServiceUpdate;
  };
  schedules: {
    Row: Schedule;
    Insert: ScheduleInsert;
    Update: ScheduleUpdate;
  };
  sessions: {
    Row: Session;
    Insert: SessionInsert;
    Update: SessionUpdate;
  };
  rooms: {
    Row: Room;
    Insert: RoomInsert;
    Update: RoomUpdate;
  };
  holidays: {
    Row: Holiday;
    Insert: HolidayInsert;
    Update: HolidayUpdate;
  };
  enrollments: {
    Row: Enrollment;
    Insert: EnrollmentInsert;
    Update: EnrollmentUpdate;
  };
  credit_ledger: {
    Row: CreditLedgerEntry;
    Insert: CreditLedgerInsert;
    Update: never;
  };
  audit_log: {
    Row: AuditLogEntry;
    Insert: AuditLogInsert;
    Update: never;
  };
  notifications: {
    Row: Notification;
    Insert: NotificationInsert;
    Update: NotificationUpdate;
  };
  waitlist: {
    Row: Waitlist;
    Insert: WaitlistInsert;
    Update: WaitlistUpdate;
  };
  invitations: {
    Row: Invitation;
    Insert: InvitationInsert;
    Update: InvitationUpdate;
  };
  invoices: {
    Row: Invoice;
    Insert: InvoiceInsert;
    Update: InvoiceUpdate;
  };
  payments: {
    Row: Payment;
    Insert: PaymentInsert;
    Update: PaymentUpdate;
  };
  contact_notes: {
    Row: ContactNote;
    Insert: ContactNoteInsert;
    Update: ContactNoteUpdate;
  };
}

export interface Database {
  public: {
    Tables: DatabaseTables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: SubscriptionTier;
      user_role: UserRole;
      service_type: ServiceType;
      session_status: SessionStatus;
      session_type: SessionType;
      enrollment_status: EnrollmentStatus;
      credit_reason: CreditReason;
      audit_action: AuditAction;
      waitlist_status: WaitlistStatus;
      invitation_status: InvitationStatus;
      invoice_status: InvoiceStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
    };
  };
}
