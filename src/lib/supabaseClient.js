import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

// We export null if not configured to prevent immediate module crash,
// but we expect AppContext to handle this gracefully.
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (typeof window !== 'undefined') {
  window.supabase = supabase;
}
