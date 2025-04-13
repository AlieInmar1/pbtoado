import { SupabaseFunctionProvider } from './supabase';
import { MockFunctionProvider } from './mock';
import type { FunctionProvider } from './types';

export * from './types';

let functionProvider: FunctionProvider;

export function initializeFunctions(
  supabaseUrl?: string,
  supabaseKey?: string
): FunctionProvider {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not provided, using mock function provider');
    functionProvider = new MockFunctionProvider();
  } else {
    functionProvider = new SupabaseFunctionProvider(supabaseUrl, supabaseKey);
  }

  return functionProvider;
}

export function getFunctions(): FunctionProvider {
  if (!functionProvider) {
    throw new Error('Function provider not initialized. Call initializeFunctions first.');
  }
  return functionProvider;
}