import { useState, useEffect } from 'react';
import { adoWorkItemsApi, ADOWorkItem } from '../../lib/api/adoWorkItems';

interface ADOWorkItemsExplorerProps {
  organization: string;  // Now required
  project: string;       // Now required
  apiKey: string;        // Now required
  workItemType?: string;
  onSelectItem?: (item: ADOWorkItem) => void;
}

export const ADOWorkItemsExplorer: React.FC<ADOWorkItemsExplorerProps> = ({
  organization,
  project,
  apiKey,
  workItemType = 'Epic',
  onSelectItem,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workItems, setWorkItems] = useState<ADOWorkItem[]>([]);
  
  // Fetch work items when the component mounts or props change
  useEffect(() => {
    if (organization && project && apiKey) {
      fetchWorkItems();
    }
  }, [organization, project, apiKey, workItemType]);
  
  const fetchWorkItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Since organization, project, and apiKey are required props, we can use them directly
      if (!organization || !project || !apiKey) {
        throw new Error('Missing Azure DevOps credentials.');
      }
      
      const response = await adoWorkItemsApi.getWorkItemsByType(organization, project, apiKey, workItemType);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch work items');
      }
      
      setWorkItems(response.data);
    } catch (err) {
      console.error('Error fetching work items:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectItem = (item: ADOWorkItem) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
  };
  
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-md">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h3 className="font-semibold mb-2">Error loading Azure DevOps items</h3>
        <p>{error}</p>
        <button 
          onClick={fetchWorkItems}
          className="mt-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
        <h3 className="font-semibold text-blue-800">
          Azure DevOps: {workItemType}s ({workItems.length})
        </h3>
        <button 
          onClick={fetchWorkItems}
          className="text-blue-700 hover:text-blue-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {workItems.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No {workItemType}s found
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {workItems.map(item => (
            <div 
              key={item.id}
              className="p-3 hover:bg-gray-50 cursor-pointer flex items-start"
              onClick={() => handleSelectItem(item)}
            >
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <span>ID: {item.id}</span>
                  <span>•</span>
                  <span>State: {item.state}</span>
                </div>
              </div>
              <div className="ml-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.state === 'New' ? 'bg-blue-100 text-blue-800' :
                  item.state === 'Active' ? 'bg-green-100 text-green-800' :
                  item.state === 'Resolved' ? 'bg-yellow-100 text-yellow-800' :
                  item.state === 'Closed' ? 'bg-gray-100 text-gray-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {item.state}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ADOWorkItemsExplorer;
