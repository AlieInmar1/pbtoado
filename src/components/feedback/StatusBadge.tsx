import React from 'react';
import { Badge } from '../ui/shadcn/badge';
import { cn } from '../../lib/utils';

// Types for status badges
export type StatusType = 
  // General statuses
  | 'new' 
  | 'active' 
  | 'in-progress' 
  | 'completed' 
  | 'closed'
  | 'cancelled'
  // Priority levels
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  // Sync statuses
  | 'synced'
  | 'pending'
  | 'failed'
  | 'conflict'
  // Custom status
  | 'custom';

export type StatusVariant = 'status' | 'priority' | 'sync';

export type StatusBadgeProps = {
  type: StatusType;
  variant?: StatusVariant;
  label?: string;
  tooltip?: string;
  className?: string;
};

/**
 * StatusBadge component provides consistent visual indicators
 * for status, priority, and sync state throughout the application.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  variant = 'status',
  label,
  tooltip,
  className = '',
}) => {
  // Get display label if not provided
  const displayLabel = label || getDefaultLabel(type);
  
  // Get appropriate color classes based on type and variant
  const colorClasses = getColorClasses(type, variant);
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 font-medium',
        colorClasses,
        className
      )}
      title={tooltip}
    >
      <span 
        className={cn(
          'h-2 w-2 rounded-full',
          getIndicatorColor(type, variant)
        )} 
      />
      <span>{displayLabel}</span>
    </Badge>
  );
};

// Helper function to get default label for a status type
function getDefaultLabel(type: StatusType): string {
  switch (type) {
    case 'new': return 'New';
    case 'active': return 'Active';
    case 'in-progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'closed': return 'Closed';
    case 'cancelled': return 'Cancelled';
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    case 'synced': return 'Synced';
    case 'pending': return 'Pending';
    case 'failed': return 'Failed';
    case 'conflict': return 'Conflict';
    case 'custom': return 'Custom';
    default: return type;
  }
}

// Helper function to get color classes based on type and variant
function getColorClasses(type: StatusType, variant: StatusVariant): string {
  // Base classes
  let classes = '';
  
  // Status variant
  if (variant === 'status') {
    switch (type) {
      case 'new':
        classes = 'border-blue-200 bg-blue-50 text-blue-700';
        break;
      case 'active':
      case 'in-progress':
        classes = 'border-green-200 bg-green-50 text-green-700';
        break;
      case 'completed':
      case 'closed':
        classes = 'border-gray-200 bg-gray-50 text-gray-700';
        break;
      case 'cancelled':
        classes = 'border-red-200 bg-red-50 text-red-700';
        break;
      default:
        classes = 'border-gray-200 bg-gray-50 text-gray-700';
    }
  }
  
  // Priority variant
  else if (variant === 'priority') {
    switch (type) {
      case 'critical':
        classes = 'border-red-200 bg-red-50 text-red-700';
        break;
      case 'high':
        classes = 'border-orange-200 bg-orange-50 text-orange-700';
        break;
      case 'medium':
        classes = 'border-yellow-200 bg-yellow-50 text-yellow-700';
        break;
      case 'low':
        classes = 'border-green-200 bg-green-50 text-green-700';
        break;
      default:
        classes = 'border-gray-200 bg-gray-50 text-gray-700';
    }
  }
  
  // Sync variant
  else if (variant === 'sync') {
    switch (type) {
      case 'synced':
        classes = 'border-green-200 bg-green-50 text-green-700';
        break;
      case 'pending':
        classes = 'border-blue-200 bg-blue-50 text-blue-700';
        break;
      case 'failed':
        classes = 'border-red-200 bg-red-50 text-red-700';
        break;
      case 'conflict':
        classes = 'border-orange-200 bg-orange-50 text-orange-700';
        break;
      default:
        classes = 'border-gray-200 bg-gray-50 text-gray-700';
    }
  }
  
  return classes;
}

// Helper function to get indicator color
function getIndicatorColor(type: StatusType, variant: StatusVariant): string {
  // Status variant
  if (variant === 'status') {
    switch (type) {
      case 'new': return 'bg-blue-500';
      case 'active':
      case 'in-progress': return 'bg-green-500';
      case 'completed':
      case 'closed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }
  
  // Priority variant
  else if (variant === 'priority') {
    switch (type) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }
  
  // Sync variant
  else if (variant === 'sync') {
    switch (type) {
      case 'synced': return 'bg-green-500';
      case 'pending': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'conflict': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  }
  
  return 'bg-gray-500';
}
