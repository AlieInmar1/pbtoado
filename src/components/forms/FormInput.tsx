import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Text } from '../ui/Typography';

/**
 * Props for the FormInput component
 */
export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label text */
  label: string;
  /** Input name attribute */
  name: string;
  /** Whether the input has an error */
  error?: string;
  /** Helper text to display below the input */
  helperText?: string;
  /** Whether to add a leading icon/element */
  leadingIcon?: React.ReactNode;
  /** Whether to add a trailing icon/element */
  trailingIcon?: React.ReactNode;
  /** Additional classes for the input container */
  containerClassName?: string;
  /** Additional classes for the input element */
  inputClassName?: string;
}

/**
 * FormInput component for user input with consistent styling and features
 * like labels, error states, and helper text.
 * 
 * @example
 * ```tsx
 * <FormInput 
 *   label="Email"
 *   name="email"
 *   type="email"
 *   placeholder="Enter your email"
 *   helperText="We'll never share your email."
 * />
 * ```
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({
    label,
    name,
    error,
    helperText,
    leadingIcon,
    trailingIcon,
    containerClassName,
    inputClassName,
    disabled,
    ...props
  }, ref) => {
    // Determine if the input has an error
    const hasError = !!error;
    
    // Build the container class
    const containerClasses = twMerge(
      'space-y-1',
      containerClassName
    );
    
    // Build the input wrapper class
    const inputWrapperClasses = twMerge(
      'relative rounded-md shadow-sm',
      hasError && 'ring-1 ring-red-500'
    );
    
    // Build the input class
    const inputClasses = twMerge(
      'form-control',
      'block w-full px-3 py-2 border rounded-md shadow-sm transition',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      hasError 
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
      disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed',
      leadingIcon && 'pl-10',
      trailingIcon && 'pr-10',
      inputClassName
    );
    
    return (
      <div className={containerClasses}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        
        <div className={inputWrapperClasses}>
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leadingIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={name}
            name={name}
            className={inputClasses}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${name}-error` : helperText ? `${name}-description` : undefined
            }
            disabled={disabled}
            {...props}
          />
          
          {trailingIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {trailingIcon}
            </div>
          )}
        </div>
        
        {hasError && (
          <Text 
            id={`${name}-error`}
            size="sm"
            className="text-red-600 mt-1"
          >
            {error}
          </Text>
        )}
        
        {!hasError && helperText && (
          <Text
            id={`${name}-description`}
            size="sm"
            muted
            className="mt-1"
          >
            {helperText}
          </Text>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
