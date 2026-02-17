-- Migration: 00023_add_wellness_roles
-- Description: Add practitioner and client roles to profiles role check constraint

ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'tutor', 'parent', 'practitioner', 'client'));
