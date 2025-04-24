import React from 'react';

interface SuperSimpleMappingResultsTabProps {
  activeTab: string;
}

/**
 * A super simplified version of the MappingResultsTab component
 * that just displays a static message
 */
export const SuperSimpleMappingResultsTab: React.FC<SuperSimpleMappingResultsTabProps> = ({ 
  activeTab
}) => {
  // Return null if not on the mapping-results tab
  if (activeTab !== 'mapping-results') {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Mapping Results</h3>
      </div>
      
      <div className="bg-white p-6 rounded-md border border-gray-200 text-center">
        <h4 className="text-xl font-medium text-gray-700 mb-4">Hello World</h4>
        <p className="text-gray-500">
          This is a simplified version of the Mapping Results tab.
        </p>
      </div>
    </div>
  );
};

export default SuperSimpleMappingResultsTab;
