import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevation?: 'none' | 'sm' | 'medium' | 'lg';
  interactive?: boolean;
  hoverEffect?: boolean;
  gradient?: boolean;
}

export function Card({
  children,
  className = '',
  elevation = 'sm',
  interactive = false,
  hoverEffect = false,
  gradient = false,
}: CardProps) {
  const getElevationClasses = () => {
    switch (elevation) {
      case 'none':
        return '';
      case 'sm':
        return 'shadow-sm';
      case 'medium':
        return 'shadow-md';
      case 'lg':
        return 'shadow-lg';
      default:
        return 'shadow-sm';
    }
  };

  const baseClasses = 'bg-white rounded-lg p-4';
  const elevationClasses = getElevationClasses();
  const interactiveClasses = interactive ? 'cursor-pointer transition-all duration-200' : '';
  const hoverClasses = hoverEffect ? 'hover:-translate-y-1 hover:shadow-md transition-all duration-200' : '';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-white to-gray-50' : '';

  return (
    <div 
      className={`${baseClasses} ${elevationClasses} ${interactiveClasses} ${hoverClasses} ${gradientClasses} ${className}`}
    >
      {children}
    </div>
  );
}
