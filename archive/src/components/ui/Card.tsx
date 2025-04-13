import React, { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  bordered?: boolean;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  hoverEffect?: boolean;
  gradient?: boolean;
  interactive?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  noPadding = false, 
  bordered = true, 
  elevation = 'low',
  hoverEffect = false,
  gradient = false,
  interactive = false,
  ...rest
}: CardProps) {
  // Determine shadow based on elevation
  const getShadowClass = () => {
    switch (elevation) {
      case 'none': return '';
      case 'low': return 'shadow-sm';
      case 'medium': return 'shadow';
      case 'high': return 'shadow-lg';
      default: return 'shadow-sm';
    }
  };
  
  // Combine all the classes
  const classes = [
    'bg-white rounded-lg overflow-hidden',
    getShadowClass(),
    bordered ? 'border border-gray-200' : '',
    noPadding ? '' : 'p-4',
    hoverEffect ? 'transition duration-200 ease-in-out hover:shadow-md transform hover:-translate-y-1' : '',
    gradient ? 'bg-gradient-to-br from-gray-50 to-white' : '',
    interactive ? 'cursor-pointer transition-all duration-200 hover:border-primary-300' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...rest}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5" />
      )}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
