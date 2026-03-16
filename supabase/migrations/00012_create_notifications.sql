-- Migration: 00012_create_notifications
-- Description: Create the notifications table. In-app notifications for users.

CREATE TABLE notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text        NOT NULL,
  metadata   jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Efficiently query unread notifications for a user
CREATE INDEX idx_notifications_user_unread
  ON notifications(tenant_id, user_id, read_at);

COMMENT ON TABLE notifications IS 'In-app notifications. read_at = NULL means unread.';
COMMENT ON COLUMN notifications.metadata IS 'JSON for deep-linking and additional context.';
