import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log("Supabase Client Init: URL =", supabaseUrl, "Key =", supabaseAnonKey ? "PRESENT" : "MISSING");

const isConfigured = 
  supabaseUrl && 
  supabaseUrl.includes('supabase.co') && 
  !supabaseUrl.includes('your-project-id');

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (typeof window !== 'undefined') {
  window.supabase = supabase;
}
