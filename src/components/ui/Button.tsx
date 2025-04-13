import React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Button variants that determine the visual style
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

/**
 * Button sizes
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Props for the Button component
 * @interface ButtonProps
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>}
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: ButtonVariant;
  
  /** Size of the button */
  size?: ButtonSize;
  
  /** Whether the button shows a loading spinner */
  isLoading?: boolean;
  
  /** Whether the button is full width */
  isFullWidth?: boolean;
  
  /** Optional icon to display at the start of the button */
  startIcon?: React.ReactNode;
  
  /** Optional icon to display at the end of the button */
  endIcon?: React.ReactNode;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Button contents */
  children: React.ReactNode;
}

/**
 * Button component that supports different variants, sizes, and states.
 * It follows accessibility best practices and can be customized with icons,
 * loading state, and different visual styles.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    isFullWidth = false,
    startIcon,
    endIcon,
    className,
    children,
    disabled,
    ...props
  }, ref) => {
    // Variant styles
    const variantStyles = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    };

    // Size styles
    const sizeStyles = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    // Full width style
    const widthStyle = isFullWidth ? 'w-full' : '';

    // Spinner for loading state
    const LoadingSpinner = () => (
      <svg 
        className="animate-spin -ml-1 mr-2 h-4 w-4" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        data-testid="loading-spinner"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Build the complete button class based on variant, size, and other props
    const buttonClasses = twMerge(
      'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
      variantStyles[variant],
      sizeStyles[size],
      widthStyle,
      (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
      className
    );

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {!isLoading && startIcon && <span className="mr-2">{startIcon}</span>}
        {children}
        {!isLoading && endIcon && <span className="ml-2">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
