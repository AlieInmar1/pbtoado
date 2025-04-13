import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  InformationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { ProductBoardClient, ProductBoardFeature, ProductBoardInitiative } from '../../lib/api/productboard';
import { FeatureDetailModal } from './FeatureDetailModal';
import { InitiativeDetailModal } from './InitiativeDetailModal';
import { ProductView } from './ProductView';

interface InitiativeWithFeatures extends ProductBoardInitiative {
  features?: ProductBoardFeature[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

export function ProductBoardInitiativeExplorer({ apiKey }: { apiKey?: string }) {
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [isLoading, setIsLoading] = useState(false);
  const [initiatives, setInitiatives] = useState<InitiativeWithFeatures[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<ProductBoardFeature | null>(null);
  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeWithFeatures | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [client, setClient] = useState<ProductBoardClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [sortField, setSortField] = useState<keyof ProductBoardInitiative>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false);

  // Update localApiKey when apiKey prop changes
  useEffect(() => {
    if (apiKey) {
      setLocalApiKey(apiKey);
    }
  }, [apiKey]);

  // Initialize client when API key changes and auto-test connection
  useEffect(() => {
    if (localApiKey) {
      const newClient = new ProductBoardClient(localApiKey);
      setClient(newClient);
      
      // Automatically test connection and load initiatives if API key is provided
      const autoTestConnection = async () => {
        setIsTestingConnection(true);
        setConnectionStatus('untested');
        
        try {
          const success = await newClient.testConnection();
          
          if (success) {
            setConnectionStatus('success');
            toast.success('Successfully connected to ProductBoard API');
            
            // If connection is successful, fetch initiatives
            await fetchInitiatives(newClient);
          } else {
            setConnectionStatus('error');
          }
        } catch (error) {
          setConnectionStatus('error');
        } finally {
          setIsTestingConnection(false);
        }
      };
      
      autoTestConnection();
    } else {
      setClient(null);
    }
  }, [localApiKey]);

  // Open modal when a feature is selected
  useEffect(() => {
    if (selectedFeature) {
      setIsFeatureModalOpen(true);
    } else {
      setIsFeatureModalOpen(false);
    }
  }, [selectedFeature]);

  // Open modal when an initiative is selected
  useEffect(() => {
    if (selectedInitiative) {
      setIsInitiativeModalOpen(true);
    } else {
      setIsInitiativeModalOpen(false);
    }
  }, [selectedInitiative]);

  const testConnection = async () => {
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('untested');
    
    try {
      const success = await client.testConnection();
      
      if (success) {
        setConnectionStatus('success');
        toast.success('Successfully connected to ProductBoard API');
        
        // If connection is successful, fetch initiatives
        fetchInitiatives(client);
      } else {
        setConnectionStatus('error');
        toast.error('Failed to connect to ProductBoard API');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Failed to connect to ProductBoard API');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const fetchInitiatives = async (clientInstance?: ProductBoardClient) => {
    const activeClient = clientInstance || client;
    
    if (!activeClient) {
      toast.error('ProductBoard API key is required');
      return;
    }

    setIsLoading(true);
    setInitiatives([]);
    
    try {
      toast.info('Fetching initiatives from ProductBoard, this may take a moment...');
      
      // Get all initiatives
      const allInitiatives = await activeClient.getInitiatives({});
      
      // Add isExpanded and isLoading properties to each initiative
      const processedInitiatives = allInitiatives.map(initiative => ({
        ...initiative,
        isExpanded: false,
        isLoading: false,
        features: undefined
      }));
      
      setInitiatives(processedInitiatives);
      
      if (processedInitiatives.length === 0) {
        toast.info('No initiatives found in ProductBoard');
      } else {
        toast.success(`Successfully loaded ${processedInitiatives.length} initiatives`);
      }
    } catch (error) {
      toast.error('Failed to fetch initiatives from ProductBoard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInitiativeExpansion = async (initiativeId: string) => {
    // Find the initiative in the state
    const initiativeIndex = initiatives.findIndex(i => i.id === initiativeId);
    if (initiativeIndex === -1) return;
    
    const initiative = initiatives[initiativeIndex];
    
    // If the initiative is already expanded, just collapse it
    if (initiative.isExpanded) {
      const updatedInitiatives = [...initiatives];
      updatedInitiatives[initiativeIndex] = {
        ...initiative,
        isExpanded: false
      };
      setInitiatives(updatedInitiatives);
      return;
    }
    
    // If the initiative already has features loaded, just expand it
    if (initiative.features) {
      const updatedInitiatives = [...initiatives];
      updatedInitiatives[initiativeIndex] = {
        ...initiative,
        isExpanded: true
      };
      setInitiatives(updatedInitiatives);
      return;
    }
    
    // Otherwise, we need to load the features
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }
    
    // Set the initiative to loading state
    const loadingInitiatives = [...initiatives];
    loadingInitiatives[initiativeIndex] = {
      ...initiative,
      isLoading: true
    };
    setInitiatives(loadingInitiatives);
    
    try {
      // Fetch features for this initiative
      const features = await client.getFeaturesForInitiative(initiativeId);
      
      // Update the initiative with the features and expanded state
      const updatedInitiatives = [...initiatives];
      updatedInitiatives[initiativeIndex] = {
        ...initiative,
        features,
        isExpanded: true,
        isLoading: false
      };
      setInitiatives(updatedInitiatives);
      
      if (features.length === 0) {
        toast.info(`No features found for initiative "${initiative.name}"`);
      } else {
        toast.success(`Loaded ${features.length} features for initiative "${initiative.name}"`);
      }
    } catch (error) {
      toast.error(`Failed to load features for initiative "${initiative.name}"`);
      
      // Reset the loading state
      const resetInitiatives = [...initiatives];
      resetInitiatives[initiativeIndex] = {
        ...initiative,
        isLoading: false
      };
      setInitiatives(resetInitiatives);
    }
  };

  const getSortedAndFilteredInitiatives = () => {
    // First filter based on search text
    let filtered = initiatives;
    
    if (filterText) {
      const query = filterText.toLowerCase();
      filtered = initiatives.filter(initiative => 
        initiative.name?.toLowerCase().includes(query) ||
        initiative.id?.toLowerCase().includes(query) ||
        initiative.description?.toLowerCase().includes(query) ||
        (typeof initiative.status === 'string' && 
          initiative.status.toLowerCase().includes(query)) ||
        (typeof initiative.status === 'object' && 
          initiative.status?.name?.toLowerCase().includes(query))
      );
    }
    
    // Then sort
    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested properties
      if (sortField === 'status') {
        if (typeof a.status === 'object' && a.status?.name) {
          aValue = a.status.name;
        }
        if (typeof b.status === 'object' && b.status?.name) {
          bValue = b.status.name;
        }
      }
      
      // Handle null values
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Fallback for other types
      return sortDirection === 'asc'
        ? (aValue < bValue ? -1 : 1)
        : (bValue < aValue ? -1 : 1);
    });
  };

  // Handle sorting when a column header is clicked
  const handleSort = (field: keyof ProductBoardInitiative) => {
    if (sortField === field) {
      // Toggle sort direction if the same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredInitiatives = getSortedAndFilteredInitiatives();
  
  // Close feature modal and clear selected feature
  const closeFeatureModal = () => {
    setIsFeatureModalOpen(false);
    setSelectedFeature(null);
  };

  // Close initiative modal and clear selected initiative
  const closeInitiativeModal = () => {
    setIsInitiativeModalOpen(false);
    setSelectedInitiative(null);
  };

  // Handle feature click
  const handleFeatureClick = (feature: ProductBoardFeature) => {
    setSelectedFeature(feature);
  };

  // Handle initiative click
  const handleInitiativeClick = async (initiative: InitiativeWithFeatures) => {
    // If the initiative doesn't have features loaded yet, load them before showing the modal
    if (!initiative.features && client) {
      try {
        console.log(`Loading features for initiative ${initiative.id} before showing details`);
        const features = await client.getFeaturesForInitiative(initiative.id);
        console.log(`Loaded ${features.length} features for initiative ${initiative.id}`);
        
        // Create a new initiative object with the features
        const initiativeWithFeatures = {
          ...initiative,
          features
        };
        
        setSelectedInitiative(initiativeWithFeatures);
      } catch (error) {
        console.error(`Error loading features for initiative ${initiative.id}:`, error);
        // Even if features loading fails, still show the initiative details
        setSelectedInitiative(initiative);
      }
    } else {
      setSelectedInitiative(initiative);
    }
  };

  // Handle parent initiative click
  const handleParentInitiativeClick = (parentId: string, parentType: string) => {
    if (parentType === 'initiative') {
      const initiative = initiatives.find(i => i.id === parentId);
      if (initiative) {
        setSelectedInitiative(initiative);
      } else if (client) {
        // If the initiative is not in our current list, we need to fetch it
        client.getInitiativeById(parentId)
          .then(parentInitiative => {
            setSelectedInitiative({
              ...parentInitiative,
              isExpanded: false,
              isLoading: false
            });
          })
          .catch(error => {
            toast.error(`Failed to load parent initiative: ${error.message}`);
          });
      }
    }
  };

  const handleRefresh = async () => {
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }
    
    await testConnection();
  };

  if (!apiKey && !localApiKey) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">ProductBoard Initiative Explorer</h2>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">API Configuration</h3>
            
            <div className="flex items-end gap-2">
              <Input
                id="pb_api_key"
                type="password"
                label="ProductBoard API Key"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Enter your ProductBoard API key"
                className="flex-1"
              />
              
              <button
                onClick={testConnection}
                disabled={isTestingConnection || !localApiKey}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : connectionStatus === 'success' ? (
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                ) : connectionStatus === 'error' ? (
                  <XCircleIcon className="h-4 w-4 mr-1" />
                ) : null}
                {isTestingConnection ? 'Testing...' : 'Test & Load Initiatives'}
              </button>
            </div>
            
            {connectionStatus === 'success' && (
              <div className="text-sm text-green-600">
                ✓ Connected successfully to ProductBoard API
              </div>
            )}
            
            {connectionStatus === 'error' && (
              <div className="text-sm text-red-600">
                ✗ Failed to connect to ProductBoard API
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">ProductBoard Initiative Explorer</h2>
          {selectedFeature && (
            <div className="flex items-center text-sm text-indigo-600">
              <InformationCircleIcon className="h-4 w-4 mr-1" />
              Feature selected: {selectedFeature.name}
            </div>
          )}
          {selectedInitiative && !selectedFeature && (
            <div className="flex items-center text-sm text-indigo-600">
              <InformationCircleIcon className="h-4 w-4 mr-1" />
              Initiative selected: {selectedInitiative.name}
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          {/* API Key Section - Only show if no API key is provided */}
          {!apiKey && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">API Configuration</h3>
              
              <div className="flex items-end gap-2">
                <Input
                  id="pb_api_key"
                  type="password"
                  label="ProductBoard API Key"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="Enter your ProductBoard API key"
                  className="flex-1"
                />
                
                <button
                  onClick={testConnection}
                  disabled={isTestingConnection || !localApiKey}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isTestingConnection ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : connectionStatus === 'success' ? (
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                  ) : connectionStatus === 'error' ? (
                    <XCircleIcon className="h-4 w-4 mr-1" />
                  ) : null}
                  {isTestingConnection ? 'Testing...' : 'Test & Load Initiatives'}
                </button>
              </div>
              
              {connectionStatus === 'success' && (
                <div className="text-sm text-green-600">
                  ✓ Connected successfully to ProductBoard API
                </div>
              )}
              
              {connectionStatus === 'error' && (
                <div className="text-sm text-red-600">
                  ✗ Failed to connect to ProductBoard API
                </div>
              )}
            </div>
          )}
          
          {/* Initiatives List */}
          {connectionStatus === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">ProductBoard Initiatives</h3>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                    )}
                    Refresh
                  </button>
                </div>
              </div>
              
              {/* Search Component */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search initiatives..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Results Count */}
              <div className="text-sm text-gray-500">
                Showing {sortedAndFilteredInitiatives.length} of {initiatives.length} initiatives
                {filterText && ` (filtered by "${filterText}")`}
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-600">Loading initiatives...</span>
                </div>
              ) : initiatives.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="w-10 px-6 py-3"></th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center">
                              Name
                              {sortField === 'name' && (
                                <span className="ml-1">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('id')}
                          >
                            <div className="flex items-center">
                              ID
                              {sortField === 'id' && (
                                <span className="ml-1">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center">
                              Status
                              {sortField === 'status' && (
                                <span className="ml-1">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Features
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedAndFilteredInitiatives.map((initiative) => (
                          <React.Fragment key={initiative.id}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => toggleInitiativeExpansion(initiative.id)}
                                  className="text-gray-500 hover:text-indigo-600"
                                >
                                  {initiative.isLoading ? (
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <ChevronRightIcon 
                                      className={`h-5 w-5 transition-transform ${initiative.isExpanded ? 'transform rotate-90' : ''}`} 
                                    />
                                  )}
                                </button>
                              </td>
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
                                {initiative.features 
                                  ? `${initiative.features.length} features` 
                                  : 'Click to load'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleInitiativeClick(initiative)}
                                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                            
                            {/* Expanded features section */}
                            {initiative.isExpanded && initiative.features && (
                              <tr>
                                <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                  <div className="ml-5 border-l-2 border-indigo-200 pl-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                      Features for {initiative.name}
                                    </h4>
                                    
                                    {initiative.features.length === 0 ? (
                                      <p className="text-sm text-gray-500 italic">
                                        No features found for this initiative
                                      </p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                              </th>
                                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {initiative.features.map((feature: ProductBoardFeature) => (
                                              <tr 
                                                key={feature.id} 
                                                className="hover:bg-gray-100 cursor-pointer"
                                                onClick={() => handleFeatureClick(feature)}
                                              >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                  <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                  <div className="text-sm text-gray-500">{feature.id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    {feature.type || '-'}
                                                  </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {typeof feature.status === 'object' && feature.status !== null 
                                                      ? ((feature.status as any).name || 'Unknown') 
                                                      : (feature.status || 'Unknown')}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No initiatives found. Click "Test & Load Initiatives" to fetch data from ProductBoard.
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        isOpen={isFeatureModalOpen}
        onClose={closeFeatureModal}
        showRawJson={showRawJson}
        setShowRawJson={setShowRawJson}
        onProductClick={(productId) => setSelectedProductId(productId)}
        client={client}
      />

      {/* Initiative Detail Modal */}
      <InitiativeDetailModal
        initiative={selectedInitiative}
        isOpen={isInitiativeModalOpen}
        onClose={closeInitiativeModal}
        showRawJson={showRawJson}
        setShowRawJson={setShowRawJson}
        onParentClick={handleParentInitiativeClick}
        onFeatureClick={handleFeatureClick}
        client={client}
      />

      {/* Product View */}
      {selectedProductId && (
        <div className="mt-6">
          <ProductView 
            apiKey={localApiKey}
            productId={selectedProductId}
            onBack={() => setSelectedProductId(null)}
          />
        </div>
      )}
    </Card>
  );
}
