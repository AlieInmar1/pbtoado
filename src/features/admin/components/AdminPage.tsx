import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/shadcn/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/shadcn/card';
import { Button } from '../../../components/ui/shadcn/button';
import { Input } from '../../../components/ui/shadcn/input';
import { ConnectionStatus, ConnectionInfo } from '../../../components/admin/ConnectionStatus';
import AzureDevOpsSyncButton from '../../../components/admin/AzureDevOpsSyncButton';
import WorkItemTester from '../../../components/admin/WorkItemTester';
import { RefreshCw, Save, AlertTriangle } from 'lucide-react';

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
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="productboard">ProductBoard</TabsTrigger>
          <TabsTrigger value="azuredevops">Azure DevOps</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
          <TabsTrigger value="mapping">Mapping</TabsTrigger>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="Enter ProductBoard API Key"
                  value={pbApiKey}
                  onChange={(e) => setPbApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  You can find your API key in the ProductBoard Developer Settings.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">API URL</label>
                <Input
                  type="text"
                  placeholder="Enter ProductBoard API URL"
                  value={pbApiUrl}
                  onChange={(e) => setPbApiUrl(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end">
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Personal Access Token</label>
                <Input
                  type="password"
                  placeholder="Enter Azure DevOps PAT"
                  value={adoToken}
                  onChange={(e) => setAdoToken(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Generate a PAT with appropriate permissions in your Azure DevOps settings.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization</label>
                <Input
                  type="text"
                  placeholder="Enter Azure DevOps Organization"
                  value={adoOrg}
                  onChange={(e) => setAdoOrg(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Input
                  type="text"
                  placeholder="Enter Azure DevOps Project"
                  value={adoProject}
                  onChange={(e) => setAdoProject(e.target.value)}
                />
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
      </Tabs>
      
      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Overview of system performance and recent sync operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-md border border-green-100">
                <div className="text-sm text-gray-500">API Requests (24h)</div>
                <div className="text-2xl font-semibold">1,245</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <div className="text-sm text-gray-500">Items Synced (24h)</div>
                <div className="text-2xl font-semibold">305</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                <div className="text-sm text-gray-500">Sync Errors (24h)</div>
                <div className="text-2xl font-semibold">2</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Recent Sync Operations</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {MOCK_SYNC_HISTORY.map((sync) => (
                      <tr key={sync.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sync.timestamp.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sync.status === 'success' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Success
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Error
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sync.itemsProcessed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sync.error && (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              {sync.error}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
