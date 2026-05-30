import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Debug logs to confirm env vars are loaded
console.log("Supabase URL Available:", !!import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase Key Available:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

if (!isConfigured) {
  console.error(
    "Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

// Return null if not configured — AppContext will render the graceful error screen
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (typeof window !== 'undefined') {
  window.supabase = supabase;
}
