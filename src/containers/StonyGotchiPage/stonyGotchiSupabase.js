import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_STONYGOTCHI_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_STONYGOTCHI_SUPABASE_ANON_KEY;

let client;

export const getStonyGotchiSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing StonyGotchi Supabase configuration');
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
};
