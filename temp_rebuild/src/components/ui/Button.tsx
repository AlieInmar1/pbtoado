import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  disabled = false,
  startIcon,
  endIcon,
  ...rest
}: ButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 hover:bg-primary-700 text-white border-transparent';
      case 'secondary':
        return 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-transparent';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-transparent';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent';
      default:
        return 'bg-primary-600 hover:bg-primary-700 text-white border-transparent';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'py-1 px-2 text-xs';
      case 'sm':
        return 'py-1.5 px-3 text-sm';
      case 'md':
        return 'py-2 px-4 text-sm';
      case 'lg':
        return 'py-2 px-6 text-base';
      default:
        return 'py-2 px-4 text-sm';
    }
  };

  const baseClasses = 'inline-flex justify-center items-center border rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  
  const classes = [
    baseClasses,
    getVariantClasses(),
    getSizeClasses(),
    className
  ].join(' ');

  return (
    <button
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
