import { createClient } from '@supabase/supabase-js';

// Supabase credentials – set these in a .env file at the project root.
// VITE_ prefix is required for Vite to expose them to the client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
