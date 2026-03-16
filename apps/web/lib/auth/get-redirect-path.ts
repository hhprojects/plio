import type { UserRole } from '@plio/db';

export function getRedirectPath(role: UserRole | undefined): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/admin';
    case 'staff':
      return '/calendar';
    case 'client':
      return '/calendar';
    default:
      return '/admin';
  }
}
