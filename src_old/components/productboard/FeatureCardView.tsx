import React, { useState } from 'react';
import { 
  EyeIcon, 
  ArchiveBoxIcon, 
  ScissorsIcon, 
  TagIcon, 
  CalendarIcon, 
  UserIcon, 
  ClockIcon, 
  ChevronDownIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { ProductBoardFeature } from '../../types/productboard';

interface FeatureCardViewProps {
  features: ProductBoardFeature[];
  onViewDetails: (feature: ProductBoardFeature) => void;
  onArchive: (id: string) => void;
  onSplit: (feature: ProductBoardFeature) => void;
}

export function FeatureCardView({ 
  features, 
  onViewDetails, 
  onArchive, 
  onSplit 
}: FeatureCardViewProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  // Function to determine status badge color
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress')) {
      return 'bg-amber-100 text-amber-800';
    } else if (statusLower.includes('done') || statusLower.includes('complete')) {
      return 'bg-green-100 text-green-800';
    } else if (statusLower.includes('backlog') || statusLower.includes('planned')) {
      return 'bg-blue-100 text-blue-800';
    } else if (statusLower.includes('cancel') || statusLower.includes('reject')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-purple-100 text-purple-800';
  };

  // Function to determine feature type badge color
  const getTypeColor = (type: string | null | undefined) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    const typeLower = type.toLowerCase();
    if (typeLower.includes('epic')) {
      return 'bg-purple-100 text-purple-800';
    } else if (typeLower.includes('feature')) {
      return 'bg-indigo-100 text-indigo-800';
    } else if (typeLower.includes('story')) {
      return 'bg-blue-100 text-blue-800';
    } else if (typeLower.includes('task')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Function to get priority color
  const getPriorityColor = (priority: string | null | undefined) => {
    if (!priority) return '';
    
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('high')) {
      return 'bg-red-100 text-red-800';
    } else if (priorityLower.includes('medium')) {
      return 'bg-amber-100 text-amber-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
      {features.map(feature => (
        <div 
          key={feature.id} 
          className="bg-white rounded border border-gray-200 hover:shadow transition-shadow duration-200 flex flex-col text-xs"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onViewDetails(feature);
            if (e.key === 'Space') toggleCardExpansion(feature.id);
          }}
        >
          <div className="p-3 flex-grow">
            {/* Header with title and action buttons */}
            <div className="flex justify-between items-start mb-2" onClick={() => toggleCardExpansion(feature.id)}>
              <div className="flex items-center cursor-pointer">
                {expandedCards[feature.id] ? 
                  <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-1 flex-shrink-0" /> : 
                  <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-1 flex-shrink-0" />
                }
                <h3 className="text-sm font-medium text-gray-900 truncate" title={feature.name}>
                  {feature.name}
                </h3>
              </div>
              <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onViewDetails(feature)}
                  className="text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                  title="View Details"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onArchive(feature.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                  title="Archive"
                >
                  <ArchiveBoxIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onSplit(feature)}
                  className="text-gray-400 hover:text-purple-600 transition-colors duration-200"
                  title="Split"
                >
                  <ScissorsIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Status and type badges */}
            <div className="flex flex-wrap gap-1 my-2">
              {feature.status_name && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feature.status_name)}`}>
                  {feature.status_name}
                </span>
              )}
              {feature.feature_type && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(feature.feature_type)}`}>
                  {feature.feature_type}
                </span>
              )}
              {feature.is_archived && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Archived
                </span>
              )}
            </div>
            
            {/* Basic Information */}
            {!expandedCards[feature.id] && (
              <div className="text-xs text-gray-500 mb-2 line-clamp-1" title={feature.description}>
                {feature.description ? (
                  <div dangerouslySetInnerHTML={{ __html: feature.description.replace(/<\/?[^>]+(>|$)/g, " ").substring(0, 60) + (feature.description.length > 60 ? '...' : '') }} />
                ) : (
                  <span className="text-gray-400 italic">No description</span>
                )}
              </div>
            )}
            
            {/* Expanded information */}
            {expandedCards[feature.id] && (
              <div className="mb-2 text-xs">
                {/* Description */}
                {feature.description && (
                  <div className="mb-2">
                    <div className="font-medium text-gray-500 mb-1">Description:</div>
                    <div className="text-gray-600" 
                      dangerouslySetInnerHTML={{ 
                        __html: feature.description.replace(/<\/?[^>]+(>|$)/g, " ")
                      }} 
                    />
                  </div>
                )}
                
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    {feature.metadata_primary_product && (
                      <div className="text-gray-600">
                        <span className="text-gray-500">Product:</span> {feature.metadata_primary_product}
                      </div>
                    )}
                    
                    {feature.metadata_priority && (
                      <div className="text-gray-600">
                        <span className="text-gray-500">Priority:</span> {feature.metadata_priority}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {feature.metadata_effort_estimate && (
                      <div className="text-gray-600">
                        <span className="text-gray-500">Effort:</span> {feature.metadata_effort_estimate}
                      </div>
                    )}
                    
                    {feature.metadata_target_release && (
                      <div className="text-gray-600">
                        <span className="text-gray-500">Release:</span> {feature.metadata_target_release}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Footer info */}
            <div className="flex justify-between text-xs text-gray-500 mt-2 pt-1 border-t border-gray-100">
              <div className="flex items-center">
                {feature.owner_email ? (
                  <span className="inline-flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {feature.owner_email.split('@')[0]}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">Unassigned</span>
                )}
              </div>
              <div>
                {feature.updated_at_timestamp ? (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <ClockIcon className="h-3 w-3" />
                    {new Date(feature.updated_at_timestamp).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
