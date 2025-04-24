import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/shadcn/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/shadcn/card';
import { Button } from '../../../components/ui/shadcn/button';
import { Input } from '../../../components/ui/shadcn/input';
import { ConnectionStatus, ConnectionInfo } from '../../../components/admin/ConnectionStatus';
import AzureDevOpsSyncButton from '../../../components/admin/AzureDevOpsSyncButton';
import ProductBoardSyncButton from '../../../components/admin/ProductBoardSyncButton';
import ProductBoardTokenButton from '../../../components/admin/ProductBoardTokenButton';
import WorkItemTester from '../../../components/admin/WorkItemTester';
import { RefreshCw, Save, AlertTriangle, Link as LinkIcon } from 'lucide-react'; // Added LinkIcon
import { Link } from 'react-router-dom'; // Import Link for navigation

// Mock data for connections
const MOCK_CONNECTIONS: ConnectionInfo[] = [
  {
    name: 'ProductBoard API',
    state: 'connected',
    lastChecked: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000), // 29 days from now
  },
  {
    name: 'Azure DevOps API',
    state: 'connected',
    lastChecked: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    expiresAt: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000), // 89 days from now
  }
];

// Mock data for sync history
const MOCK_SYNC_HISTORY = [
  { id: '1', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'success', itemsProcessed: 150 },
  { id: '2', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), status: 'success', itemsProcessed: 145 },
  { id: '3', timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000), status: 'error', itemsProcessed: 10, error: 'API rate limit exceeded' },
];

/**
 * AdminPage component provides a central interface for managing
 * API connections, system health, and configuration settings.
 */
