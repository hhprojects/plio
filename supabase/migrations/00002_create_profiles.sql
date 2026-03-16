-- Migration: 00002_create_profiles
-- Description: Create the profiles table with auth trigger.
-- Profiles link Supabase Auth users to tenants with role-based access.

CREATE TABLE profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  role        text        NOT NULL DEFAULT 'parent',
  full_name   text        NOT NULL,
  email       text        NOT NULL,
  phone       text,
  avatar_url  text,
  nric_masked text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_role_check
    CHECK (role IN ('super_admin', 'admin', 'tutor', 'parent')),

  CONSTRAINT profiles_tenant_user_unique
    UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

COMMENT ON TABLE profiles IS 'User profiles linking Supabase Auth users to tenants with roles.';
COMMENT ON COLUMN profiles.role IS 'One of: super_admin, admin, tutor, parent.';
COMMENT ON COLUMN profiles.nric_masked IS 'Masked NRIC, e.g. T****567A.';

-- Trigger function: on_auth_user_created
-- Creates a skeleton profile when a new user signs up via Supabase Auth.
-- NOTE: tenant_id and full_name are not available from auth metadata alone.
-- The signup flow must either:
--   (a) pass tenant_id and full_name in auth.users.raw_user_meta_data, or
--   (b) create the profile row separately after signup.
-- This trigger handles case (a). If metadata is missing, the row won't be inserted
-- and the application layer must create the profile manually.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
  _full_name text;
  _role text;
BEGIN
  _tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::uuid;
  _full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', '');
  _role      := COALESCE(NEW.raw_user_meta_data ->> 'role', 'parent');

  -- Only insert if tenant_id is provided
  IF _tenant_id IS NOT NULL THEN
    INSERT INTO public.profiles (tenant_id, user_id, role, full_name, email)
    VALUES (
      _tenant_id,
      NEW.id,
      _role,
      _full_name,
      COALESCE(NEW.email, '')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
