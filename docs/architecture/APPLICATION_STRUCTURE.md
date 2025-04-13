# Application Architecture

This document outlines the application architecture for the ProductBoard-ADO Integration rebuild, including folder structure, data flow, state management, and API integration strategies.

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Feature Organization](#2-feature-organization)
3. [State Management](#3-state-management)
4. [Data Fetching Strategy](#4-data-fetching-strategy)
5. [Routing Configuration](#5-routing-configuration)
6. [API Integration Layer](#6-api-integration-layer)
7. [Error Handling](#7-error-handling)
8. [Types and Interfaces](#8-types-and-interfaces)

## 1. Folder Structure

We're using a domain-driven, feature-based folder structure:

```
/src
  /features              # Domain-specific feature modules
    /auth                # Authentication, tokens, workspace selection
    /dashboard           # Main dashboard and overview components
    /hierarchy           # Product hierarchy visualization 
    /features            # Feature management components
    /rankings            # Feature prioritization and ranking views
    /stories             # Story management and grooming
    /sync                # Sync controls, history, and status
  
  /components            # Shared UI components
    /ui                  # Base UI primitives
    /layout              # Layout components
    /data-display        # Tables, charts, visualization components
    /feedback            # Alerts, toasts, progress indicators
    /forms               # Form controls and validation
  
  /hooks                 # Custom hooks
  /utils                 # Utility functions
  /services              # API clients and service layer
  /types                 # TypeScript type definitions
  /constants            # Application constants
  /assets               # Icons, images, and other static assets

  App.tsx               # Main application component
  main.tsx              # Application entry point
  index.css             # Global styles
```

### Key Benefits of This Structure

1. **Domain Isolation**: Each feature area is self-contained
2. **Developer Workflow**: Easy to find relevant files
3. **Code Splitting**: Natural boundaries for code splitting
4. **Testing Boundaries**: Clear testing isolation
5. **Feature Additions**: Easy to add new features

## 2. Feature Organization

Each feature folder follows a consistent internal structure:

```
/features
  /auth
    /components          # Feature-specific components
    /hooks               # Feature-specific hooks
    /utils               # Feature-specific utilities
    /types               # Feature-specific types
    /services            # Feature-specific services
    index.ts             # Public API
    AuthContext.tsx      # Feature-specific context (if needed)
    routes.tsx           # Feature routes
    api.ts               # API integration specific to this feature
```

### Isolation and Sharing

1. **Isolation**: Features only expose what's needed through index.ts exports
2. **Sharing**: Common functionality moved to shared folders (/components, /hooks, etc.)
3. **Dependency Direction**: Features can depend on shared code, but shared code should not depend on features

### Example Feature Structure

#### Dashboard Feature

```tsx
// /features/dashboard/index.ts
export { Dashboard } from './components/Dashboard';
export { useDashboardData } from './hooks/useDashboardData';
export { dashboardRoutes } from './routes';

// /features/dashboard/components/Dashboard.tsx
import { DashboardHeader } from './DashboardHeader';
import { StatusWidget } from './StatusWidget';
import { SyncStatusCard } from './SyncStatusCard';

export function Dashboard() {
  return (
    <div className="dashboard">
      <DashboardHeader />
      <div className="dashboard-grid">
        <StatusWidget title="Features" />
        <StatusWidget title="Hierarchy" />
        <SyncStatusCard />
        {/* More dashboard components */}
      </div>
    </div>
  );
}

// /features/dashboard/routes.tsx
import { Dashboard } from './components/Dashboard';

export const dashboardRoutes = [
  {
    path: '/',
    element: <Dashboard />,
  }
];
```

## 3. State Management

We use a hybrid state management approach:

### 3.1 Local Component State

- For component-specific UI state
- Use `useState`, `useReducer` hooks
- Example: Open/closed state of dropdowns, active tabs, etc.

```tsx
function FeatureActions() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div className="feature-actions">
      <Button onClick={() => setIsMenuOpen(!isMenuOpen)}>Actions</Button>
      {isMenuOpen && (
        <Menu onClose={() => setIsMenuOpen(false)}>
          <MenuItem>Edit</MenuItem>
          <MenuItem>Delete</MenuItem>
        </Menu>
      )}
    </div>
  );
}
```

### 3.2 React Context for Application State

- For shared state needed across components
- Organized by domain/feature
- Preference for multiple small contexts over a single large context

```tsx
// /features/auth/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Workspace } from '../../types';
import { fetchUserWorkspaces } from '../../services/api';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Implementation...
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 3.3 React Query for Server State

- For all data fetching and caching
- Separation of server state and client state
- Automatic refetching, caching, and synchronization

```tsx
// /features/features/hooks/useFeatures.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feature } from '../../../types';
import { fetchFeatures, updateFeature } from '../api';

export function useFeatures() {
  return useQuery<Feature[]>({
    queryKey: ['features'],
    queryFn: fetchFeatures,
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateFeature,
    onSuccess: () => {
      // Refetch features query
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}
```

## 4. Data Fetching Strategy

### 4.1 API Client Layer

We use a dedicated API client layer to handle all interactions with backend services:

```tsx
// /services/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export const createApiClient = (baseURL: string, config: AxiosRequestConfig = {}) => {
  const client = axios.create({
    baseURL,
    ...config,
  });
  
  // Request interceptor for auth tokens
  client.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
  // Response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    error => {
      // Handle common errors, refresh tokens, etc.
      return Promise.reject(error);
    }
  );
  
  return client;
};

// Create clients for different APIs
export const supabaseClient = createApiClient(process.env.VITE_SUPABASE_URL);
export const productBoardClient = createApiClient(process.env.VITE_PRODUCTBOARD_API_URL);
export const adoClient = createApiClient(process.env.VITE_ADO_API_URL);
```

### 4.2 Feature-Specific API Functions

Each feature has its own API functions:

```tsx
// /features/features/api.ts
import { supabaseClient } from '../../services/api/client';
import { Feature, FeatureUpdate } from '../../types';

export const fetchFeatures = async (): Promise<Feature[]> => {
  const response = await supabaseClient.get('/features');
  return response.data;
};

export const fetchFeature = async (id: string): Promise<Feature> => {
  const response = await supabaseClient.get(`/features/${id}`);
  return response.data;
};

export const updateFeature = async ({ id, data }: { id: string; data: FeatureUpdate }): Promise<Feature> => {
  const response = await supabaseClient.patch(`/features/${id}`, data);
  return response.data;
};
```

### 4.3 React Query Integration

Our data fetching approach with React Query:

1. **Query Keys**: Consistent naming and structure
2. **Prefetching**: Prefetch data for expected navigation
3. **Optimistic Updates**: Improve perceived performance
4. **Error Handling**: Consistent error handling and retries
5. **Caching**: Smart cache invalidation strategies

```tsx
// React Query provider setup
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

## 5. Routing Configuration

We're using React Router with a feature-based route organization:

### 5.1 Route Structure

```tsx
// /routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { authRoutes } from '../features/auth/routes';
import { dashboardRoutes } from '../features/dashboard/routes';
import { hierarchyRoutes } from '../features/hierarchy/routes';
import { featuresRoutes } from '../features/features/routes';
import { rankingsRoutes } from '../features/rankings/routes';
import { storiesRoutes } from '../features/stories/routes';
import { syncRoutes } from '../features/sync/routes';
import { NotFound } from '../components/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      ...dashboardRoutes,
      ...hierarchyRoutes,
      ...featuresRoutes,
      ...rankingsRoutes,
      ...storiesRoutes,
      ...syncRoutes,
    ],
  },
  ...authRoutes, // Auth routes are separate, not inside MainLayout
  {
    path: '*',
    element: <NotFound />,
  },
]);
```

### 5.2 Feature-Specific Routes

```tsx
// /features/hierarchy/routes.tsx
import { lazy } from 'react';
import { AuthGuard } from '../../components/AuthGuard';

const HierarchyExplorer = lazy(() => import('./components/HierarchyExplorer'));
const HierarchyDetail = lazy(() => import('./components/HierarchyDetail'));

export const hierarchyRoutes = [
  {
    path: '/hierarchy',
    element: (
      <AuthGuard>
        <HierarchyExplorer />
      </AuthGuard>
    ),
  },
  {
    path: '/hierarchy/:id',
    element: (
      <AuthGuard>
        <HierarchyDetail />
      </AuthGuard>
    ),
  },
];
```

### 5.3 Lazy Loading

We use React's lazy loading to reduce initial bundle size:

```tsx
import { lazy, Suspense } from 'react';
import { Loading } from '../components/feedback/Loading';

const Dashboard = lazy(() => import('../features/dashboard/components/Dashboard'));

function DashboardRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
}
```

## 6. API Integration Layer

### 6.1 Integration with Multiple APIs

We integrate with three main APIs:

1. **Supabase API**: For database access
2. **ProductBoard API**: For ProductBoard data
3. **Azure DevOps API**: For ADO integration

### 6.2 API Abstraction

Each API has a dedicated client and abstraction layer:

```tsx
// /services/api/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation } from '@tanstack/react-query';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Hooks for Supabase data access
export function useSupabaseQuery<T>(
  table: string,
  queryKey: string[],
  options = {}
) {
  return useQuery<T>({
    queryKey: [table, ...queryKey],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) throw error;
      return data as T;
    },
    ...options,
  });
}
```

### 6.3 Webhook & Event Handling

For real-time updates and webhooks:

```tsx
// /services/realtime/supabase.ts
import { supabase } from '../api/supabase';

export const subscribeToTable = (
  table: string,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) => {
  const subscription = supabase
    .channel(`table-changes:${table}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table 
    }, payload => {
      onInsert?.(payload);
    })
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table 
    }, payload => {
      onUpdate?.(payload);
    })
    .on('postgres_changes', { 
      event: 'DELETE', 
      schema: 'public', 
      table 
    }, payload => {
      onDelete?.(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
```

## 7. Error Handling

We implement a comprehensive error handling strategy:

### 7.1 API Error Handling

```tsx
// /services/api/error-handling.ts
import { AxiosError } from 'axios';

export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(error: AxiosError) {
    super(error.message);
    this.name = 'ApiError';
    this.status = error.response?.status || 0;
    this.data = error.response?.data;
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    return new ApiError(error);
  }
  
  if (error instanceof Error) {
    return new ApiError(new AxiosError(error.message, '500'));
  }
  
  return new ApiError(new AxiosError('Unknown error', '500'));
};
```

### 7.2 Error Boundaries

```tsx
// /components/ErrorBoundary.tsx
import React from 'react';
import { ErrorMessage } from './feedback/ErrorMessage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return <ErrorMessage error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 7.3 Query Error Handling

```tsx
// How we handle errors in React Query
import { useQuery } from '@tanstack/react-query';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { fetchFeatures } from '../api';

function FeaturesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['features'],
    queryFn: fetchFeatures,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage error={error} retry={() => refetch()} />;
  }

  return (
    <div>
      {data.map(feature => (
        <FeatureItem key={feature.id} feature={feature} />
      ))}
    </div>
  );
}
```

## 8. Types and Interfaces

We use TypeScript throughout the application:

### 8.1 Core Domain Types

```tsx
// /types/index.ts
export * from './auth';
export * from './features';
export * from './hierarchy';
export * from './sync';
```

### 8.2 Feature-Specific Types

```tsx
// /types/features.ts
export interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FeatureFilters {
  status?: Feature['status'];
  searchQuery?: string;
  dateRange?: [Date, Date];
  sortField?: keyof Feature;
  sortDirection?: 'asc' | 'desc';
}

export interface FeatureUpdate {
  title?: string;
  description?: string;
  status?: Feature['status'];
  priority?: number;
  metadata?: Record<string, any>;
}
```

### 8.3 API Response Types

```tsx
// /types/api.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
```

### 8.4 Utility Types

```tsx
// /types/utils.ts
export type Nullable<T> = T | null;

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type AsyncState<T> = {
  status: AsyncStatus;
  data: Nullable<T>;
  error: Nullable<Error>;
};

export type ID = string;

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
```

---

This architectural approach creates a scalable, maintainable, and performant application structure. By following these patterns, we can deliver a robust ProductBoard-ADO Integration that can evolve with changing requirements.
