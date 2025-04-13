import React, { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: DialogProps) {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog position */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Dialog panel */}
        <div 
          className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all ${sizeClasses[size]}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          {/* Dialog header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          </div>
          
          {/* Dialog content */}
          <div className="px-4 pb-5 sm:p-6 sm:pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
