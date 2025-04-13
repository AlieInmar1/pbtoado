import React from 'react';
import { ProductBoardFeature } from '../../types/productboard';
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon, 
  DocumentIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface FeaturesDashboardProps {
  features: ProductBoardFeature[];
}

export function FeaturesDashboard({ features }: FeaturesDashboardProps) {
  // Calculate stats
  const totalFeatures = features.length;
  
  // Status counts
  const statusCounts: Record<string, number> = {};
  features.forEach(feature => {
    if (feature.status_name) {
      statusCounts[feature.status_name] = (statusCounts[feature.status_name] || 0) + 1;
    }
  });

  // Type counts
  const typeCounts: Record<string, number> = {};
  features.forEach(feature => {
    if (feature.feature_type) {
      typeCounts[feature.feature_type] = (typeCounts[feature.feature_type] || 0) + 1;
    }
  });

  // Get top statuses and types
  const topStatuses = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Calculate completion percentage
  const completedCount = features.filter(f => 
    f.status_name?.toLowerCase().includes('done') || 
    f.status_name?.toLowerCase().includes('complete')
  ).length;
  
  const completionPercentage = totalFeatures ? Math.round((completedCount / totalFeatures) * 100) : 0;

  // Helper for status color
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (statusLower.includes('done') || statusLower.includes('complete')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower.includes('backlog') || statusLower.includes('planned')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (statusLower.includes('cancel') || statusLower.includes('reject')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 p-5">
      <div className="flex items-center mb-4">
        <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">Feature Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Features */}
        <div className="bg-indigo-50 rounded-lg p-4 flex items-center shadow-sm">
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <DocumentIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Features</div>
            <div className="text-2xl font-bold text-indigo-700">{totalFeatures}</div>
          </div>
        </div>
        
        {/* Completion */}
        <div className="bg-green-50 rounded-lg p-4 flex items-center shadow-sm">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-grow">
            <div className="text-sm font-medium text-gray-500">Completion Rate</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-700">{completionPercentage}%</div>
              <div className="w-24 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* In Progress */}
        <div className="bg-amber-50 rounded-lg p-4 flex items-center shadow-sm">
          <div className="rounded-full bg-amber-100 p-3 mr-4">
            <ClockIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">In Progress</div>
            <div className="text-2xl font-bold text-amber-700">
              {Object.entries(statusCounts).filter(([k]) => 
                k.toLowerCase().includes('progress')
              ).reduce((sum, [_, count]) => sum + count, 0)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Status and Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Status Distribution</h3>
          <div className="space-y-2">
            {topStatuses.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${status.toLowerCase().includes('done') ? 'bg-green-500' : 
                                                     status.toLowerCase().includes('progress') ? 'bg-amber-500' :
                                                     'bg-blue-500'}`}
                      style={{ width: `${Math.round((count / totalFeatures) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Feature Types</h3>
          <div className="space-y-2">
            {topTypes.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-700">{type}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${Math.round((count / totalFeatures) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
