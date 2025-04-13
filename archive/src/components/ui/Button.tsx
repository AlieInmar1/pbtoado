import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'gradient' | 'glass';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type ButtonRounded = 'none' | 'md' | 'full';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  fullWidth?: boolean;
  isLoading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  animate?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      rounded = 'md',
      type = 'button',
      fullWidth = false,
      isLoading = false,
      disabled = false,
      startIcon,
      endIcon,
      animate = true,
      ...rest
    },
    ref
  ) => {
    // Get base styles based on variant
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return 'bg-primary-600 hover:bg-primary-700 text-white border-transparent focus:ring-primary-500';
        case 'secondary':
          return 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-primary-500';
        case 'danger':
          return 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500';
        case 'success':
          return 'bg-green-600 hover:bg-green-700 text-white border-transparent focus:ring-green-500';
        case 'warning':
          return 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent focus:ring-yellow-500';
        case 'info':
          return 'bg-blue-500 hover:bg-blue-600 text-white border-transparent focus:ring-blue-500';
        case 'gradient':
          return 'text-white border-transparent focus:ring-primary-500 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600';
        case 'glass':
          return 'backdrop-blur-md bg-white/30 hover:bg-white/40 text-gray-800 border-white/30 focus:ring-white/50';
        default:
          return 'bg-primary-600 hover:bg-primary-700 text-white border-transparent focus:ring-primary-500';
      }
    };

    // Get size classes
    const getSizeClasses = () => {
      switch (size) {
        case 'xs':
          return 'py-1 px-2 text-xs';
        case 'sm':
          return 'py-1.5 px-3 text-sm';
        case 'md':
          return 'py-2 px-4 text-sm';
        case 'lg':
          return 'py-2.5 px-6 text-base';
        default:
          return 'py-2 px-4 text-sm';
      }
    };

    // Get rounded classes
    const getRoundedClasses = () => {
      switch (rounded) {
        case 'none':
          return 'rounded-none';
        case 'md':
          return 'rounded-md';
        case 'full':
          return 'rounded-full';
        default:
          return 'rounded-md';
      }
    };

    const baseClasses = 'inline-flex justify-center items-center border shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const transitionClasses = animate ? 'transition-all duration-200 ease-in-out active:scale-95' : '';
    const widthClass = fullWidth ? 'w-full' : '';
    
    const classes = [
      baseClasses,
      getVariantClasses(),
      getSizeClasses(),
      getRoundedClasses(),
      transitionClasses,
      widthClass,
      className
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || isLoading}
        {...rest}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          <>
            {startIcon && <span className="mr-2">{startIcon}</span>}
            {children}
            {endIcon && <span className="ml-2">{endIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
