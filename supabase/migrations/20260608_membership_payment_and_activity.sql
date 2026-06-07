-- Add payment tracking columns to memberships
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS total_amount        numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_amount      numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount    numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status_detail text DEFAULT 'Pending';

-- Audit / Activity Log table
CREATE TABLE IF NOT EXISTS membership_activity_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id       uuid REFERENCES memberships(id) ON DELETE CASCADE,
  client_id           uuid REFERENCES clients(id) ON DELETE CASCADE,
  action_type         text NOT NULL,   -- 'Created', 'Updated', 'PaymentUpdated', 'PlanChanged', 'StatusChanged'
  action_description  text,
  performed_by_user_id uuid,
  performed_by_name   text,
  created_at          timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mal_membership_id ON membership_activity_logs(membership_id);
CREATE INDEX IF NOT EXISTS idx_mal_client_id ON membership_activity_logs(client_id);
