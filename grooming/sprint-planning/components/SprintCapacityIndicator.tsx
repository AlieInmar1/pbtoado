import React from 'react';
import { getCapacityColor } from '../../utils/colorUtils';

interface SprintCapacityIndicatorProps {
  used: number;
  total: number;
  className?: string;
}

export function SprintCapacityIndicator({ used, total, className = '' }: SprintCapacityIndicatorProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const colorClass = getCapacityColor(used, total);
  
  // Determine status text
  const getStatusText = () => {
    if (percentage >= 100) return 'Overallocated';
    if (percentage >= 90) return 'At capacity';
    if (percentage >= 70) return 'Near capacity';
    return 'Available';
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-xs text-gray-700 mb-1">
        <span>{used} / {total} points</span>
        <span>{percentage}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${colorClass} h-2.5 rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${percentage}%` }}
          title={`${getStatusText()}: ${percentage}% of capacity used`}
        ></div>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        {getStatusText()}
      </div>
    </div>
  );
}
