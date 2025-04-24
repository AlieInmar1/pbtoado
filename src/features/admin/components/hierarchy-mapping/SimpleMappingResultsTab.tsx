import React from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { RefreshCw } from 'lucide-react';
import { MappingResultsTabProps } from './types';

/**
 * Extremely simplified MappingResultsTab component
 * This component has minimal state management and logic
 * Just enough to test if the tab rendering and data fetching works
 */
export const SimpleMappingResultsTab: React.FC<MappingResultsTabProps> = ({ 
  editedMapping,
  activeTab,
  mappingResults,
  isLoadingResults,
  resultsError,
  fetchMappingResults
}) => {
  // Early return if not active tab
  if (!editedMapping || activeTab !== 'mapping-results') {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Mapping Results (Simple Test Component)</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchMappingResults}
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
          <div className="bg-green-50 p-4 rounded-md border border-green-100">
            <p className="text-green-600 font-medium">
              This is a simplified test component.
            </p>
            <p className="text-green-600 mt-2">
              If you can see this message, the component is rendering correctly.
            </p>
            <p className="text-green-600 mt-2">
              Click the "Refresh Results" button above to test data fetching.
            </p>
          </div>
        ) : (
          <div>
            <div className="bg-green-50 p-4 rounded-md border border-green-100 mb-4">
              <p className="text-green-600 font-medium">
                Success! The component is working correctly.
              </p>
              <p className="text-green-600 mt-2">
                Data was successfully fetched and displayed below.
              </p>
            </div>
            <h4 className="text-lg font-medium mb-4">Mock Results</h4>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
              {JSON.stringify(mappingResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleMappingResultsTab;
