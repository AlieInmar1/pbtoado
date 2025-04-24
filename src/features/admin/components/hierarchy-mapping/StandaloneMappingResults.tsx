import React from 'react';

/**
 * A completely standalone component for mapping results
 * This doesn't rely on any tab switching mechanism or complex state
 */
export const StandaloneMappingResults: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-md border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Mapping Results</h3>
      
      <div className="bg-green-50 p-4 rounded-md border border-green-100">
        <p className="text-green-600 font-medium">
          This is a standalone component that doesn't use the tab system.
        </p>
        <p className="text-green-600 mt-2">
          It has no dependencies on parent components, no state management, and no data fetching.
        </p>
        <p className="text-green-600 mt-2">
          If you can see this message, the component is rendering correctly.
        </p>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-100">
        <h4 className="text-lg font-medium text-blue-700 mb-2">Static Example Data</h4>
        <div className="bg-white p-3 rounded border border-gray-200">
          <pre className="text-xs overflow-auto">
{JSON.stringify([
  {
    "pbId": "example-id-1",
    "pbName": "Example Feature 1",
    "pbType": "feature",
    "adoId": 12345,
    "adoName": "Example ADO Item 1",
    "adoType": "Feature",
    "isFullMatch": true
  },
  {
    "pbId": "example-id-2",
    "pbName": "Example Feature 2",
    "pbType": "feature",
    "adoId": 67890,
    "adoName": "Example ADO Item 2",
    "adoType": "User Story",
    "isFullMatch": false
  }
], null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default StandaloneMappingResults;
