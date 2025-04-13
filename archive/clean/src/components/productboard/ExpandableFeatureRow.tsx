import React, { useState } from 'react';
import { ProductBoardFeature } from '../../types/productboard';
import { ChevronDownIcon, ChevronRightIcon, EyeIcon, ArchiveBoxIcon, ScissorsIcon } from '@heroicons/react/24/outline';

interface ExpandableFeatureRowProps {
  feature: ProductBoardFeature;
  index: number;
  onViewDetails: (feature: ProductBoardFeature) => void;
  onArchive: (id: string) => void;
  onSplit: (feature: ProductBoardFeature) => void;
}

export function ExpandableFeatureRow({ 
  feature, 
  index, 
  onViewDetails, 
  onArchive, 
  onSplit 
}: ExpandableFeatureRowProps) {
  const [expanded, setExpanded] = useState(false);

  // Helper for status color
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

  // Helper for feature type color
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

  // Priority color
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
    <>
      <tr 
        className={`text-xs ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer' }}
      >
        <td className="px-4 py-2 flex items-center">
          {expanded ? 
            <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-1" /> : 
            <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-1" />
          }
          <span className="font-medium truncate">{feature.name}</span>
        </td>
        
        <td className="px-4 py-2">
          {feature.status_name && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feature.status_name)}`}>
              {feature.status_name}
            </span>
          )}
        </td>
        
        <td className="px-4 py-2">
          {feature.feature_type && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(feature.feature_type)}`}>
              {feature.feature_type}
            </span>
          )}
        </td>
        
        <td className="px-4 py-2 text-gray-500">
          {feature.owner_email ? feature.owner_email.split('@')[0] : 'None'}
        </td>
        
        <td className="px-4 py-2 text-right">
          <div className="flex space-x-1 justify-end" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onViewDetails(feature)}
              className="text-indigo-600 hover:text-indigo-900"
              title="View Details"
            >
              <EyeIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onArchive(feature.id)}
              className="text-red-600 hover:text-red-900"
              title="Archive"
            >
              <ArchiveBoxIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onSplit(feature)}
              className="text-purple-600 hover:text-purple-900"
              title="Split"
            >
              <ScissorsIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      
      {expanded && (
        <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          <td colSpan={5} className="px-4 py-2 text-xs">
            <div className="pl-4 border-l-2 border-gray-300">
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
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Left column */}
                <div>
                  {feature.metadata_primary_product && (
                    <div className="mb-1">
                      <span className="font-medium text-gray-500">Product: </span>
                      <span className="text-gray-600">{feature.metadata_primary_product}</span>
                    </div>
                  )}
                  
                  {feature.metadata_category && (
                    <div className="mb-1">
                      <span className="font-medium text-gray-500">Category: </span>
                      <span className="text-gray-600">{feature.metadata_category}</span>
                    </div>
                  )}
                  
                  {feature.metadata_priority && (
                    <div className="mb-1">
                      <span className="font-medium text-gray-500">Priority: </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(feature.metadata_priority)}`}>
                        {feature.metadata_priority}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Right column */}
                <div>
                  {feature.metadata_effort_estimate && (
                    <div className="mb-1">
                      <span className="font-medium text-gray-500">Effort: </span>
                      <span className="text-gray-600">{feature.metadata_effort_estimate}</span>
                    </div>
                  )}
                  
                  {feature.metadata_impact_score && (
                    <div className="mb-1">
                      <span className="font-medium text-gray-500">Impact: </span>
                      <span className="text-gray-600">{feature.metadata_impact_score}</span>
                    </div>
                  )}
                  
                  {feature.metadata_target_release && (
                    <div className="mb-1">
                      <span className="font-medium text-gray-500">Release: </span>
                      <span className="text-gray-600">{feature.metadata_target_release}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dates and IDs */}
              <div className="grid grid-cols-2 gap-2 text-gray-500">
                <div>
                  {feature.created_at_timestamp && (
                    <div>Created: {new Date(feature.created_at_timestamp).toLocaleDateString()}</div>
                  )}
                  
                  {feature.updated_at_timestamp && (
                    <div>Updated: {new Date(feature.updated_at_timestamp).toLocaleDateString()}</div>
                  )}
                </div>
                
                <div>
                  {feature.id && (
                    <div>ID: {feature.id.substring(0, 8)}...</div>
                  )}
                  
                  {feature.productboard_id && (
                    <div>ProductBoard ID: {feature.productboard_id}</div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
