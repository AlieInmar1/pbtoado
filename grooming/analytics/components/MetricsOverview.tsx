import React from 'react';
import { MetricData } from '../../types';
import { getChangeDirectionColor } from '../../utils/colorUtils';

interface MetricsOverviewProps {
  metrics: MetricData[];
  timeRange: string;
  className?: string;
}

export function MetricsOverview({ metrics, timeRange, className = '' }: MetricsOverviewProps) {
  return (
    <div className={`${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Metrics Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
    </div>
  );
}

interface MetricCardProps {
  metric: MetricData;
}

function MetricCard({ metric }: MetricCardProps) {
  // Determine if an increase is positive (for most metrics, up is good)
  const isPositive = metric.label.toLowerCase().includes('time') ? false : true;
  
  // Get color for change direction
  const changeColor = metric.changeDirection 
    ? getChangeDirectionColor(metric.changeDirection, isPositive) 
    : 'text-gray-500';
  
  // Format the value based on its type
  const formatValue = (value: number, label: string) => {
    if (label.toLowerCase().includes('time')) {
      return `${value} min`;
    }
    if (label.toLowerCase().includes('rate') || label.toLowerCase().includes('percentage')) {
      return `${value}%`;
    }
    return value.toString();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
        
        {metric.changeDirection && metric.change !== undefined && (
          <div className={`flex items-center ${changeColor}`}>
            {metric.changeDirection === 'up' ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : metric.changeDirection === 'down' ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              </svg>
            )}
            <span className="text-xs font-medium">{metric.change}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-2">
        <span className="text-2xl font-bold text-gray-900">{formatValue(metric.value, metric.label)}</span>
      </div>
    </div>
  );
}
