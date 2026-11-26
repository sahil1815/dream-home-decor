-- Migration: Secure Admin Credentials & Session Versioning
-- Stores bcrypt password hashes and token_version per RBAC role (owner, manager, staff)
-- Strictly accessible ONLY via Supabase service_role (RLS enabled with zero public/anon/authenticated policies).

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  password_hash TEXT NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  password_updated_at TIMESTAMPTZ,
  updated_by TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS admin_users
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_role_unique
  ON admin_users (role);

-- Harden RLS: Never expose admin_users or password_hash via anon or authenticated keys
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access policy" ON admin_users;
DROP POLICY IF EXISTS "Admin manage admin users" ON admin_users;
REVOKE ALL ON TABLE admin_users FROM anon, authenticated;
