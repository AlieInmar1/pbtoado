import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Check if environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anonymous Key is missing. Make sure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY defined.'
  );
}

// Create Supabase client with URL and anon key
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Function to check if the Supabase connection is working
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('productboard_features').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Failed to check Supabase connection:', err);
    return false;
  }
}
