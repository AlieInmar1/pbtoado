# Data Flow and State Management

This document outlines how data flows through the application and how state is managed in the ProductBoard-ADO Integration.

## Table of Contents

1. [State Management Overview](#1-state-management-overview)
2. [Data Flow Patterns](#2-data-flow-patterns)
3. [Server State Management](#3-server-state-management)
4. [Client State Management](#4-client-state-management)
5. [Form State Management](#5-form-state-management)
6. [State Persistence](#6-state-persistence)
7. [Performance Considerations](#7-performance-considerations)
8. [Testing State and Data Flow](#8-testing-state-and-data-flow)

## 1. State Management Overview

Our application uses a hybrid state management approach, with different strategies for different types of state:

| State Type | Management Approach | Examples |
|------------|---------------------|----------|
| Server State | React Query | API data, remote resource states |
| Global UI State | React Context | Authentication, themes, user preferences |
| Component State | Local state (useState/useReducer) | Modal open/closed, active tab index |
| Form State | React Hook Form | Input values, validation states, submission state |
| URL State | React Router | Current page, filter parameters |
| Derived State | React useMemo | Calculated values from other state |

### 1.1 State Management Principles

1. **Single Source of Truth**: Each piece of state should have one definitive owner
2. **Isolation of Concerns**: Separate server state from client state
3. **Minimal State**: Only store what's necessary, derive the rest
4. **Appropriate Scope**: Keep state at the correct level (global vs local)
5. **Type Safety**: All state is strongly typed with TypeScript

## 2. Data Flow Patterns

### 2.1 Unidirectional Data Flow

Our application follows unidirectional data flow principles:

```
┌─────────────────┐
│                 │
│  Server/API     │
│                 │
└────────┬────────┘
         │
         ▼
┌────────┴────────┐
│                 │
│  React Query    │◄──┐
│                 │   │
└────────┬────────┘   │
         │            │
         ▼            │
┌────────┴────────┐   │
│                 │   │
│  React Context  │   │
│  (App State)    │   │
│                 │   │
└────────┬────────┘   │
         │            │ Mutations/
         ▼            │ Actions
┌────────┴────────┐   │
│                 │   │
│  Container      │   │
│  Components     │   │
│                 │   │
└────────┬────────┘   │
         │            │
         ▼            │
┌────────┴────────┐   │
│                 │   │
│  Presentation   │   │
│  Components     │───┘
│                 │
└─────────────────┘
```

### 2.2 Component Data Flow Patterns

#### Props Down, Events Up

```tsx
// Parent component passes data down, receives events up
function FeaturesList() {
  const { data: features } = useFeatures();
  const { mutate: updateFeature } = useUpdateFeature();
  
  const handleStatusChange = (featureId: string, newStatus: string) => {
    updateFeature({ id: featureId, data: { status: newStatus } });
  };
  
  return (
    <div>
      {features.map(feature => (
        <FeatureItem
          key={feature.id}
          feature={feature}
          onStatusChange={(newStatus) => handleStatusChange(feature.id, newStatus)}
        />
      ))}
    </div>
  );
}

// Child component receives data via props, sends events up via callbacks
function FeatureItem({ feature, onStatusChange }) {
  return (
    <div className="feature-item">
      <h3>{feature.title}</h3>
      <StatusSelector 
        value={feature.status} 
        onChange={onStatusChange} 
      />
    </div>
  );
}
```

#### Compound Components Pattern

For tightly related component groups:

```tsx
// Compound component pattern
function Accordion({ children, defaultExpanded }) {
  const [expandedItems, setExpandedItems] = useState(defaultExpanded || []);
  
  const toggleItem = (itemId) => {
    setExpandedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  return (
    <AccordionContext.Provider value={{ expandedItems, toggleItem }}>
      <div className="accordion">
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ id, title, children }) {
  const { expandedItems, toggleItem } = useAccordionContext();
  const isExpanded = expandedItems.includes(id);
  
  return (
    <div className="accordion-item">
      <button 
        className="accordion-header"
        onClick={() => toggleItem(id)}
        aria-expanded={isExpanded}
      >
        {title}
      </button>
      {isExpanded && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
}

// Usage
<Accordion defaultExpanded={['item1']}>
  <AccordionItem id="item1" title="Feature Details">
    <FeatureDetails feature={feature} />
  </AccordionItem>
  <AccordionItem id="item2" title="Related Items">
    <RelatedItems featureId={feature.id} />
  </AccordionItem>
</Accordion>
```

## 3. Server State Management

We use React Query to manage all server state throughout the application.

### 3.1 Query Structure

```tsx
// /features/features/hooks/useFeatures.ts
import { useQuery } from '@tanstack/react-query';
import { Feature, FeatureFilters } from '../../../types';
import { fetchFeatures } from '../api';

export function useFeatures(filters?: FeatureFilters) {
  return useQuery({
    queryKey: ['features', filters],
    queryFn: () => fetchFeatures(filters),
  });
}

export function useFeature(id: string) {
  return useQuery({
    queryKey: ['features', id],
    queryFn: () => fetchFeature(id),
    enabled: !!id, // Only run query if ID is provided
  });
}
```

### 3.2 Mutation Structure

```tsx
// /features/features/hooks/useFeatureMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Feature, FeatureUpdate } from '../../../types';
import { updateFeature, createFeature, deleteFeature } from '../api';

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeatureUpdate }) => 
      updateFeature(id, data),
    
    // Update the cache optimistically
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['features', id] });
      
      // Snapshot the previous value
      const previousFeature = queryClient.getQueryData<Feature>(['features', id]);
      
      // Optimistically update to the new value
      queryClient.setQueryData<Feature>(['features', id], old => ({
        ...old!,
        ...data,
      }));
      
      // Return a context object with the snapshotted value
      return { previousFeature };
    },
    
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, { id }, context) => {
      queryClient.setQueryData(
        ['features', id],
        context?.previousFeature
      );
    },
    
    // Always refetch after error or success
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['features', id] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}
```

### 3.3 Query Client Setup

```tsx
// /src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 3.4 Custom Hooks for Common Patterns

```tsx
// /hooks/useInfiniteList.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { PaginatedResponse } from '../types';

export function useInfiniteList<T>({
  queryKey,
  fetchFn,
  pageSize = 20,
  filters = {},
}) {
  return useInfiniteQuery({
    queryKey: [queryKey, filters],
    queryFn: ({ pageParam = 1 }) => 
      fetchFn({ page: pageParam, pageSize, ...filters }),
    getNextPageParam: (lastPage: PaginatedResponse<T>) => 
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
  });
}
```

## 4. Client State Management

Client-specific state that doesn't come from the server is managed using React Context.

### 4.1 Context Structure

```tsx
// /features/auth/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Workspace } from '../../types';

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
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load initial auth state
  useEffect(() => {
    const loadInitialAuth = async () => {
      try {
        setIsLoading(true);
        // Load user from storage or API
        // Load workspaces
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };
    
    loadInitialAuth();
  }, []);
  
  const login = async (credentials: LoginCredentials) => {
    // Implementation
  };
  
  const logout = async () => {
    // Implementation
  };
  
  const selectWorkspace = (workspaceId: string) => {
    const selected = workspaces.find(w => w.id === workspaceId) || null;
    setWorkspace(selected);
    // Save to local storage
    if (selected) {
      localStorage.setItem('selectedWorkspace', workspaceId);
    }
  };
  
  const value = {
    user,
    workspace,
    workspaces,
    isLoading,
    error,
    login,
    logout,
    selectWorkspace,
  };
  
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

### 4.2 UI State Management

For UI-specific state that needs to be shared:

```tsx
// /features/ui/UIContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarExpanded: boolean;
  notifications: Notification[];
}

type UIAction = 
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'REMOVE_NOTIFICATION'; id: string };

const initialState: UIState = {
  theme: 'system',
  sidebarExpanded: true,
  notifications: [],
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarExpanded: !state.sidebarExpanded };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.notification],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id),
      };
    default:
      return state;
  }
}

const UIContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
} | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);
  
  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
```

## 5. Form State Management

We use React Hook Form for form state management:

### 5.1 Basic Form Pattern

```tsx
// /features/features/components/FeatureForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feature } from '../../../types';

// Form schema
const featureSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']),
  priority: z.number().min(1).max(10),
});

type FeatureFormValues = z.infer<typeof featureSchema>;

interface FeatureFormProps {
  initialData?: Partial<Feature>;
  onSubmit: (data: FeatureFormValues) => void;
  isSubmitting?: boolean;
}

export function FeatureForm({ initialData, onSubmit, isSubmitting }: FeatureFormProps) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: initialData,
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          {...register('title')}
          className={errors.title ? 'input-error' : ''}
        />
        {errors.title && (
          <p className="error-text">{errors.title.message}</p>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          {...register('description')}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select id="status" {...register('status')}>
          <option value="planned">Planned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {errors.status && (
          <p className="error-text">{errors.status.message}</p>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="priority">Priority (1-10)</label>
        <input
          id="priority"
          type="number"
          min="1"
          max="10"
          {...register('priority', { valueAsNumber: true })}
          className={errors.priority ? 'input-error' : ''}
        />
        {errors.priority && (
          <p className="error-text">{errors.priority.message}</p>
        )}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Feature'}
      </button>
    </form>
  );
}
```

### 5.2 Form Submission Pattern

```tsx
// Feature edit container example
import { useFeature, useUpdateFeature } from '../hooks';
import { FeatureForm } from './FeatureForm';

function EditFeature({ featureId, onSuccess }) {
  const { data: feature, isLoading } = useFeature(featureId);
  const { mutate, isPending } = useUpdateFeature();
  
  if (isLoading) {
    return <Loading />;
  }
  
  const handleSubmit = (formData) => {
    mutate(
      { id: featureId, data: formData },
      {
        onSuccess: () => {
          toast.success('Feature updated successfully');
          onSuccess();
        },
        onError: (error) => {
          toast.error(`Error updating feature: ${error.message}`);
        },
      }
    );
  };
  
  return (
    <FeatureForm
      initialData={feature}
      onSubmit={handleSubmit}
      isSubmitting={isPending}
    />
  );
}
```

## 6. State Persistence

### 6.1 Local Storage Persistence

For user preferences and non-sensitive state:

```tsx
// /hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### 6.2 URL State Persistence

For shareable state like filters, sorting, and pagination:

```tsx
// /hooks/useURLState.ts
import { useSearchParams } from 'react-router-dom';

export function useURLState<T extends Record<string, string>>(
  defaultValues: T
) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get current values from URL or default
  const getValues = () => {
    const values = { ...defaultValues };
    
    for (const key in defaultValues) {
      const paramValue = searchParams.get(key);
      if (paramValue !== null) {
        values[key] = paramValue;
      }
    }
    
    return values;
  };
  
  // Update URL with new values
  const setValues = (newValues: Partial<T>) => {
    const currentValues = getValues();
    const updatedValues = { ...currentValues, ...newValues };
    
    // Update search params
    const newParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(updatedValues)) {
      if (value !== defaultValues[key as keyof T]) {
        newParams.set(key, value);
      }
    }
    
    setSearchParams(newParams);
  };
  
  return [getValues(), setValues] as const;
}
```

## 7. Performance Considerations

### 7.1 Memoization Patterns

```tsx
// Component memoization
const MemoizedFeatureCard = React.memo(FeatureCard);

// Memoized callbacks
const handleDelete = useCallback(() => {
  deleteFeature(feature.id);
}, [feature.id, deleteFeature]);

// Memoized derived data
const sortedFeatures = useMemo(() => {
  return [...features].sort((a, b) => {
    if (sortField === 'title') {
      return a.title.localeCompare(b.title);
    }
    return a[sortField] - b[sortField];
  });
}, [features, sortField]);
```

### 7.2 Context Splitting

Avoid re-renders by splitting context into smaller pieces:

```tsx
// Instead of one large context
const AppContext = createContext<{
  user: User;
  theme: Theme;
  sidebar: SidebarState;
  notifications: Notification[];
}>(null!);

// Split into focused contexts
const UserContext = createContext<User>(null!);
const ThemeContext = createContext<Theme>('light');
const SidebarContext = createContext<SidebarState>(null!);
const NotificationContext = createContext<Notification[]>([]);
```

### 7.3 Performance Monitoring

```tsx
// /components/PerformanceMonitor.tsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function PerformanceMonitor() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Monitor React Query cache size
    const interval = setInterval(() => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      console.log('Query cache size:', queries.length);
      
      // Report to monitoring system if needed
      if (queries.length > 100) {
        // Report potential memory issues
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [queryClient]);
  
  // This component doesn't render anything
  return null;
}
```

## 8. Testing State and Data Flow

### 8.1 Testing React Query Hooks

```tsx
// /features/features/hooks/useFeatures.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../../../test/utils';
import { useFeatures } from './useFeatures';
import { fetchFeatures } from '../api';

// Mock the API
jest.mock('../api', () => ({
  fetchFeatures: jest.fn(),
}));

describe('useFeatures', () => {
  it('returns features data when successful', async () => {
    const mockFeatures = [
      { id: '1', title: 'Feature 1' },
      { id: '2', title: 'Feature 2' },
    ];
    
    (fetchFeatures as jest.Mock).mockResolvedValue(mockFeatures);
    
    const { result } = renderHook(() => useFeatures(), {
      wrapper: createWrapper(),
    });
    
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for data to load
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Check data
    expect(result.current.data).toEqual(mockFeatures);
  });
  
  it('returns error when fetch fails', async () => {
    const error = new Error('Failed to fetch');
    (fetchFeatures as jest.Mock).mockRejectedValue(error);
    
    const { result } = renderHook(() => useFeatures(), {
      wrapper: createWrapper(),
    });
    
    // Wait for error to be set
    await waitFor(() => expect(result.current.isError).toBe(true));
    
    // Check error
    expect(result.current.error).toEqual(error);
  });
});
```

### 8.2 Testing Context Providers

```tsx
// /features/auth/AuthContext.test.tsx
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Component that uses the context
function TestComponent() {
  const { user, login } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  it('provides initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });
  
  it('updates state after login', async () => {
    // Mock the auth API
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: '123', name: 'Test User' } }),
    } as Response);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    await act(async () => {
      screen.getByText('Login').click();
    });
    
    // Check that user is logged in
    expect(screen.getByTestId('user')).toHaveTextContent('Test User');
  });
});
```

---

By following these data flow and state management patterns, our application will have a predictable, maintainable, and performant state management architecture.
