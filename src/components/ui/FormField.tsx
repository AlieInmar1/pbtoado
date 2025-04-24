import React, { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  tooltip?: string;
  error?: string;
  className?: string;
}

/**
 * FormField component provides consistent styling and layout for form fields.
 * It includes support for labels, required indicators, tooltips, and error messages.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  required = false,
  tooltip,
  error,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {tooltip && (
            <span className="ml-2 text-xs text-gray-500">{tooltip}</span>
          )}
        </label>
      </div>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
