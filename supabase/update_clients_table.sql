-- Migration to add new Client Profile Form fields safely
DO $$
BEGIN
    -- full_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'full_name') THEN
        ALTER TABLE public.clients ADD COLUMN full_name TEXT;
        -- Optional: backfill from name
        UPDATE public.clients SET full_name = name WHERE full_name IS NULL;
    END IF;

    -- mobile_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'mobile_number') THEN
        ALTER TABLE public.clients ADD COLUMN mobile_number TEXT;
        -- Optional: backfill from contact_number or contact
        UPDATE public.clients SET mobile_number = COALESCE(NULLIF(contact_number, ''), contact) WHERE mobile_number IS NULL;
        ALTER TABLE public.clients ADD CONSTRAINT unique_mobile_number UNIQUE (mobile_number);
    END IF;

    -- whatsapp_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE public.clients ADD COLUMN whatsapp_number TEXT;
    END IF;

    -- email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
        ALTER TABLE public.clients ADD COLUMN email TEXT;
    END IF;

    -- dob
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'dob') THEN
        ALTER TABLE public.clients ADD COLUMN dob DATE;
    END IF;

    -- gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'gender') THEN
        ALTER TABLE public.clients ADD COLUMN gender TEXT;
    END IF;

    -- marital_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'marital_status') THEN
        ALTER TABLE public.clients ADD COLUMN marital_status TEXT;
    END IF;

    -- joining_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'joining_date') THEN
        ALTER TABLE public.clients ADD COLUMN joining_date DATE;
    END IF;

    -- profession
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'profession') THEN
        ALTER TABLE public.clients ADD COLUMN profession TEXT;
    END IF;

    -- purpose
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'purpose') THEN
        ALTER TABLE public.clients ADD COLUMN purpose TEXT;
    END IF;

    -- member_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'member_type') THEN
        ALTER TABLE public.clients ADD COLUMN member_type TEXT;
    END IF;

    -- referred_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'referred_by') THEN
        ALTER TABLE public.clients ADD COLUMN referred_by TEXT;
    END IF;

END $$;
