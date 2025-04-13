import React, { Fragment } from 'react';
import { twMerge } from 'tailwind-merge';
import { Button } from './Button';
import { Heading } from './Typography';

/**
 * Props for the Dialog component
 */
export interface DialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Function to close the dialog */
  onClose: () => void;
  /** Dialog title */
  title: React.ReactNode;
  /** Dialog content */
  children: React.ReactNode;
  /** Dialog footer content */
  footer?: React.ReactNode;
  /** Maximum width of the dialog */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  /** Whether to show a close button in the header */
  showCloseButton?: boolean;
  /** Additional CSS classes for the dialog container */
  className?: string;
}

/**
 * Dialog component for displaying modal content like confirmations, forms, and other content
 * that requires user attention or interaction. The dialog is displayed over a backdrop that
 * blocks interaction with the rest of the page.
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * return (
 *   <>
 *     <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
 *     <Dialog
 *       isOpen={isOpen}
 *       onClose={() => setIsOpen(false)}
 *       title="Confirm Action"
 *       footer={
 *         <>
 *           <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *           <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
 *         </>
 *       }
 *     >
 *       Are you sure you want to proceed with this action?
 *     </Dialog>
 *   </>
 * );
 * ```
 */
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
  className,
}) => {
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = ''; // Re-enable scrolling
    };
  }, [isOpen, onClose]);

  // Determine max width classes
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  // Build dialog classes
  const dialogClasses = twMerge(
    'relative bg-white rounded-lg shadow-xl',
    'w-full mx-auto',
    maxWidthClasses[maxWidth],
    className
  );

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="dialog-title"
        role="dialog"
        aria-modal="true"
        onClick={handleBackdropClick}
      >
        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

        {/* Dialog positioning */}
        <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
          {/* Dialog */}
          <div className={dialogClasses}>
            {/* Dialog header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <Heading variant="h4" id="dialog-title">
                {title}
              </Heading>
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <svg 
                    className="h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </Button>
              )}
            </div>
            
            {/* Dialog content */}
            <div className="px-6 py-4">
              {children}
            </div>
            
            {/* Optional footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-row-reverse gap-3">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
};
