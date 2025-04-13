import { createClient } from '@supabase/supabase-js';

// Define environment variable types for TypeScript
declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key must be provided in environment variables: ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Create and export a fully initialized client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
