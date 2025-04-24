import React, { useEffect } from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { RefreshCw } from 'lucide-react';
import { MappingResultsTabProps } from './types';

/**
 * Simplified MappingResultsTab component for debugging
 */
export const MappingResultsTab: React.FC<MappingResultsTabProps> = ({ 
  editedMapping,
  activeTab,
  mappingResults,
  isLoadingResults,
  resultsError,
  fetchMappingResults
}) => {
  // Log component rendering
  console.log('MappingResultsTab rendering with:', {
    activeTab,
    isLoadingResults,
    hasResults: Array.isArray(mappingResults) && mappingResults.length > 0,
    hasError: !!resultsError
  });
  
  // Force reset loading state after 5 seconds if it gets stuck
  useEffect(() => {
    console.log('MappingResultsTab useEffect triggered, isLoadingResults:', isLoadingResults);
    
    if (isLoadingResults) {
      console.log('MappingResultsTab: Setting up loading timeout');
      const timeoutId = setTimeout(() => {
        console.warn('MappingResultsTab: Loading timeout - forcing reset');
        fetchMappingResults();
      }, 5000);
      
      return () => {
        console.log('MappingResultsTab: Clearing timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [isLoadingResults, fetchMappingResults]);
  
  // Early return if not active tab
  if (!editedMapping || activeTab !== 'mapping-results') {
    console.log('MappingResultsTab: Early return - not active tab or no mapping');
    return null;
  }
  
  console.log('MappingResultsTab: Rendering content');
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Simplified Mapping Results</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            console.log('Refresh button clicked');
            fetchMappingResults();
          }}
          disabled={isLoadingResults}
          className="flex items-center"
        >
          {isLoadingResults ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-primary rounded-full"></div>
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Results
            </>
          )}
        </Button>
      </div>
      
      {/* Simple content display */}
      <div className="bg-white p-6 rounded-md border border-gray-200">
        {resultsError ? (
          <div className="bg-red-50 p-4 rounded-md border border-red-100">
            <p className="text-red-500">
              Error: {resultsError.message || 'An error occurred while fetching mapping results'}
            </p>
          </div>
        ) : isLoadingResults ? (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 flex items-center justify-center">
            <div className="animate-spin mr-2 h-6 w-6 border-4 border-b-transparent border-blue-500 rounded-full"></div>
            <p className="text-blue-500 text-lg">Loading mapping results...</p>
          </div>
        ) : !Array.isArray(mappingResults) || mappingResults.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <p className="text-gray-500">
              No mapping results available. Click "Refresh Results" to fetch the latest mapping results.
            </p>
          </div>
        ) : (
          <div>
            <h4 className="text-lg font-medium mb-4">Mock Results Available</h4>
            <p className="mb-2">Successfully loaded {mappingResults.length} mapping results.</p>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
              {JSON.stringify(mappingResults[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MappingResultsTab;
