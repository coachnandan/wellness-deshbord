-- =============================================================================
-- APPLICATION QUERIES FOR MEMBERS TABLE
-- Use these in your Supabase client / frontend code
-- =============================================================================

-- =============================================================================
-- 1. INSERT NEW MEMBER
-- =============================================================================
INSERT INTO members (
    full_name,
    mobile_number,
    whatsapp_number,
    email,
    dob,
    gender,
    marital_status,
    address,
    purpose,
    member_type,
    referral,
    referred_by
) VALUES (
    'Rahul Sharma',
    '9876543210',
    '9876543210',
    'rahul.sharma@gmail.com',
    '1995-06-15',
    'Male',
    'Single',
    '123 MG Road, Jaipur, Rajasthan 302001',
    ARRAY['Weight Loss', 'Fitness', 'Health Improvement'],
    'Member',
    'Yes',
    'Aditi Sharma'
) RETURNING id, member_id, full_name, created_at;

-- =============================================================================
-- 2. SELECT ALL ACTIVE MEMBERS (with pagination)
-- =============================================================================
SELECT 
    id,
    member_id,
    full_name,
    mobile_number,
    whatsapp_number,
    email,
    dob,
    gender,
    marital_status,
    address,
    purpose,
    member_type,
    referral,
    referred_by,
    created_at,
    updated_at
FROM members
WHERE is_active = TRUE
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- =============================================================================
-- 3. SELECT SINGLE MEMBER BY ID
-- Replace with actual UUID from your database
-- =============================================================================
-- SELECT * FROM members WHERE id = '550e8400-e29b-41d4-a716-446655440000' AND is_active = TRUE;

-- Get all member IDs first:
SELECT id, member_id, full_name FROM members WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 10;

-- =============================================================================
-- 4. SELECT MEMBER BY MEMBER_ID
-- =============================================================================
SELECT * FROM members WHERE member_id = 'ANM-2026-00001' AND is_active = TRUE;

-- =============================================================================
-- 5. UPDATE MEMBER
-- Replace '550e8400-e29b-41d4-a716-446655440000' with actual member ID
-- =============================================================================
-- UPDATE members SET
--     full_name = 'Rahul Sharma Updated',
--     mobile_number = '9876543211',
--     whatsapp_number = '9876543211',
--     email = 'rahul.updated@gmail.com',
--     dob = '1995-06-15',
--     gender = 'Male',
--     marital_status = 'Married',
--     address = '456 Park Street, Jaipur, Rajasthan 302002',
--     purpose = ARRAY['Yoga', 'Meditation', 'General Wellness'],
--     member_type = 'Member',
--     referral = 'Yes',
--     referred_by = 'Coach Aditi'
-- WHERE id = '550e8400-e29b-41d4-a716-446655440000'
-- RETURNING id, member_id, full_name, updated_at;

-- =============================================================================
-- 6. SOFT DELETE (ARCHIVE) MEMBER
-- Replace with actual UUID
-- =============================================================================
-- UPDATE members SET is_active = FALSE WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Or use the helper function:
-- SELECT archive_member('550e8400-e29b-41d4-a716-446655440000');

-- =============================================================================
-- 7. RESTORE ARCHIVED MEMBER
-- Replace with actual UUID
-- =============================================================================
-- SELECT restore_member('550e8400-e29b-41d4-a716-446655440000');

-- =============================================================================
-- 8. SEARCH MEMBERS (by name, mobile, or member_id)
-- =============================================================================
SELECT * FROM search_members('Rahul');

-- Or manual search:
SELECT 
    id,
    member_id,
    full_name,
    mobile_number,
    email,
    member_type,
    created_at
FROM members
WHERE is_active = TRUE
AND (
    full_name ILIKE '%rahul%'
    OR mobile_number ILIKE '%9876%'
    OR member_id ILIKE '%00001%'
)
ORDER BY created_at DESC;

-- =============================================================================
-- 9. FILTER BY MEMBER TYPE
-- =============================================================================
SELECT * FROM members 
WHERE is_active = TRUE 
AND member_type = 'Coach'
ORDER BY created_at DESC;

