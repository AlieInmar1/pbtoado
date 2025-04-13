import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/admin/PageHeader';
import { ArrowPathIcon, CubeIcon, CheckCircleIcon, XMarkIcon, MagnifyingGlassIcon, TagIcon, FlagIcon } from '@heroicons/react/24/outline';
import { ProductBoardClient } from '../lib/api/productboard';
import type { Configuration } from '../types/database';
import type { ProductBoardInitiative, ProductBoardCustomField, ProductBoardObjective } from '../lib/api/productboard';

export function ProductBoardInitiatives() {
  const { db } = useDatabase();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Partial<Configuration>>({});
  const [initiatives, setInitiatives] = useState<ProductBoardInitiative[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [loadingInitiatives, setLoadingInitiatives] = useState(false);
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<ProductBoardInitiative | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customFields, setCustomFields] = useState<ProductBoardCustomField[]>([]);
  const [objectives, setObjectives] = useState<ProductBoardObjective[]>([]);
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [loadingObjectives, setLoadingObjectives] = useState(false);

  useEffect(() => {
    if (!db) return;
    const workspaceId = '904559d5-3948-43ae-8f6f-eb9bc3b20c85';

    async function loadConfig() {
      try {
        const config = await db?.configurations.getByWorkspace(workspaceId);
        setConfig(config || {});
      } catch (error) {
        console.error('Error loading configuration:', error);
        toast.error('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [db]);

  const testConnection = async () => {
    if (!config.productboard_api_key) {
      toast.error('ProductBoard API key is required');
      return;
    }

    setLoadingConnection(true);
    try {
      const client = new ProductBoardClient(config.productboard_api_key);
      const success = await client.testConnection();
      
      if (success) {
        setConnectionStatus('success');
        toast.success('Successfully connected to ProductBoard API');
        await loadInitiatives(config.productboard_api_key);
        await loadCustomFields(config.productboard_api_key);
      } else {
        setConnectionStatus('error');
        toast.error('Failed to connect to ProductBoard API');
      }
    } catch (error) {
      console.error('Error testing ProductBoard connection:', error);
      setConnectionStatus('error');
      toast.error('Failed to connect to ProductBoard API');
    } finally {
      setLoadingConnection(false);
    }
  };

  const loadInitiatives = async (apiKey: string) => {
    setLoadingInitiatives(true);
    try {
      const client = new ProductBoardClient(apiKey);
      const initiatives = await client.getInitiatives();
      setInitiatives(initiatives);
      
      if (initiatives.length > 0) {
        toast.success(`Loaded ${initiatives.length} initiatives from ProductBoard`);
      } else {
        toast.info('No initiatives found in ProductBoard');
      }
    } catch (error) {
      console.error('Error loading ProductBoard initiatives:', error);
      
      // Display a more user-friendly error message
      if (error instanceof Error && error.message.includes('Invalid ProductBoard API key')) {
        toast.error('Invalid ProductBoard API key. Please check your API key in the Admin Panel.');
      } else {
        toast.error('Failed to load ProductBoard initiatives. Please try again later.');
      }
    } finally {
      setLoadingInitiatives(false);
    }
  };

  const loadCustomFields = async (apiKey: string) => {
    setLoadingCustomFields(true);
    try {
      const client = new ProductBoardClient(apiKey);
      const customFields = await client.getCustomFields();
      setCustomFields(customFields);
      
      if (customFields.length > 0) {
        toast.success(`Loaded ${customFields.length} custom fields from ProductBoard`);
      } else {
        toast.info('No custom fields found in ProductBoard');
      }
    } catch (error) {
      console.error('Error loading ProductBoard custom fields:', error);
      
      // Display a more user-friendly error message
      if (error instanceof Error && error.message.includes('Invalid ProductBoard API key')) {
        toast.error('Invalid ProductBoard API key. Please check your API key in the Admin Panel.');
      } else {
        toast.error('Failed to load ProductBoard custom fields. Please try again later.');
      }
    } finally {
      setLoadingCustomFields(false);
    }
  };

  const loadObjectivesForInitiative = async (apiKey: string, initiativeId: string) => {
    setLoadingObjectives(true);
    try {
      const client = new ProductBoardClient(apiKey);
      const objectives = await client.getObjectivesForInitiative(initiativeId);
      setObjectives(objectives);
      
      if (objectives.length > 0) {
        toast.success(`Loaded ${objectives.length} objectives for this initiative`);
      } else {
        toast.info('No objectives found for this initiative');
      }
    } catch (error) {
      console.error('Error loading objectives for initiative:', error);
      toast.error('Failed to load objectives. Please try again later.');
    } finally {
      setLoadingObjectives(false);
    }
  };

  const handleInitiativeSelect = (initiative: ProductBoardInitiative) => {
    setSelectedInitiative(initiative);
    
    if (config.productboard_api_key) {
      loadObjectivesForInitiative(config.productboard_api_key, initiative.id);
    }
  };

  const handleRefresh = async () => {
    if (!config.productboard_api_key) {
      toast.error('ProductBoard API key is required');
      return;
    }
    
    await testConnection();
  };

  // Filter initiatives based on search query
  const filteredInitiatives = useMemo(() => {
    if (!searchQuery.trim()) return initiatives;
    
    const query = searchQuery.toLowerCase();
    return initiatives.filter(initiative => (
      initiative.name?.toLowerCase().includes(query) ||
      initiative.id?.toLowerCase().includes(query) ||
      initiative.description?.toLowerCase().includes(query) ||
      (typeof initiative.status === 'string' && 
        initiative.status.toLowerCase().includes(query)) ||
      (typeof initiative.status === 'object' && 
        initiative.status?.name?.toLowerCase().includes(query))
    ));
  }, [initiatives, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!config.productboard_api_key) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="ProductBoard Initiatives"
        />
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Explore ProductBoard initiatives and view available data</p>
        </div>
        
        <Card>
          <div className="p-8 text-center">
            <CubeIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">ProductBoard API Key Required</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please configure your ProductBoard API key in the Admin Panel to use this feature.
            </p>
            <div className="mt-6">
              <a
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Admin Panel
              </a>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="ProductBoard Initiatives"
        buttonText="Refresh"
        buttonIcon={ArrowPathIcon}
        onButtonClick={handleRefresh}
      />
      
      <div className="flex justify-end mb-4 space-x-4">
        <a
          href="/admin/productboard"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          View Features
        </a>
        <a
          href="/admin/productboard/initiative-hierarchy"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Initiative Hierarchy
        </a>
        <a
          href="/admin/productboard/hierarchy"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Unified Explorer
        </a>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">Explore ProductBoard initiatives and view available data</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Connection Status</h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={testConnection}
                disabled={loadingConnection}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loadingConnection ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </button>
              
              {connectionStatus === 'success' && (
                <span className="text-green-600 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  Connected successfully
                </span>
              )}
              
              {connectionStatus === 'error' && (
                <span className="text-red-600 flex items-center">
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Connection failed
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Initiatives</h3>
                {loadingInitiatives && (
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-indigo-600" />
                )}
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search initiatives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {initiatives.length === 0 ? (
              <div className="p-8 text-center">
                <CubeIcon className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Initiatives Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Test the connection to ProductBoard to load available initiatives.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInitiatives.map((initiative) => (
                      <tr 
                        key={initiative.id} 
                        className="hover:bg-gray-50 cursor-pointer" 
                        onClick={() => handleInitiativeSelect(initiative)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{initiative.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{initiative.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {typeof initiative.status === 'object' && initiative.status !== null 
                              ? ((initiative.status as any).name || 'Unknown') 
                              : (initiative.status || 'Unknown')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {initiative.created_at ? new Date(initiative.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {searchQuery.trim() && (
                  <div className="mt-2 text-sm text-gray-500 italic">
                    Showing {filteredInitiatives.length} of {initiatives.length} initiatives
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Information</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-700 mb-2">
                <strong>API Key:</strong> {config.productboard_api_key ? '••••••••' + config.productboard_api_key.slice(-4) : 'Not set'}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> This view shows the available initiatives from ProductBoard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Initiative Details Modal */}
      {selectedInitiative && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Initiative Details: {selectedInitiative.name}
              </h3>
              <button 
                onClick={() => setSelectedInitiative(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <Card className="overflow-hidden">
                  <CardContent>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ID:</span>
                        <p className="text-sm text-gray-900">{selectedInitiative.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-sm text-gray-900">{selectedInitiative.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <p className="text-sm text-gray-900">
                          {typeof selectedInitiative.status === 'object' && selectedInitiative.status !== null 
                            ? ((selectedInitiative.status as any).name || 'Unknown') 
                            : (selectedInitiative.status || 'Unknown')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created:</span>
                        <p className="text-sm text-gray-900">
                          {selectedInitiative.created_at ? new Date(selectedInitiative.created_at as string).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Updated:</span>
                        <p className="text-sm text-gray-900">
                          {selectedInitiative.updated_at ? new Date(selectedInitiative.updated_at as string).toLocaleString() : '-'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Parent Info */}
                <Card className="overflow-hidden">
                  <CardContent>
                    <h4 className="font-medium text-gray-900 mb-2">Relationships</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Parent:</span>
                        <p className="text-sm text-gray-900">
                          {selectedInitiative.parent 
                            ? `${selectedInitiative.parent.name} (${selectedInitiative.parent.id})` 
                            : 'None'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Children:</span>
                        {selectedInitiative.children && selectedInitiative.children.length > 0 ? (
                          <ul className="text-sm text-gray-900 list-disc pl-5">
                            {selectedInitiative.children.map(child => (
                              <li key={child.id}>{child.name} ({child.id})</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-900">None</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="md:col-span-2 overflow-hidden">
                  <CardContent>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedInitiative.description || 'No description available.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Custom Fields */}
                <Card className="md:col-span-2 overflow-hidden">
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Custom Fields</h4>
                      {loadingCustomFields && (
                        <ArrowPathIcon className="h-4 w-4 animate-spin text-indigo-600" />
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      {selectedInitiative && Object.entries(selectedInitiative)
                        .filter(([key, value]) => 
                          // Filter for likely custom fields (those not in the standard fields)
                          !['id', 'name', 'description', 'status', 'parent', 'children', 'created_at', 'updated_at'].includes(key) && 
                          // Exclude empty values
                          value !== null && value !== undefined && value !== ''
                        )
                        .map(([key, value]) => (
                          <div key={key} className="mb-2">
                            <div className="flex items-center">
                              <TagIcon className="h-4 w-4 text-indigo-500 mr-2" />
                              <span className="text-sm font-medium text-gray-700">{key.replace(/_/g, ' ')}:</span>
                            </div>
                            <div className="ml-6 text-sm text-gray-900">
                              {typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value)}
                            </div>
                          </div>
                        ))}
                      {(!selectedInitiative || Object.entries(selectedInitiative)
                        .filter(([key, value]) => 
                          !['id', 'name', 'description', 'status', 'parent', 'children', 'created_at', 'updated_at'].includes(key) && 
                          value !== null && value !== undefined && value !== ''
                        ).length === 0) && (
                        <p className="text-sm text-gray-500 italic">No custom fields found for this initiative</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Objectives */}
                <Card className="md:col-span-2 overflow-hidden">
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Related Objectives</h4>
                      {loadingObjectives && (
                        <ArrowPathIcon className="h-4 w-4 animate-spin text-indigo-600" />
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      {objectives.length > 0 ? (
                        <div className="space-y-3">
                          {objectives.map(objective => (
                            <div key={objective.id} className="border-l-2 border-indigo-500 pl-3">
                              <div className="flex items-center">
                                <FlagIcon className="h-4 w-4 text-indigo-500 mr-2" />
                                <span className="text-sm font-medium text-gray-900">{objective.name}</span>
                              </div>
                              {objective.description && (
                                <p className="text-sm text-gray-700 mt-1">{objective.description}</p>
                              )}
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                {objective.timeframe && (
                                  <span className="mr-3">Timeframe: {objective.timeframe}</span>
                                )}
                                {objective.status && (
                                  <span className="mr-3">Status: {objective.status}</span>
                                )}
                                {objective.progress !== undefined && (
                                  <span>Progress: {objective.progress}%</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No objectives associated with this initiative</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* All Fields (Raw Data) */}
                <Card className="md:col-span-2 overflow-hidden">
                  <CardContent>
                    <h4 className="font-medium text-gray-900 mb-2">All Available Fields</h4>
                    <div className="bg-gray-50 p-4 rounded overflow-x-auto max-h-[300px]">
                      <pre className="text-xs text-gray-800">
                        {JSON.stringify(selectedInitiative, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
