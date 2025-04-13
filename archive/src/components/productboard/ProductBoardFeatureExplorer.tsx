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
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ProductBoardClient, ProductBoardFeature } from '../../lib/api/productboard';
import { FeatureDetailModal } from './FeatureDetailModal';

interface FeatureWithHierarchy extends ProductBoardFeature {
  parentType?: string;
  level?: 'epic' | 'feature' | 'story';
}

interface SearchCriteria {
  field: keyof FeatureWithHierarchy | 'all';
  value: string;
  matchType: 'contains' | 'exact';
}

export function ProductBoardFeatureExplorer({ apiKey }: { apiKey?: string }) {
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [isLoading, setIsLoading] = useState(false);
  const [features, setFeatures] = useState<FeatureWithHierarchy[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<FeatureWithHierarchy | null>(null);
  const [isLoadingParent, setIsLoadingParent] = useState(false);
  const [client, setClient] = useState<ProductBoardClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [sortField, setSortField] = useState<keyof FeatureWithHierarchy>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria[]>([
    { field: 'all', value: '', matchType: 'contains' }
  ]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      
      // Automatically test connection and load features if API key is provided
      const autoTestConnection = async () => {
        setIsTestingConnection(true);
        setConnectionStatus('untested');
        
        try {
          const success = await newClient.testConnection();
          
          if (success) {
            setConnectionStatus('success');
            toast.success('Successfully connected to ProductBoard API');
            
            // If connection is successful, fetch features
            await fetchFeatures(newClient);
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
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [selectedFeature]);

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
        
        // If connection is successful, fetch features
        fetchFeatures(client);
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

  const fetchFeatures = async (clientInstance?: ProductBoardClient) => {
    const activeClient = clientInstance || client;
    
    if (!activeClient) {
      toast.error('ProductBoard API key is required');
      return;
    }

    setIsLoading(true);
    setFeatures([]);
    
    try {
      toast.info('Fetching features from ProductBoard, this may take a moment...');
      
      // Get all features without search parameters
      let allFeatures = await activeClient.getFeatures({});
      
      // Check if the features data is nested inside a data property
      if (allFeatures.length > 0 && allFeatures[0].data && typeof allFeatures[0].data === 'object') {
        // Extract the data from the nested structure for each feature
        allFeatures = allFeatures.map(feature => {
          const { data, ...rest } = feature;
          return {
            ...data,
            // Preserve top-level properties if they don't exist in data
            ...Object.fromEntries(
              Object.entries(rest).filter(([key]) => data[key] === undefined)
            )
          };
        });
      }
      
      // Process features to determine hierarchy levels
      const processedFeatures = allFeatures.map(feature => {
        const featureWithHierarchy: FeatureWithHierarchy = { ...feature };
        
        // Determine level based on parent existence
        if (!feature.parent) {
          featureWithHierarchy.level = 'epic';
        } else {
          // If it has a parent, it's either a feature or a story
          featureWithHierarchy.level = 'feature'; // Default to feature
          
          // Determine parent type from the parent object structure
          if (feature.parent) {
            featureWithHierarchy.parentType = determineParentType(feature.parent);
          }
        }
        
        return featureWithHierarchy;
      });
      
      // Second pass to identify stories (features that are not parents to any other feature)
      const parentIds = new Set(
        processedFeatures
          .filter(f => f.parent)
          .map(f => f.parent!.id)
      );
      
      // Features that are not parents to any other feature are likely stories
      const finalFeatures = processedFeatures.map(feature => {
        if (feature.level === 'feature' && !parentIds.has(feature.id)) {
          feature.level = 'story';
        }
        return feature;
      });
      
      setFeatures(finalFeatures);
      
      if (finalFeatures.length === 0) {
        toast.info('No features found in ProductBoard');
      } else {
        toast.success(`Successfully loaded ${finalFeatures.length} features`);
      }
    } catch (error) {
      toast.error('Failed to fetch features from ProductBoard');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new search criteria
  const addSearchCriteria = () => {
    setSearchCriteria([
      ...searchCriteria,
      { field: 'all', value: '', matchType: 'contains' }
    ]);
  };

  // Remove a search criteria
  const removeSearchCriteria = (index: number) => {
    const newCriteria = [...searchCriteria];
    newCriteria.splice(index, 1);
    setSearchCriteria(newCriteria);
  };

  // Update a search criteria
  const updateSearchCriteria = (index: number, field: keyof SearchCriteria, value: any) => {
    const newCriteria = [...searchCriteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setSearchCriteria(newCriteria);
  };

  // Apply search criteria to filter features
  const applySearch = () => {
    // Save the search to history
    const searchText = searchCriteria.map(c => `${c.field}:${c.value}`).join(' ');
    if (searchText && !searchHistory.includes(searchText)) {
      setSearchHistory([...searchHistory, searchText]);
    }
    
    // Update the filter text to trigger re-filtering
    setFilterText(searchText);
  };

  // Clear all search criteria
  const clearSearch = () => {
    setSearchCriteria([{ field: 'all', value: '', matchType: 'contains' }]);
    setFilterText('');
  };

  const getSortedAndFilteredFeatures = () => {
    // First filter based on search criteria
    let filtered = features;
    
    if (filterText) {
      // Extract parent ID helper function
      const extractParentId = (parent: any): string => {
        if (!parent) return '';
        if (parent.feature) return parent.feature.id;
        if (parent.component) return parent.component.id;
        if (parent.initiative) return parent.initiative.id;
        return parent.id || '';
      };
      
      // Simple filtering for the basic search
      filtered = features.filter(feature => {
        const parentId = extractParentId(feature.parent);
        
        return feature.name.toLowerCase().includes(filterText.toLowerCase()) ||
          feature.id.toLowerCase().includes(filterText.toLowerCase()) ||
          (parentId && parentId.toLowerCase().includes(filterText.toLowerCase())) ||
          (feature.level && feature.level.toLowerCase().includes(filterText.toLowerCase())) ||
          (feature.description && feature.description.toLowerCase().includes(filterText.toLowerCase())) ||
          (feature.parentType && feature.parentType.toLowerCase().includes(filterText.toLowerCase()));
      });
    }
    
    // Then sort
    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested properties
      if (sortField === 'parent' && a.parent && b.parent) {
        // Extract parent ID from nested structure
        const extractParentId = (parent: any): string => {
          if (parent.feature) return parent.feature.id;
          if (parent.component) return parent.component.id;
          if (parent.initiative) return parent.initiative.id;
          return parent.id || '';
        };
        
        aValue = extractParentId(a.parent);
        bValue = extractParentId(b.parent);
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
  const handleSort = (field: keyof FeatureWithHierarchy) => {
    if (sortField === field) {
      // Toggle sort direction if the same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredFeatures = getSortedAndFilteredFeatures();
  
  // Close modal and clear selected feature
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeature(null);
  };

  // Handle parent click based on parent type
  const handleParentClick = async (parentId: string, parentType: string) => {
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }

    setIsLoadingParent(true);
    
    try {
      toast.info(`Loading parent ${parentType} ${parentId}...`);
      
      let parentEntity;
      let entityType = parentType.toLowerCase();
      
      // Use the appropriate API method based on parent type
      switch (entityType) {
        case 'feature':
          parentEntity = await client.getFeatureById(parentId);
          break;
        case 'component':
          parentEntity = await client.getComponentById(parentId);
          break;
        case 'initiative':
          parentEntity = await client.getInitiativeById(parentId);
          break;
        default:
          // Default to feature if type is unknown
          parentEntity = await client.getFeatureById(parentId);
          entityType = 'feature';
          break;
      }
      
      if (!parentEntity) {
        throw new Error(`Parent ${parentType} not found`);
      }
      
      // Check if the entity data is nested inside a data property
      if (parentEntity.data && typeof parentEntity.data === 'object') {
        // Extract the data from the nested structure
        const { data, ...rest } = parentEntity;
        parentEntity = {
          ...data,
          // Preserve top-level properties if they don't exist in data
          ...Object.fromEntries(
            Object.entries(rest).filter(([key]) => data[key] === undefined)
          )
        };
      }
      
      // Process the parent entity to add hierarchy information
      let processedEntity: FeatureWithHierarchy;
      
      if (entityType === 'feature') {
        // For features, we can use most of the original properties but ensure required fields
        processedEntity = {
          ...parentEntity,
          level: parentEntity.parent ? 'feature' : 'epic',
          parentType: parentEntity.parent ? determineParentType(parentEntity.parent) : undefined,
          // Ensure required fields are present
          status: parentEntity.status || 'Unknown',
          created_at: parentEntity.created_at || new Date().toISOString(),
          updated_at: parentEntity.updated_at || new Date().toISOString()
        } as FeatureWithHierarchy;
      } else {
        // For non-feature entities, create a feature-like structure
        // First extract only the properties we need to avoid duplicates
        const { id, name, description, ...otherProps } = parentEntity;
        
        // Create a feature-like object with all required fields
        processedEntity = {
          id,
          name,
          description: description || '',
          status: (parentEntity.status && typeof parentEntity.status === 'object' && (parentEntity.status as any).name) 
            ? (parentEntity.status as any).name 
            : (parentEntity.status || 'Unknown'),
          created_at: parentEntity.created_at || new Date().toISOString(),
          updated_at: parentEntity.updated_at || new Date().toISOString(),
          level: entityType as any,
          parentType: undefined,
          // Include other properties but avoid duplicates
          ...Object.entries(otherProps)
            .filter(([key]) => !['id', 'name', 'description', 'status', 'created_at', 'updated_at'].includes(key))
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
        } as FeatureWithHierarchy;
      }
      
      // Set the processed entity as the selected feature
      setSelectedFeature(processedEntity);
      
      toast.success(`Loaded parent ${parentType}: ${parentEntity.name}`);
    } catch (error) {
      console.error(`Error fetching parent ${parentType}:`, error);
      toast.error(`Failed to load parent ${parentType} ${parentId}`);
    } finally {
      setIsLoadingParent(false);
    }
  };
  
  // Helper function to determine parent type from parent object
  const determineParentType = (parent: any): string => {
    if (parent.feature) return 'feature';
    if (parent.component) return 'component';
    if (parent.initiative) return 'initiative';
    return 'unknown';
  };

  // Render the search component
  const renderSearchComponent = () => (
    <div className="mb-4 border rounded-md p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">Search Features</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            {showAdvancedSearch ? (
              <>
                <XMarkIcon className="h-3 w-3 mr-1" />
                Simple Search
              </>
            ) : (
              <>
                <AdjustmentsHorizontalIcon className="h-3 w-3 mr-1" />
                Advanced Search
              </>
            )}
          </button>
        </div>
      </div>
      
      {showAdvancedSearch ? (
        // Advanced search UI
        <div className="space-y-3">
          {searchCriteria.map((criteria, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={criteria.field}
                onChange={(e) => updateSearchCriteria(index, 'field', e.target.value)}
                options={[
                  { value: 'all', label: 'All Fields' },
                  { value: 'id', label: 'ID' },
                  { value: 'name', label: 'Name' },
                  { value: 'description', label: 'Description' },
                  { value: 'level', label: 'Level' },
                  { value: 'status', label: 'Status' },
                ]}
                className="w-1/4"
              />
              
              <Select
                value={criteria.matchType}
                onChange={(e) => updateSearchCriteria(index, 'matchType', e.target.value)}
                options={[
                  { value: 'contains', label: 'Contains' },
                  { value: 'exact', label: 'Exact Match' },
                ]}
                className="w-1/4"
              />
              
              <Input
                value={criteria.value}
                onChange={(e) => updateSearchCriteria(index, 'value', e.target.value)}
                placeholder="Search value..."
                className="flex-1"
              />
              
              {searchCriteria.length > 1 && (
                <button
                  onClick={() => removeSearchCriteria(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          
          <div className="flex justify-between">
            <Button
              onClick={addSearchCriteria}
              variant="secondary"
              className="text-xs"
            >
              Add Criteria
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={clearSearch}
                variant="secondary"
                className="text-xs"
              >
                Clear
              </Button>
              
              <Button
                onClick={applySearch}
                className="text-xs"
              >
                Search
              </Button>
            </div>
          </div>
          
          {searchHistory.length > 0 && (
            <div className="mt-2">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Recent Searches</h5>
              <div className="flex flex-wrap gap-1">
                {searchHistory.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setFilterText(search)}
                    className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Simple search UI
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search by name, ID, level, or description..."
              className="pl-10"
            />
          </div>
          
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">ProductBoard Feature Explorer</h2>
          {selectedFeature && (
            <div className="flex items-center text-sm text-indigo-600">
              <InformationCircleIcon className="h-4 w-4 mr-1" />
              Feature selected: {selectedFeature.name}
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
                  {isTestingConnection ? 'Testing...' : 'Test & Load Features'}
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
          
          {/* Features List */}
          {connectionStatus === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">ProductBoard Features</h3>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchFeatures()}
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
              {renderSearchComponent()}
              
              {/* Results Count */}
              <div className="text-sm text-gray-500">
                Showing {sortedAndFilteredFeatures.length} of {features.length} features
                {filterText && ` (filtered by "${filterText}")`}
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-600">Loading features...</span>
                </div>
              ) : features.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
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
                            onClick={() => handleSort('level')}
                          >
                            <div className="flex items-center">
                              Level
                              {sortField === 'level' && (
                                <span className="ml-1">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('type')}
                          >
                            <div className="flex items-center">
                              Type
                              {sortField === 'type' && (
                                <span className="ml-1">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('parentType')}
                          >
                            <div className="flex items-center">
                              Parent Type
                              {sortField === 'parentType' && (
                                <span className="ml-1">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
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
                            onClick={() => handleSort('parent')}
                          >
                            <div className="flex items-center">
                              Parent ID
                              {sortField === 'parent' && (
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedAndFilteredFeatures.map((feature) => (
                          <tr 
                            key={feature.id}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedFeature?.id === feature.id ? 'bg-indigo-50' : ''}`}
                            onClick={() => {
                              console.log('Feature clicked:', feature);
                              setSelectedFeature(feature);
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {feature.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${feature.level === 'epic' ? 'bg-purple-100 text-purple-800' : ''}
                                ${feature.level === 'feature' ? 'bg-blue-100 text-blue-800' : ''}
                                ${feature.level === 'story' ? 'bg-green-100 text-green-800' : ''}
                              `}>
                                {feature.level || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {feature.type || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {feature.parentType || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {feature.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(() => {
                                if (!feature.parent) return '-';
                                const parentObj = feature.parent as any;
                                if (parentObj.feature) return parentObj.feature.id;
                                if (parentObj.component) return parentObj.component.id;
                                if (parentObj.initiative) return parentObj.initiative.id;
                                return parentObj.id || '-';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {typeof feature.status === 'object' && feature.status !== null 
                                ? ((feature.status as any).name || 'Unknown') 
                                : (feature.status || 'Unknown')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No features found. Click "Test & Load Features" to fetch data from ProductBoard.
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        isOpen={isModalOpen}
        onClose={closeModal}
        showRawJson={showRawJson}
        setShowRawJson={setShowRawJson}
        onParentClick={handleParentClick}
        client={client}
      />
    </Card>
  );
}