-- =============================================================================
-- 10. FILTER BY PURPOSE (array contains)
-- =============================================================================
SELECT * FROM members 
WHERE is_active = TRUE 
AND 'Weight Loss' = ANY(purpose)
ORDER BY created_at DESC;

-- Or check for multiple purposes:
SELECT * FROM members 
WHERE is_active = TRUE 
AND purpose && ARRAY['Weight Loss', 'Fitness']
ORDER BY created_at DESC;

-- =============================================================================
-- 11. COUNT MEMBERS BY TYPE
-- =============================================================================
SELECT member_type, COUNT(*) as total
FROM members
WHERE is_active = TRUE
GROUP BY member_type;

-- Or use helper:
SELECT get_member_count_by_type('Member');

-- =============================================================================
-- 12. GET MEMBERS JOINING THIS MONTH
-- =============================================================================
SELECT * FROM members
WHERE is_active = TRUE
AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY created_at DESC;

-- =============================================================================
-- 13. GET RECENT MEMBERS (last 7 days)
-- =============================================================================
SELECT * FROM members
WHERE is_active = TRUE
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- =============================================================================
-- 14. CHECK IF MOBILE NUMBER EXISTS
-- =============================================================================
SELECT EXISTS(
    SELECT 1 FROM members 
    WHERE mobile_number = '9876543210' 
    AND is_active = TRUE
);

-- =============================================================================
-- 15. CHECK IF EMAIL EXISTS
-- =============================================================================
SELECT EXISTS(
    SELECT 1 FROM members 
    WHERE email = 'rahul@gmail.com' 
    AND is_active = TRUE
);

-- =============================================================================
-- 16. GET NEXT MEMBER ID (preview before insert)
-- =============================================================================
SELECT 'ANM-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || 
       LPAD((last_value + 1)::TEXT, 5, '0') AS next_member_id
FROM members_id_seq;

-- =============================================================================
-- 17. BULK INSERT (for data migration)
-- =============================================================================
INSERT INTO members (
    full_name, mobile_number, email, dob, gender, 
    marital_status, address, purpose, member_type, referral, referred_by
) VALUES 
    ('Member One', '9876543201', 'one@gmail.com', '1990-01-01', 'Male', 'Single', 'Address 1', ARRAY['Fitness'], 'Member', 'No', 'Direct'),
    ('Member Two', '9876543202', 'two@gmail.com', '1991-02-02', 'Female', 'Married', 'Address 2', ARRAY['Yoga', 'Meditation'], 'Member', 'Yes', 'Friend'),
    ('Coach Three', '9876543203', 'three@gmail.com', '1985-03-03', 'Male', 'Single', 'Address 3', ARRAY['Fitness', 'Personal Development'], 'Coach', 'No', 'Direct');

-- =============================================================================
-- 18. STATS DASHBOARD QUERY
-- =============================================================================
SELECT 
    COUNT(*) FILTER (WHERE is_active = TRUE) AS total_active,
    COUNT(*) FILTER (WHERE member_type = 'Coach' AND is_active = TRUE) AS total_coaches,
    COUNT(*) FILTER (WHERE member_type = 'Member' AND is_active = TRUE) AS total_members,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_this_month,
    COUNT(*) FILTER (WHERE referral = 'Yes' AND is_active = TRUE) AS referred_count
FROM members;

-- =============================================================================
-- 19. EXPORT MEMBERS FOR REPORT
-- =============================================================================
SELECT 
    member_id AS "Member ID",
    full_name AS "Full Name",
    mobile_number AS "Mobile",
    email AS "Email",
    dob AS "Date of Birth",
    gender AS "Gender",
    marital_status AS "Marital Status",
    address AS "Address",
    array_to_string(purpose, ', ') AS "Purpose",
    member_type AS "Member Type",
    referral AS "Referral",
    referred_by AS "Referred By",
    TO_CHAR(created_at, 'DD-Mon-YYYY') AS "Joining Date"
FROM members
WHERE is_active = TRUE
ORDER BY created_at DESC;
