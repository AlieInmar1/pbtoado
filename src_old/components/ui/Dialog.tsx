import React, { Fragment, ReactNode } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeButton?: boolean;
  showCloseIcon?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeButton = false,
  showCloseIcon = true,
  footer,
  className = '',
}: DialogProps) {
  const getMaxWidthClass = () => {
    switch (size) {
      case 'sm': return 'sm:max-w-sm';
      case 'md': return 'sm:max-w-md';
      case 'lg': return 'sm:max-w-lg';
      case 'xl': return 'sm:max-w-xl';
      case 'full': return 'sm:max-w-5xl';
      default: return 'sm:max-w-md';
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Dialog content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel 
                className={`w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all ${getMaxWidthClass()} ${className}`}
              >
                {/* Header */}
                {(title || showCloseIcon) && (
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {title && (
                        <HeadlessDialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                          {title}
                        </HeadlessDialog.Title>
                      )}
                      {description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {description}
                        </p>
                      )}
                    </div>
                    {showCloseIcon && (
                      <button
                        type="button"
                        className="rounded-full p-1.5 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={`${(title || description) ? 'mt-2' : ''}`}>
                  {children}
                </div>

                {/* Footer */}
                {(footer || closeButton) && (
                  <div className="mt-6 flex flex-row-reverse gap-3 justify-start">
                    {footer}
                    {closeButton && !footer && (
                      <Button 
                        variant="secondary" 
                        onClick={onClose}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                )}
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

interface DialogHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export function DialogHeader({ title, description, onClose, className = '' }: DialogHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          className="rounded-full p-1.5 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function DialogContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-6 flex items-center justify-end space-x-3 ${className}`}>
      {children}
    </div>
  );
}

export function DialogActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-6 flex flex-row-reverse gap-3 justify-start ${className}`}>
      {children}
    </div>
  );
}
