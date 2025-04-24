// Re-export the real Supabase client from src/lib/supabase.ts
// This ensures all components use the same Supabase client

import { supabase, checkSupabaseConnection } from '../../src/lib/supabase';

// Add better error handling for Supabase operations
export { supabase, checkSupabaseConnection };

// Helper function to handle Supabase errors consistently
export const handleSupabaseError = (error: any, context: string): void => {
  console.error(`Supabase error in ${context}:`, error);
  // In a production app, you might want to log this to a monitoring service
};
