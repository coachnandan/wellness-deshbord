-- Migration: Set Database Timezone to IST (Asia/Kolkata)
-- Date: 2026-06-06

-- 1. Set the global timezone for the Postgres database
ALTER DATABASE postgres SET timezone TO 'Asia/Kolkata';

-- 2. Force the API to reload configuration and schema
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