export const AdminPage: React.FC = () => {
  // State for API settings
  const [pbApiKey, setPbApiKey] = useState('');
  const [pbApiUrl, setPbApiUrl] = useState('https://api.productboard.com');
  const [adoToken, setAdoToken] = useState('');
  const [adoOrg, setAdoOrg] = useState('');
  const [adoProject, setAdoProject] = useState('');
  
  // State for sync settings
  const [syncFrequency, setSyncFrequency] = useState('60');
  const [autoSync, setAutoSync] = useState(true);
  
  // Handle refresh connection
  const handleRefreshConnection = (connectionName: string) => {
    console.log(`Refreshing connection: ${connectionName}`);
    // In a real implementation, this would call an API to refresh the connection
  };
  
  // Handle test connection
  const handleTestConnection = (connectionName: string) => {
    console.log(`Testing connection: ${connectionName}`);
    // In a real implementation, this would call an API to test the connection
  };
  
  // Handle save settings
  const handleSaveSettings = (settingsType: 'productboard' | 'azuredevops' | 'sync') => {
    console.log(`Saving ${settingsType} settings`);
    // In a real implementation, this would call an API to save the settings
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>
      
      {/* Connection Status */}
      <ConnectionStatus 
        connections={MOCK_CONNECTIONS}
        onRefresh={handleRefreshConnection}
        onTestConnection={handleTestConnection}
      />
      
      {/* Settings Tabs */}
      <Tabs defaultValue="productboard" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="productboard">ProductBoard</TabsTrigger>
          <TabsTrigger value="azuredevops">Azure DevOps</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
          <TabsTrigger value="mapping">Mapping</TabsTrigger>
          <TabsTrigger value="system">System Config</TabsTrigger>
          <TabsTrigger value="pb-ado-link">PB-ADO Linker</TabsTrigger> {/* Added new tab trigger */}
        </TabsList>
        
        {/* ProductBoard Settings */}
        <TabsContent value="productboard">
          <Card>
            <CardHeader>
              <CardTitle>ProductBoard API Settings</CardTitle>
              <CardDescription>
                Configure your ProductBoard API connection settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>API Configuration:</strong> ProductBoard API is configured and ready to use.
                </p>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Authentication Token</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Capture and store ProductBoard authentication token for UI automation. This token is required 
                  for the integration to add Azure DevOps work item links back to ProductBoard features.
                </p>
                <div className="mb-4">
                  <ProductBoardTokenButton 
                    onCaptureComplete={(result: { success: boolean; message: string }) => {
                      console.log('ProductBoard token capture result:', result);
                      // In a real implementation, you might want to refresh the connection status or show a notification
                    }}
                  />
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Data Synchronization</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Manually sync ProductBoard data to the local database. This will fetch all initiatives, 
                  features, objectives, and components from ProductBoard and store them in the database.
                </p>
                <ProductBoardSyncButton 
                  onSyncComplete={(result) => {
                    console.log('ProductBoard sync completed:', result);
                    // In a real implementation, you might want to refresh the connection status or show a notification
                  }}
                />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => handleSaveSettings('productboard')}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Azure DevOps Settings */}
        <TabsContent value="azuredevops">
          <Card>
            <CardHeader>
              <CardTitle>Azure DevOps API Settings</CardTitle>
              <CardDescription>
                Configure your Azure DevOps API connection settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>API Configuration:</strong> Azure DevOps API is configured and ready to use.
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  <strong>Organization:</strong> Inmar
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Project:</strong> Healthcare
                </p>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Data Synchronization</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Manually sync Azure DevOps data to the local cache. This will fetch all work items, 
                  area paths, and other data from Azure DevOps and store them in the database.
                </p>
                <AzureDevOpsSyncButton 
                  onSyncComplete={(result) => {
                    console.log('Sync completed:', result);
                    // In a real implementation, you might want to refresh the connection status or show a notification
                  }}
                />
              </div>
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Work Item Testing</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Test fetching, mapping, and saving individual work items to diagnose any issues with the Azure DevOps integration.
                </p>
                <WorkItemTester 
                  organization={adoOrg}
                  project={adoProject}
                  apiKey={adoToken}
                />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => handleSaveSettings('azuredevops')}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sync Settings */}
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Settings</CardTitle>
              <CardDescription>
                Configure how data is synchronized between ProductBoard and Azure DevOps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sync Frequency (minutes)</label>
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  placeholder="Enter sync frequency in minutes"
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  How often the system should automatically sync data (minimum 5 minutes).
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto Sync</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Enable automatic synchronization</span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('sync')}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Mapping Settings */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Hierarchy Mapping Configuration</CardTitle>
              <CardDescription>
                Configure how ProductBoard items map to Azure DevOps items based on their hierarchy level.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                The hierarchy mapping configuration allows you to define how ProductBoard items (Initiatives, Features, Sub-features) 
                map to Azure DevOps work item types (Epics, Features, User Stories) and how they are assigned to area paths.
              </p>
              
              <div className="flex justify-end">
                <Button 
                  variant="primary"
                  onClick={() => window.location.href = '/admin/hierarchy-mapping'}
                  className="flex items-center"
                >
                  Configure Hierarchy Mapping
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Configuration Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Manage application-wide configuration settings, API keys, and environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                System configuration allows you to securely store and manage sensitive configuration 
                values like API keys, tokens, and application settings. These values are stored in the 
                database and can be accessed by the application as needed.
              </p>
              
              <div className="p-4 bg-yellow-50 rounded-md border border-yellow-100 mb-4">
                <p className="text-sm text-yellow-700 flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
                  <span>Managing configuration here allows secure storage of sensitive API keys and tokens. 
                  Be careful when editing these values, as incorrect configuration may disrupt application functionality.</span>
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/admin/system-config'}
                  className="flex items-center"
                >
                  Manage System Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PB-ADO Linker Tab */}
        <TabsContent value="pb-ado-link">
          <Card>
            <CardHeader>
              <CardTitle>ProductBoard to ADO Linker (UI Automation)</CardTitle>
              <CardDescription>
                Manually trigger the UI automation to link a specific ProductBoard item to an ADO work item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                This tool uses the captured ProductBoard session token to automate the linking process directly in the ProductBoard interface.
                Ensure a valid session token has been captured recently.
              </p>
              <Link to="/admin/pb-ado-linker">
                <Button variant="outline" className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Go to PB-ADO Linker Tool
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      
      {/* Mapping Results */}
      <Card>
        <CardHeader>
          <CardTitle>Hierarchy Mapping Results</CardTitle>
          <CardDescription>
            View and analyze the mapping between ProductBoard and Azure DevOps items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              The mapping results page shows how ProductBoard items (Initiatives, Features, Sub-features) 
              map to Azure DevOps work items (Epics, Features, User Stories) based on your configured mappings.
              You can view matches, mismatches, and items that exist in only one system.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-md border border-green-100">
                <div className="text-sm text-gray-500">Full Matches</div>
                <div className="text-2xl font-semibold" id="full-matches-count">-</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                <div className="text-sm text-gray-500">Partial Matches</div>
                <div className="text-2xl font-semibold" id="partial-matches-count">-</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-md border border-red-100">
                <div className="text-sm text-gray-500">No Matches</div>
                <div className="text-2xl font-semibold" id="no-matches-count">-</div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="text-md font-medium mb-2 text-blue-800">ProductBoard Items</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-gray-500">Initiatives</div>
                    <div className="text-lg font-semibold" id="pb-initiatives-count">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Features</div>
                    <div className="text-lg font-semibold" id="pb-features-count">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Sub-features</div>
                    <div className="text-lg font-semibold" id="pb-subfeatures-count">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-semibold" id="pb-total-count">-</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                <h3 className="text-md font-medium mb-2 text-purple-800">Azure DevOps Items</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-gray-500">Epics</div>
                    <div className="text-lg font-semibold" id="ado-epics-count">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Features</div>
                    <div className="text-lg font-semibold" id="ado-features-count">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">User Stories</div>
                    <div className="text-lg font-semibold" id="ado-stories-count">-</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-semibold" id="ado-total-count">-</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              <Button 
                variant="default"
                onClick={() => window.location.href = '/admin/mapping-results'}
                className="flex items-center"
                size="lg"
              >
                View Detailed Mapping Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
