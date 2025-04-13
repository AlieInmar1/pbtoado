import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContainer, ToastProps, ToastPosition } from '../../components/feedback/Toast';

/**
 * Interface for the toast notification
 */
export interface ToastNotification extends Omit<ToastProps, 'onDismiss' | 'id'> {
  /** Auto-generated ID if not provided */
  id?: string;
}

/**
 * Interface for the toast context value
 */
interface ToastContextValue {
  /** Add a new toast notification */
  addToast: (toast: ToastNotification) => string;
  /** Update an existing toast notification */
  updateToast: (id: string, toast: Partial<ToastNotification>) => void;
  /** Remove a toast notification */
  removeToast: (id: string) => void;
  /** Remove all toast notifications */
  removeAllToasts: () => void;
  /** Get all active toast notifications */
  toasts: (ToastNotification & { id: string })[];
}

// Create the toast context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Props for the ToastProvider component
 */
interface ToastProviderProps {
  /** The children components */
  children: React.ReactNode;
  /** The position of the toast container */
  position?: ToastPosition;
  /** The maximum number of toasts to show at once */
  maxToasts?: number;
}

/**
 * ToastProvider component provides toast notification functionality
 * to all its child components.
 * 
 * @example
 * ```tsx
 * <ToastProvider position="top-right" maxToasts={5}>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  // State to store toast notifications
  const [toasts, setToasts] = useState<(ToastNotification & { id: string })[]>([]);

  // Generate a unique ID for a toast
  const generateId = useCallback((): string => {
    return `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }, []);

  // Add a new toast notification
  const addToast = useCallback((toast: ToastNotification): string => {
    const id = toast.id || generateId();

    setToasts((prevToasts) => {
      // Limit the number of toasts
      const filteredToasts = prevToasts.length >= maxToasts
        ? prevToasts.slice(0, maxToasts - 1)
        : prevToasts;

      return [{ ...toast, id }, ...filteredToasts];
    });

    return id;
  }, [generateId, maxToasts]);

  // Update an existing toast notification
  const updateToast = useCallback((id: string, toast: Partial<ToastNotification>): void => {
    setToasts((prevToasts) =>
      prevToasts.map((t) =>
        t.id === id ? { ...t, ...toast } : t
      )
    );
  }, []);

  // Remove a toast notification
  const removeToast = useCallback((id: string): void => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  // Remove all toast notifications
  const removeAllToasts = useCallback((): void => {
    setToasts([]);
  }, []);

  // Create the context value
  const value = {
    addToast,
    updateToast,
    removeToast,
    removeAllToasts,
    toasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position={position}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            position={toast.position}
            duration={toast.duration}
            dismissable={toast.dismissable}
            className={toast.className}
            onDismiss={removeToast}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to use the toast context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { addToast } = useToast();
 *   
 *   const handleClick = () => {
 *     addToast({
 *       title: 'Success',
 *       description: 'The operation was successful.',
 *       variant: 'success',
 *     });
 *   };
 *   
 *   return <button onClick={handleClick}>Show Toast</button>;
 * }
 * ```
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};
