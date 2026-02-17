// @plio/db — TypeScript types matching Supabase schema
// These types mirror the database tables defined in supabase/migrations/.
// Format follows Supabase generated types conventions.

// ============================================================================
// Enums / Union Types
// ============================================================================

export type SubscriptionTier = 'free' | 'starter' | 'pro';

export type UserRole = 'super_admin' | 'admin' | 'tutor' | 'parent' | 'practitioner' | 'client';

export type ClassInstanceStatus = 'scheduled' | 'cancelled' | 'holiday';

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
export type BusinessType = 'education' | 'wellness';
export type WaitlistBusinessType = 'tuition' | 'yoga' | 'music' | 'enrichment' | 'other';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type PaymentMethod = 'paynow' | 'cash' | 'bank_transfer' | 'stripe';
export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';

// ============================================================================
// Settings types
// ============================================================================

export interface TenantSettings {
  timezone?: string;
  currency?: string;
  cancellation_hours?: number;
  gst_registered?: boolean;
  gst_rate?: number;
  logo_url?: string;
  default_buffer_minutes?: number;
  slot_interval_minutes?: number;
  cancellation_window_hours?: number;
}

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
  business_type: BusinessType;
  settings: TenantSettings | null;
  subscription_tier: SubscriptionTier;
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

export interface Student {
  id: string;
  tenant_id: string;
  parent_id: string;
  full_name: string;
  date_of_birth: string | null;
  school: string | null;
  level: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  default_price: number;
  color_code: string;
  max_capacity: number;
  is_active: boolean;
  created_at: string;
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

export interface RecurringSchedule {
  id: string;
  course_id: string;
  tenant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  tutor_id: string;
  room_id: string | null;
  recurrence_rule: string;
  effective_from: string;
  effective_until: string;
  is_active: boolean;
  created_at: string;
}

export interface ClassInstance {
  id: string;
  recurring_schedule_id: string | null;
  course_id: string;
  tenant_id: string;
  date: string;
  start_time: string;
  end_time: string;
  tutor_id: string;
  room_id: string | null;
  status: ClassInstanceStatus;
  max_capacity: number;
  override_notes: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_instance_id: string;
  tenant_id: string;
  status: EnrollmentStatus;
  checked_in_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  tenant_id: string;
  student_id: string;
  amount: number;
  reason: CreditReason;
  class_instance_id: string | null;
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
  parent_id: string;
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

// ============================================================================
// Wellness Types
// ============================================================================

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Service {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price: number;
  buffer_minutes: number | null;
  color_code: string;
  is_active: boolean;
  created_at: string;
}

export type ServiceInsert = Omit<Service, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ServiceUpdate = Partial<Omit<Service, 'id'>> & { id: string };

export interface Client {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export type ClientInsert = Omit<Client, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ClientUpdate = Partial<Omit<Client, 'id'>> & { id: string };

export interface PractitionerAvailability {
  id: string;
  tenant_id: string;
  practitioner_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export type PractitionerAvailabilityInsert = Omit<PractitionerAvailability, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export interface AvailabilityOverride {
  id: string;
  tenant_id: string;
  practitioner_id: string;
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export type AvailabilityOverrideInsert = Omit<AvailabilityOverride, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export interface Appointment {
  id: string;
  tenant_id: string;
  service_id: string;
  practitioner_id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  cancellation_reason: string | null;
  created_at: string;
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'status'> & {
  id?: string;
  created_at?: string;
  status?: AppointmentStatus;
};

export type AppointmentUpdate = Partial<Omit<Appointment, 'id'>> & { id: string };

export interface ClientNote {
  id: string;
  tenant_id: string;
  client_id: string;
  appointment_id: string | null;
  practitioner_id: string;
  content: string;
  created_at: string;
}

export type ClientNoteInsert = Omit<ClientNote, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// ============================================================================
// Insert types (omit server-generated fields)
// ============================================================================

export type TenantInsert = Omit<Tenant, 'id' | 'created_at' | 'business_type'> & {
  id?: string;
  created_at?: string;
  business_type?: BusinessType;
};

export type ProfileInsert = Omit<Profile, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type StudentInsert = Omit<Student, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type CourseInsert = Omit<Course, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type RoomInsert = Omit<Room, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type HolidayInsert = Omit<Holiday, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type RecurringScheduleInsert = Omit<RecurringSchedule, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ClassInstanceInsert = Omit<ClassInstance, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type EnrollmentInsert = Omit<Enrollment, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
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

// ============================================================================
// Update types (all fields optional except id)
// ============================================================================

export type TenantUpdate = Partial<Omit<Tenant, 'id'>> & { id: string };
export type ProfileUpdate = Partial<Omit<Profile, 'id'>> & { id: string };
export type StudentUpdate = Partial<Omit<Student, 'id'>> & { id: string };
export type CourseUpdate = Partial<Omit<Course, 'id'>> & { id: string };
export type RoomUpdate = Partial<Omit<Room, 'id'>> & { id: string };
export type HolidayUpdate = Partial<Omit<Holiday, 'id'>> & { id: string };
export type RecurringScheduleUpdate = Partial<Omit<RecurringSchedule, 'id'>> & { id: string };
export type ClassInstanceUpdate = Partial<Omit<ClassInstance, 'id'>> & { id: string };
export type EnrollmentUpdate = Partial<Omit<Enrollment, 'id'>> & { id: string };
export type NotificationUpdate = Partial<Omit<Notification, 'id'>> & { id: string };
export type WaitlistUpdate = Partial<Omit<Waitlist, 'id'>> & { id: string };
export type InvitationUpdate = Partial<Omit<Invitation, 'id'>> & { id: string };
export type PractitionerAvailabilityUpdate = Partial<Omit<PractitionerAvailability, 'id'>> & { id: string };
export type AvailabilityOverrideUpdate = Partial<Omit<AvailabilityOverride, 'id'>> & { id: string };
export type ClientNoteUpdate = Partial<Omit<ClientNote, 'id'>> & { id: string };

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
  students: {
    Row: Student;
    Insert: StudentInsert;
    Update: StudentUpdate;
  };
  courses: {
    Row: Course;
    Insert: CourseInsert;
    Update: CourseUpdate;
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
  recurring_schedules: {
    Row: RecurringSchedule;
    Insert: RecurringScheduleInsert;
    Update: RecurringScheduleUpdate;
  };
  class_instances: {
    Row: ClassInstance;
    Insert: ClassInstanceInsert;
    Update: ClassInstanceUpdate;
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
  services: {
    Row: Service;
    Insert: ServiceInsert;
    Update: ServiceUpdate;
  };
  clients: {
    Row: Client;
    Insert: ClientInsert;
    Update: ClientUpdate;
  };
  practitioner_availability: {
    Row: PractitionerAvailability;
    Insert: PractitionerAvailabilityInsert;
    Update: PractitionerAvailabilityUpdate;
  };
  availability_overrides: {
    Row: AvailabilityOverride;
    Insert: AvailabilityOverrideInsert;
    Update: AvailabilityOverrideUpdate;
  };
  appointments: {
    Row: Appointment;
    Insert: AppointmentInsert;
    Update: AppointmentUpdate;
  };
  client_notes: {
    Row: ClientNote;
    Insert: ClientNoteInsert;
    Update: ClientNoteUpdate;
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
      class_instance_status: ClassInstanceStatus;
      enrollment_status: EnrollmentStatus;
      credit_reason: CreditReason;
      audit_action: AuditAction;
      waitlist_status: WaitlistStatus;
      invitation_status: InvitationStatus;
      business_type: BusinessType;
      appointment_status: AppointmentStatus;
    };
  };
}
