import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixvgkkrlykjdvgdeiqmi.supabase.co';
const supabaseAnonKey = 'sb_publishable_fJTEIX9NxG9EOqIUflGTGg_6RzVfds6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Connecting and inserting to Supabase...");
  try {
    const testClient = {
      name: 'Rahul Sharma',
      contact: '9876543210',
      address: '123 Forest Sanctuary'
    };

    const { data: inserted, error: insertError } = await supabase
      .from('clients')
      .insert([testClient])
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
    } else {
      console.log("Inserted client successfully:", inserted);
    }
  } catch (err) {
    console.error("Unexpected script error:", err);
  }
}

run();
