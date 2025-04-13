import React from 'react';
import type { ComponentType, SVGProps } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  loading?: boolean;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  icon: Icon,
  loading,
  children,
  className = '',
  size = 'md',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center border font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const variants = {
    primary: 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500',
    danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 mr-2" aria-hidden="true" />}
      {loading ? 'Loading...' : children}
    </button>
  );
}
