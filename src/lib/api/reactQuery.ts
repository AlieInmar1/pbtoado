import { QueryClient } from '@tanstack/react-query';

/**
 * Configure React Query client with default options
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime in v4)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
