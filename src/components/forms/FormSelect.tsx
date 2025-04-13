import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Text } from '../ui/Typography';

/**
 * Option type for the FormSelect component
 */
export interface SelectOption {
  /** The value of the option */
  value: string;
  /** The label to display */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

/**
 * Props for the FormSelect component
 */
export interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** Select label text */
  label: string;
  /** Select name attribute */
  name: string;
  /** Array of options for the select */
  options: SelectOption[];
  /** Whether the select has an error */
  error?: string;
  /** Helper text to display below the select */
  helperText?: string;
  /** Additional classes for the select container */
  containerClassName?: string;
  /** Additional classes for the select element */
  selectClassName?: string;
  /** Optional placeholder text (uses disabled option) */
  placeholder?: string;
}

/**
 * FormSelect component for dropdown selection with consistent styling and features
 * like labels, error states, and helper text.
 * 
 * @example
 * ```tsx
 * <FormSelect 
 *   label="Country"
 *   name="country"
 *   placeholder="Select a country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' },
 *     { value: 'mx', label: 'Mexico' }
 *   ]}
 * />
 * ```
 */
export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({
    label,
    name,
    options,
    error,
    helperText,
    containerClassName,
    selectClassName,
    placeholder,
    disabled,
    ...props
  }, ref) => {
    // Determine if the select has an error
    const hasError = !!error;
    
    // Build the container class
    const containerClasses = twMerge(
      'space-y-1',
      containerClassName
    );
    
    // Build the select class
    const selectClasses = twMerge(
      'form-control',
      'block w-full px-3 py-2 border rounded-md shadow-sm transition appearance-none',
      'bg-white cursor-pointer pr-10 text-base',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      hasError 
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
      disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed',
      selectClassName
    );
    
    return (
      <div className={containerClasses}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        
        <div className="relative">
          <select
            ref={ref}
            id={name}
            name={name}
            className={selectClasses}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${name}-error` : helperText ? `${name}-description` : undefined
            }
            disabled={disabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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

FormSelect.displayName = 'FormSelect';
