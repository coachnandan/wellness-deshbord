-- =============================================================================
-- MEMBERS TABLE MIGRATION
-- Anandam Wellness Center - Member Management System
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STEP 1: CREATE SEQUENCE FOR MEMBER ID GENERATION
-- Format: ANM-YYYY-00001
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS members_id_seq START 1;

-- Function to generate Member ID
CREATE OR REPLACE FUNCTION generate_member_id()
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
    year_part TEXT;
    formatted_id TEXT;
BEGIN
    -- Get next sequence value
    next_val := nextval('members_id_seq');
    
    -- Get current year
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Format: ANM-YYYY-00001
    formatted_id := 'ANM-' || year_part || '-' || LPAD(next_val::TEXT, 5, '0');
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 2: CREATE MEMBERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS members (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Auto-generated Member ID
    member_id TEXT UNIQUE NOT NULL DEFAULT generate_member_id(),
    
    -- Personal Information
    full_name TEXT NOT NULL CHECK (LENGTH(TRIM(full_name)) >= 3),
    mobile_number TEXT NOT NULL CHECK (mobile_number ~ '^[0-9]{10}$') UNIQUE,
    whatsapp_number TEXT CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^[0-9]{10}$'),
    email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') UNIQUE,
    dob DATE NOT NULL CHECK (dob <= CURRENT_DATE - INTERVAL '18 years'),
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    marital_status TEXT NOT NULL CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
    address TEXT NOT NULL CHECK (LENGTH(TRIM(address)) > 0),
    
    -- Purpose (Array for multiple selections)
    purpose TEXT[] NOT NULL CHECK (
        array_length(purpose, 1) > 0 AND
        purpose <@ ARRAY[
            'Weight Loss',
            'Weight Gain',
            'Yoga',
            'Meditation',
            'Fitness',
            'Stress Management',
            'General Wellness',
            'Business Opportunity',
            'Income Opportunity',
            'Side Income',
            'Health Improvement',
            'Lifestyle Improvement',
            'Personal Development'
        ]
    ),
    
    -- Membership Information
    member_type TEXT NOT NULL CHECK (member_type IN ('Coach', 'Member')),
    referral TEXT NOT NULL CHECK (referral IN ('Yes', 'No')),
    referred_by TEXT NOT NULL CHECK (LENGTH(TRIM(referred_by)) > 0),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete flag
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================================
-- STEP 3: CREATE UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_members_updated_at();

-- =============================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index on member_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);

-- Index on mobile_number for unique constraint and searches
CREATE INDEX IF NOT EXISTS idx_members_mobile_number ON members(mobile_number);

-- Index on email for unique constraint and searches
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

-- Index on created_at for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at DESC);

-- Index on is_active for filtering active members
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active) WHERE is_active = TRUE;

-- Index on member_type for filtering by type
CREATE INDEX IF NOT EXISTS idx_members_member_type ON members(member_type);

-- GIN index on purpose array for fast array queries
CREATE INDEX IF NOT EXISTS idx_members_purpose ON members USING GIN(purpose);

-- =============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 6: CREATE RLS POLICIES
-- =============================================================================

-- Policy: SELECT - Allow authenticated users to view active members
CREATE POLICY members_select_policy ON members
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Policy: INSERT - Allow authenticated users to create members
CREATE POLICY members_insert_policy ON members
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Policy: UPDATE - Allow authenticated users to update members
CREATE POLICY members_update_policy ON members
    FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- Policy: DELETE - Soft delete only (set is_active = false)
-- Note: Actual DELETE is restricted, use UPDATE to set is_active = false
CREATE POLICY members_delete_policy ON members
    FOR DELETE
    TO authenticated
    USING (FALSE);

-- =============================================================================
-- STEP 7: HELPER FUNCTIONS
-- =============================================================================

-- Function to soft delete a member (archive)
CREATE OR REPLACE FUNCTION archive_member(p_member_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE members SET is_active = FALSE WHERE id = p_member_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore an archived member
CREATE OR REPLACE FUNCTION restore_member(p_member_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE members SET is_active = TRUE WHERE id = p_member_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get member count by type
CREATE OR REPLACE FUNCTION get_member_count_by_type(p_member_type TEXT)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM members
    WHERE member_type = p_member_type AND is_active = TRUE;
    RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search members by name or mobile
CREATE OR REPLACE FUNCTION search_members(p_query TEXT)
RETURNS SETOF members AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM members
    WHERE is_active = TRUE
    AND (
        full_name ILIKE '%' || p_query || '%'
        OR mobile_number ILIKE '%' || p_query || '%'
        OR member_id ILIKE '%' || p_query || '%'
    )
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 8: COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE members IS 'Member management table for Anandam Wellness Center';
COMMENT ON COLUMN members.id IS 'Primary key - UUID';
COMMENT ON COLUMN members.member_id IS 'Auto-generated member ID in format ANM-YYYY-00001';
COMMENT ON COLUMN members.full_name IS 'Full name of the member (min 3 characters)';
COMMENT ON COLUMN members.mobile_number IS '10-digit mobile number (unique)';
COMMENT ON COLUMN members.whatsapp_number IS 'Optional 10-digit WhatsApp number';
COMMENT ON COLUMN members.email IS 'Valid email address (unique)';
COMMENT ON COLUMN members.dob IS 'Date of birth (must be 18+ years old)';
COMMENT ON COLUMN members.gender IS 'Gender: Male, Female, Other';
COMMENT ON COLUMN members.marital_status IS 'Marital status: Single, Married, Divorced, Widowed';
COMMENT ON COLUMN members.address IS 'Full address';
COMMENT ON COLUMN members.purpose IS 'Array of purposes/goals (multiple selection allowed)';
COMMENT ON COLUMN members.member_type IS 'Type: Coach or Member';
COMMENT ON COLUMN members.referral IS 'Referral status: Yes or No';
COMMENT ON COLUMN members.referred_by IS 'Name of referrer';
COMMENT ON COLUMN members.is_active IS 'Soft delete flag - FALSE means archived';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'members'
-- ORDER BY ordinal_position;
