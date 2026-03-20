// App-wide constants for Plio

export const USER_ROLES = ['super_admin', 'admin', 'staff', 'client'] as const;
export const CLASS_STATUSES = ['scheduled', 'cancelled', 'holiday'] as const;
export const ENROLLMENT_STATUSES = ['confirmed', 'attended', 'no_show', 'cancelled', 'makeup'] as const;
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'void'] as const;
export const PAYMENT_METHODS = ['paynow', 'stripe', 'cash', 'bank_transfer'] as const;
export const PAYMENT_STATUSES = ['pending_verification', 'verified', 'rejected'] as const;
export const WAITLIST_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const INVITATION_STATUSES = ['pending', 'accepted', 'expired'] as const;
export const BUSINESS_TYPES = ['tuition', 'yoga', 'music', 'enrichment', 'other'] as const;

// Display labels
export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
  client: 'Client',
};

export const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  holiday: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-green-100 text-green-800',
  attended: 'bg-green-100 text-green-800',
  no_show: 'bg-red-100 text-red-800',
  makeup: 'bg-purple-100 text-purple-800',
  // Appointment statuses
  completed: 'bg-green-100 text-green-800',
  // Waitlist statuses
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  // Invitation statuses
  accepted: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  tuition: 'Tuition Centre',
  yoga: 'Yoga Studio',
  music: 'Music School',
  enrichment: 'Enrichment Centre',
  other: 'Other',
};

export const WAITLIST_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const INVITATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
};

export const SG_TIMEZONE = 'Asia/Singapore';
export const DEFAULT_CANCELLATION_HOURS = 24;
export const DEFAULT_GST_RATE = 9; // 9% GST
export const DEFAULT_CURRENCY = 'SGD';

// Tenant settings defaults
export const DEFAULT_ACCENT_COLOR = '#6366f1';
export const DEFAULT_REMINDER_HOURS_BEFORE = 24;
export const DEFAULT_CLASS_DURATION_MINUTES = 60;
export const DEFAULT_BOOKING_LEAD_TIME_HOURS = 2;

export const DEFAULT_TEMP_PASSWORD = 'password123';
export const DEFAULT_SLOT_INTERVAL_MINUTES = 15;
export const CHECKIN_TOKEN_EXPIRY_MS = 5 * 60 * 1000;
