import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL Available:", !!import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase Key Available:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project-id')
);

if (!isConfigured) {
  console.error("Missing or invalid Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (typeof window !== 'undefined') {
  window.supabase = supabase;
}
