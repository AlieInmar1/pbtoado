import React, { ReactNode } from 'react';

// Define the supported toast variants
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

// Define the supported toast positions
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// Props for the Toast component
export interface ToastProps {
  /** Unique identifier for the toast */
  id: string;
  /** Variant/type of toast */
  variant?: ToastVariant;
  /** Title of the toast */
  title?: ReactNode;
  /** Description/body of the toast */
  description?: ReactNode;
  /** Position of the toast (used by container) */
  position?: ToastPosition;
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
  duration?: number;
  /** Whether the toast can be manually dismissed */
  dismissable?: boolean;
  /** Function to call when toast is dismissed */
  onDismiss: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// Toast component implementation
export const Toast: React.FC<ToastProps> = ({
  id,
  variant = 'info',
  title,
  description,
  duration = 5000,
  dismissable = true,
  onDismiss,
  className = '',
}) => {
  // Auto-dismiss timer
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, id, onDismiss]);

  // Get variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-success-50 border-success-500 text-success-800';
      case 'warning':
        return 'bg-warning-50 border-warning-500 text-warning-800';
      case 'error':
        return 'bg-error-50 border-error-500 text-error-800';
      case 'info':
      default:
        return 'bg-info-50 border-info-500 text-info-800';
    }
  };

  // Get icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-info-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative max-w-sm w-full pointer-events-auto overflow-hidden rounded-lg border shadow-lg ${getVariantStyles()} ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {title && <p className="text-sm font-medium">{title}</p>}
            {description && <p className="mt-1 text-sm">{description}</p>}
          </div>
          {dismissable && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-info-500 rounded-md"
                onClick={() => onDismiss(id)}
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Props for the ToastContainer component
export interface ToastContainerProps {
  /** Position of the toast container */
  position?: ToastPosition;
  /** Children components (toasts) */
  children: React.ReactNode;
}

// ToastContainer component implementation
export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  children,
}) => {
  // Get position-specific styling
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0';
      case 'bottom-left':
        return 'bottom-0 left-0';
      case 'bottom-right':
        return 'bottom-0 right-0';
      case 'top-right':
      default:
        return 'top-0 right-0';
    }
  };

  return (
    <div
      className={`fixed z-50 p-4 ${getPositionStyles()} pointer-events-none flex flex-col space-y-4 max-h-screen overflow-hidden`}
      aria-live="polite"
      aria-atomic="true"
    >
      {children}
    </div>
  );
};
