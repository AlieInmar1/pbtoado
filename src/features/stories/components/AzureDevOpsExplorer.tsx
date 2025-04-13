import React, { useState } from 'react'; // Import useState
import { useAzureDevOps } from '../../../hooks/useAzureDevOps';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/shadcn/card';
import { Button } from '../../../components/ui/shadcn/button';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/shadcn/tabs'; // Import Tabs components

// Helper component to display key-value pairs, making relations clickable
const DetailItem: React.FC<{ label: string; value: any; onClick?: (id: number) => void }> = ({ label, value, onClick }) => {
  const isRelation = (label === 'Parent' || label === 'Related') && typeof value === 'string' && value.includes('/_apis/wit/workItems/');
  const id = isRelation ? parseInt(value.split('/').pop() || '', 10) : null;

  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 col-span-2 break-all"> 
        {isRelation && id && onClick ? (
          <Button variant="link" className="p-0 h-auto text-blue-600 hover:underline" onClick={() => onClick(id)}>
            {value} (ID: {id})
          </Button>
        ) : typeof value === 'object' ? (
          <pre className="text-xs bg-gray-50 p-1 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>
        ) : (
          String(value ?? 'N/A')
        )}
      </dd>
    </div>
  );
};


export const AzureDevOpsExplorer: React.FC = () => {
  const [currentWorkItemId, setCurrentWorkItemId] = useState<number>(227432); // State for current ID

  const { 
    isConnected, 
    isConnectionLoading,
    connectionError,
    workItems, 
    isWorkItemsLoading,
    workItemsError,
    refetchWorkItems: originalRefetch // Rename original refetch
  } = useAzureDevOps(currentWorkItemId); // Pass current ID to the hook

  const workItem = workItems && workItems.length > 0 ? workItems[0] : null;
  const fields = workItem?.fields || {};
  const relations = workItem?.relations || [];

  // Handler for clicking relation links
  const handleRelationClick = (id: number) => {
    setCurrentWorkItemId(id); // Update state to trigger refetch via useAzureDevOps hook
  };
  
  // Refetch function that uses the current ID
  const refetchCurrentWorkItem = () => {
     // For now, just setting the ID again might be sufficient if data is stale
     setCurrentWorkItemId(currentWorkItemId); 
     // TODO: Consider using queryClient.invalidateQueries if needed for forced refetch
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Azure DevOps Explorer</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/stories'}
          >
            Back to Stories
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/stories/azure-devops-data'}
          >
            View Hierarchy Data
          </Button>
          <Button 
            variant="default"
            disabled={isWorkItemsLoading || isConnectionLoading} // Update disabled state check
            onClick={refetchCurrentWorkItem} // Use the new refetch function
          >
            {isWorkItemsLoading ? ( // Use isWorkItemsLoading
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Status of the connection to Azure DevOps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnectionLoading ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-primary rounded-full"></div>
              Testing connection...
            </div>
          ) : connectionError ? (
            <div className="text-red-500">
              Error connecting: {connectionError instanceof Error ? connectionError.message : 'Unknown error'}
            </div>
          ) : isConnected ? (
            <div className="text-green-500">
              Connected to Azure DevOps (inmar/Healthcare)
            </div>
          ) : (
            <div className="text-red-500">
              Not connected to Azure DevOps
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Work Item Details */}
      <Card>
        <CardHeader>
          <CardTitle>Work Item Details (ID: {workItem?.id ?? 'N/A'})</CardTitle>
          <CardDescription>
            Detailed information for the fetched work item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isWorkItemsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin h-8 w-8 border-2 border-b-transparent border-primary rounded-full"></div>
            </div>
          ) : workItemsError ? (
            <div className="text-red-500">
              Error loading work item: {workItemsError instanceof Error ? workItemsError.message : 'Unknown error'}
            </div>
          ) : !workItem ? (
            <div className="text-gray-500 p-4">
              Work item not found or not loaded.
            </div>
          ) : (
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="relations">Relations</TabsTrigger>
                <TabsTrigger value="rawData">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <dl>
                  <DetailItem label="Title" value={fields['System.Title']} />
                  <DetailItem label="Type" value={fields['System.WorkItemType']} />
                  <DetailItem label="State" value={fields['System.State']} />
                  <DetailItem label="Reason" value={fields['System.Reason']} />
                  <DetailItem label="Area Path" value={fields['System.AreaPath']} />
                  <DetailItem label="Iteration Path" value={fields['System.IterationPath']} />
                  <DetailItem label="Assigned To" value={fields['System.AssignedTo']?.displayName} />
                  <DetailItem label="Created By" value={fields['System.CreatedBy']?.displayName} />
                  <DetailItem label="Created Date" value={fields['System.CreatedDate']} />
                  <DetailItem label="Changed By" value={fields['System.ChangedBy']?.displayName} />
                  <DetailItem label="Changed Date" value={fields['System.ChangedDate']} />
                  <DetailItem label="Priority" value={fields['Microsoft.VSTS.Common.Priority']} />
                  <DetailItem label="Value Area" value={fields['Microsoft.VSTS.Common.ValueArea']} />
                  <DetailItem label="Tags" value={fields['System.Tags']} />
                  {/* Add more fields as needed */}
                </dl>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Description</h4>
                  <div 
                    className="text-sm text-gray-800 border p-2 rounded bg-gray-50 max-h-60 overflow-auto" 
                    dangerouslySetInnerHTML={{ __html: fields['System.Description'] || 'N/A' }} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="relations">
                {relations.length === 0 ? (
                  <div className="text-gray-500 p-4">No relations found.</div>
                ) : (
                  <dl>
                    {relations.map((rel: any, index: number) => (
                      <DetailItem 
                        key={index} // Keep only one key prop
                        label={rel.attributes?.name || rel.rel} 
                        value={rel.url} 
                        onClick={handleRelationClick} // Pass the click handler
                      />
                    ))}
                  </dl>
                )}
              </TabsContent>

              <TabsContent value="rawData">
                <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  <pre className="text-xs">
                    {JSON.stringify(workItem, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
