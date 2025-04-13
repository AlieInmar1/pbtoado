import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';

interface ProductBoardFeature {
  id: string;
  productboard_id: string;
  name: string;
  description: string;
  parent_type: string | null;
  parent_productboard_id: string | null;
  feature_type: string | null;
  status_id: string | null;
  status_name: string | null;
  timeframe_start_date: string | null;
  timeframe_end_date: string | null;
  timeframe_granularity: string | null;
  owner_email: string | null;
  is_archived: boolean;
  created_at_timestamp: string | null;
  updated_at_timestamp: string | null;
  last_health_update: string | null;
  metadata: any;
  workspace_id?: string;
}

interface FeatureDetailModalProps {
  feature: ProductBoardFeature;
  onClose: () => void;
}

export function FeatureDetailModal({ feature, onClose }: FeatureDetailModalProps) {
  // Function to safely render HTML content
  const createMarkup = (html: string) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  // Format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold text-gray-800">Feature Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 flex-grow">
          <div className="space-y-6">
            {/* Header section with name and type */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{feature.name}</h1>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                  feature.feature_type === 'feature' 
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' 
                    : 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20'
                }`}>
                  {feature.feature_type || 'Feature'}
                </span>
                {feature.status_name && (
                  <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/20">
                    {feature.status_name}
                  </span>
                )}
                {feature.is_archived && (
                  <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                    Archived
                  </span>
                )}
              </div>
            </div>

            {/* Description section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              {feature.description ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={createMarkup(feature.description)}
                />
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Parent info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">Parent</h3>
                {feature.parent_type && feature.parent_productboard_id ? (
                  <div>
                    <p className="text-sm text-gray-600">Type: {feature.parent_type}</p>
                    <p className="text-sm text-gray-600">ID: {feature.parent_productboard_id}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No parent</p>
                )}
              </div>

              {/* Owner info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">Owner</h3>
                {feature.owner_email ? (
                  <p className="text-sm text-gray-600">{feature.owner_email}</p>
                ) : (
                  <p className="text-gray-500 italic">No owner assigned</p>
                )}
              </div>

              {/* Timeframe info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">Timeframe</h3>
                {feature.timeframe_start_date || feature.timeframe_end_date ? (
                  <div>
                    {feature.timeframe_start_date && (
                      <p className="text-sm text-gray-600">Start: {formatDate(feature.timeframe_start_date)}</p>
                    )}
                    {feature.timeframe_end_date && (
                      <p className="text-sm text-gray-600">End: {formatDate(feature.timeframe_end_date)}</p>
                    )}
                    {feature.timeframe_granularity && (
                      <p className="text-sm text-gray-600">Granularity: {feature.timeframe_granularity}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No timeframe specified</p>
                )}
              </div>

              {/* Dates info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">Dates</h3>
                <div>
                  <p className="text-sm text-gray-600">Created: {formatDate(feature.created_at_timestamp)}</p>
                  <p className="text-sm text-gray-600">Updated: {formatDate(feature.updated_at_timestamp)}</p>
                  {feature.last_health_update && (
                    <p className="text-sm text-gray-600">Last Health Update: {formatDate(feature.last_health_update)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* IDs section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-2">IDs</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Database ID:</p>
                  <p className="text-sm text-gray-600 font-mono">{feature.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ProductBoard ID:</p>
                  <p className="text-sm text-gray-600 font-mono">{feature.productboard_id}</p>
                </div>
                {feature.status_id && (
                  <div>
                    <p className="text-xs text-gray-500">Status ID:</p>
                    <p className="text-sm text-gray-600 font-mono">{feature.status_id}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t px-4 py-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
