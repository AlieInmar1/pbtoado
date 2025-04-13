import React from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Define the possible token status values
export type TokenStatus = 'valid' | 'expiring_soon' | 'expired' | 'invalid' | 'none' | 'loading';

interface TokenStatusBadgeProps {
  status: TokenStatus;
  hoursUntilExpiry?: number | null;
  className?: string;
  showText?: boolean;
}

/**
 * A badge component that shows the status of a ProductBoard token
 */
export function TokenStatusBadge({ 
  status, 
  hoursUntilExpiry, 
  className = '', 
  showText = true 
}: TokenStatusBadgeProps) {
  // Define colors for each status
  const statusConfig: Record<TokenStatus, { bgColor: string; textColor: string; icon: React.ReactNode; text: string }> = {
    valid: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      text: 'Valid'
    },
    expiring_soon: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: <ClockIcon className="h-4 w-4 text-yellow-500" />,
      text: `Expires in ${Math.round(hoursUntilExpiry || 0)}h`
    },
    expired: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: <ExclamationCircleIcon className="h-4 w-4 text-red-500" />,
      text: 'Expired'
    },
    invalid: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
      text: 'Invalid'
    },
    none: {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      icon: <XCircleIcon className="h-4 w-4 text-gray-500" />,
      text: 'No Token'
    },
    loading: {
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: (
        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      text: 'Loading...'
    }
  };

  const config = statusConfig[status];

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.icon}
      {showText && <span className="ml-1.5">{config.text}</span>}
    </span>
  );
}
