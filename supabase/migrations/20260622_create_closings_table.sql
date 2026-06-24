-- Migration: 20260622_create_closings_table
-- Purpose: Add closings table for Dashboard Closing section

CREATE TABLE IF NOT EXISTS closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT,
  status TEXT DEFAULT 'Pending',
  selected_type TEXT DEFAULT 'Pending',
  marked_by_user_id UUID,
  marked_by_name TEXT,
  closing_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  visitor_id UUID REFERENCES visitor_logs(id) ON DELETE CASCADE,
  UNIQUE (visitor_id)
);

-- client_id is nullable now
ALTER TABLE closings ALTER COLUMN client_id DROP NOT NULL;

-- Enable RLS
ALTER TABLE closings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users on closings"
ON closings FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users on closings"
ON closings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on closings"
ON closings FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on closings"
ON closings FOR DELETE
USING (true);
