import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Heading, Text } from '../ui/Typography';

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps {
  /** The title of the empty state */
  title: string;
  /** The description of the empty state */
  description?: string;
  /** An optional icon to display */
  icon?: React.ReactNode;
  /** Actions to display in the empty state */
  actions?: React.ReactNode;
  /** Whether to use a compact layout */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmptyState component for displaying when there is no data or content to show.
 * Provides a consistent way to communicate to users that there is no data
 * and optionally give them actions to populate the data.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="No projects found"
 *   description="Create your first project to get started."
 *   icon={<FolderIcon className="w-12 h-12 text-gray-400" />}
 *   actions={
 *     <Button variant="primary">Create Project</Button>
 *   }
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actions,
  compact = false,
  className,
}) => {
  return (
    <div
      className={twMerge(
        'flex flex-col items-center justify-center text-center p-6',
        compact ? 'py-6' : 'py-12',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      
      <Heading
        variant={compact ? 'h4' : 'h3'}
        className="mb-2"
      >
        {title}
      </Heading>
      
      {description && (
        <Text
          muted
          size={compact ? 'sm' : 'md'}
          className="max-w-md mb-6"
        >
          {description}
        </Text>
      )}
      
      {actions && (
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
