import React, { useState } from 'react';
import { Story } from '../../../types/story-creator';
import { ProductBoardPushButton } from '../../../components/integration/ProductBoardPushButton';
import { ProductBoardPushResult } from '../../../types/productboard';
import { useToast } from '../../../contexts/ToastContext';

interface StorySubmissionStatusProps {
  story: Story;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  onRetry: () => void;
  onUpdate?: () => void;
}

/**
 * StorySubmissionStatus displays the current status of a story submission
 * and provides integration options with external systems like ProductBoard
 */
export const StorySubmissionStatus: React.FC<StorySubmissionStatusProps> = ({
  story,
  status,
  error,
  onRetry,
  onUpdate
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { addToast } = useToast();
  
  // Toggle details visibility
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // Handle successful ProductBoard push
  const handleProductBoardSuccess = (result: ProductBoardPushResult) => {
    addToast({
      title: 'Success',
      message: `Story successfully pushed to ProductBoard (ID: ${result.productboardId})`,
      type: 'success'
    });
    
    // Refresh the story data if needed
    onUpdate?.();
  };
  
  // Handle ProductBoard push error
  const handleProductBoardError = (error: Error | string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    addToast({
      title: 'Error',
      message: `Failed to push to ProductBoard: ${errorMessage}`,
      type: 'error'
    });
  };
  
  // Calculate status class
  const getStatusClass = () => {
    if (story.productboard_id) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  return (
    <div className="story-submission-status bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Story Submission Status
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Current status and external system integrations
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {/* Main status */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
            Database Status
          </h4>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Saved
            </span>
            <span className="text-sm text-gray-500">
              Last updated: {story.updated_at ? new Date(story.updated_at).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
        
        {/* ProductBoard Integration */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
            ProductBoard Integration
          </h4>
          
          <div className="flex items-center mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusClass()}`}>
              {story.productboard_id ? 'Synced' : 'Not Synced'}
            </span>
            
            {story.productboard_id && (
              <span className="text-sm text-gray-500 mr-4">
                ID: {story.productboard_id}
              </span>
            )}
            
            <ProductBoardPushButton
              item={story}
              onSuccess={handleProductBoardSuccess}
              onError={handleProductBoardError}
              buttonText={story.productboard_id ? 'Update in ProductBoard' : 'Push to ProductBoard'}
              buttonSize="sm"
              showOptions={true}
            />
          </div>
          
          {story.last_synced_at && (
            <p className="text-xs text-gray-500">
              Last synced: {new Date(story.last_synced_at).toLocaleString()}
            </p>
          )}
        </div>
        
        {/* Toggle details button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={toggleDetails}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        {/* Details section */}
        {showDetails && (
          <div className="mt-4 border-t pt-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Story ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{story.id}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900">{story.created_by || 'Unknown'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">{story.created_at ? new Date(story.created_at).toLocaleString() : 'N/A'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                <dd className="mt-1 text-sm text-gray-900">{story.updated_at ? new Date(story.updated_at).toLocaleString() : 'N/A'}</dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">ProductBoard ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{story.productboard_id || 'Not synced'}</dd>
              </div>
              
              {story.last_synced_at && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Last Synced</dt>
                  <dd className="mt-1 text-sm text-gray-900">{story.last_synced_at ? new Date(story.last_synced_at).toLocaleString() : 'N/A'}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};
