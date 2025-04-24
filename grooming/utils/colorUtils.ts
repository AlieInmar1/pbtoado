/**
 * Utility functions for color-related operations
 */

/**
 * Get the appropriate color classes for a story status
 * @param status The status of the story
 * @returns Tailwind CSS classes for the status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-800';
    case 'discussed': return 'bg-green-100 text-green-800';
    case 'deferred': return 'bg-yellow-100 text-yellow-800';
    case 'split': return 'bg-blue-100 text-blue-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'new': return 'bg-purple-100 text-purple-800';
    case 'groomed': return 'bg-green-100 text-green-800';
    case 'ready': return 'bg-blue-100 text-blue-800';
    case 'in_sprint': return 'bg-indigo-100 text-indigo-800';
    case 'done': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get the appropriate color classes for a risk level
 * @param level The risk level (low, medium, high)
 * @returns Tailwind CSS classes for the risk level
 */
export const getRiskColor = (level: 'low' | 'medium' | 'high'): string => {
  switch (level) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get the appropriate color for a capacity indicator
 * @param used The amount of capacity used
 * @param total The total available capacity
 * @returns Tailwind CSS background color class
 */
export const getCapacityColor = (used: number, total: number): string => {
  const percentage = (used / total) * 100;
  if (percentage < 70) return 'bg-green-500';
  if (percentage < 90) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Get the appropriate color for a metric change direction
 * @param direction The direction of change (up, down, neutral)
 * @param isPositive Whether an increase is considered positive
 * @returns Tailwind CSS text color class
 */
export const getChangeDirectionColor = (
  direction: 'up' | 'down' | 'neutral',
  isPositive: boolean = true
): string => {
  if (direction === 'neutral') return 'text-gray-500';
  
  if (direction === 'up') {
    return isPositive ? 'text-green-500' : 'text-red-500';
  } else {
    return isPositive ? 'text-red-500' : 'text-green-500';
  }
};

/**
 * Get a color from a palette based on an index
 * @param index The index to use for color selection
 * @returns Tailwind CSS background color class
 */
export const getChartColor = (index: number): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500'
  ];
  
  return colors[index % colors.length];
};
