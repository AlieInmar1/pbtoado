import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { ArrowPathIcon, MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { ProductBoardClient, ProductBoardFeature } from '../../lib/api/productboard';

interface HierarchyNode {
  id: string;
  name: string;
  type: 'product' | 'component' | 'feature' | 'subfeature';
  level?: 'epic' | 'feature' | 'story';
  status?: string;
  children?: HierarchyNode[];
  data?: any;
}

export function ProductBoardHierarchyTester({ apiKey }: { apiKey?: string }) {
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductBoardFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<ProductBoardFeature | null>(null);
  const [hierarchyTree, setHierarchyTree] = useState<HierarchyNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [client, setClient] = useState<ProductBoardClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Initialize client when API key changes
  useEffect(() => {
    if (localApiKey) {
      setClient(new ProductBoardClient(localApiKey));
    } else {
      setClient(null);
    }
  }, [localApiKey]);

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
      } else {
        setConnectionStatus('error');
        toast.error('Failed to connect to ProductBoard API');
      }
    } catch (error) {
      console.error('Error testing ProductBoard connection:', error);
      setConnectionStatus('error');
      toast.error('Failed to connect to ProductBoard API');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Extract ID from a string like "MT225162: Feature name"
  const extractFeatureId = (text: string): string | null => {
    // Match patterns like MT123456, PB123456, etc. at the beginning of the string
    const idMatch = text.match(/^([A-Z]{2}\d+)(?:\s*:|$)/);
    return idMatch ? idMatch[1] : null;
  };

  const searchFeatures = async () => {
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }

    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Check if the search term contains an ID pattern
      const featureId = extractFeatureId(searchTerm.trim());
      
      // If we found an ID pattern, try to search by that ID first
      if (featureId) {
        console.log(`Detected feature ID: ${featureId}, searching by ID first`);
        try {
          const feature = await client.getFeatureById(featureId);
          if (feature) {
            setSearchResults([feature]);
            setIsSearching(false);
            return;
          }
        } catch (error) {
          console.log(`Feature not found by ID ${featureId}, trying name search`);
        }
      } else {
        // If no ID pattern was found, try the full search term as an ID
        // (in case it's an ID in a different format)
        try {
          const feature = await client.getFeatureById(searchTerm.trim());
          if (feature) {
            setSearchResults([feature]);
            setIsSearching(false);
            return;
          }
        } catch (error) {
          console.log('Feature not found by ID, trying name search');
        }
      }
      
      // Instead of searching with parameters (which might cause 400 errors),
      // get all features and filter client-side
      console.log('Fetching all features and filtering client-side');
      toast.info('Searching all features, this may take a moment...');
      
      try {
        // Get all features without search parameters
        const allFeatures = await client.getFeatures({});
        console.log(`Retrieved ${allFeatures.length} features from ProductBoard`);
        
        // Filter features client-side based on search term
        const searchLower = searchTerm.trim().toLowerCase();
        const filteredFeatures = allFeatures.filter(feature => {
          // Match by ID
          if (feature.id.toLowerCase().includes(searchLower)) {
            return true;
          }
          
          // Match by name
          if (feature.name.toLowerCase().includes(searchLower)) {
            return true;
          }
          
          return false;
        });
        
        console.log(`Found ${filteredFeatures.length} matching features after client-side filtering`);
        setSearchResults(filteredFeatures);
        
        if (filteredFeatures.length === 0) {
          toast.info('No features found matching your search term');
        }
      } catch (error) {
        console.error('Error fetching all features:', error);
        toast.error('Failed to fetch features. Please try again or use a more specific ID.');
      }
    } catch (error) {
      console.error('Error searching features:', error);
      toast.error('Failed to search features');
    } finally {
      setIsSearching(false);
    }
  };

  const traceHierarchy = async (feature: ProductBoardFeature) => {
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }

    setIsTracing(true);
    setSelectedFeature(feature);
    setHierarchyTree(null);
    
    try {
      // Start building the hierarchy from the selected feature
      let currentFeature = feature;
      let hierarchyChain: ProductBoardFeature[] = [currentFeature];
      
      // Trace upward through parents
      while (currentFeature && currentFeature.parent) {
        try {
          // Use non-null assertion since we've already checked that parent exists
          const parentId = currentFeature.parent!.id;
          if (!parentId) break;
          
          const parentFeature = await client.getFeatureById(parentId);
          hierarchyChain.unshift(parentFeature);
          currentFeature = parentFeature;
        } catch (error) {
          console.error(`Error fetching parent feature ${currentFeature.parent?.id || 'unknown'}:`, error);
          break;
        }
      }
      
      // Get component and product information
      let componentInfo = null;
      let productInfo = null;
      
      if (feature.product) {
        try {
          productInfo = await client.getProductById(feature.product.id);
        } catch (error) {
          console.error(`Error fetching product ${feature.product.id}:`, error);
        }
      }
      
      // Build the hierarchy tree
      const tree: HierarchyNode = {
        id: 'root',
        name: 'Hierarchy',
        type: 'product',
        children: []
      };
      
      // Add product if available
      if (productInfo) {
        const productNode: HierarchyNode = {
          id: productInfo.id,
          name: productInfo.name,
          type: 'product',
          data: productInfo,
          children: []
        };
        tree.children = [productNode];
        
        // Add features as children of the product
        let currentNode = productNode;
        
        // Add each feature in the hierarchy chain
        for (let i = 0; i < hierarchyChain.length; i++) {
          const f = hierarchyChain[i];
          const level = i === 0 ? 'epic' : i === hierarchyChain.length - 1 ? 'story' : 'feature';
          
          const featureNode: HierarchyNode = {
            id: f.id,
            name: f.name,
            type: i === hierarchyChain.length - 1 ? 'subfeature' : 'feature',
            level,
            status: typeof f.status === 'object' ? (f.status as any).name : f.status,
            data: f,
            children: []
          };
          
          if (!currentNode.children) {
            currentNode.children = [];
          }
          
          currentNode.children.push(featureNode);
          currentNode = featureNode;
        }
      } else {
        // If no product info, just add the features directly
        let currentNode = tree;
        
        for (let i = 0; i < hierarchyChain.length; i++) {
          const f = hierarchyChain[i];
          const level = i === 0 ? 'epic' : i === hierarchyChain.length - 1 ? 'story' : 'feature';
          
          const featureNode: HierarchyNode = {
            id: f.id,
            name: f.name,
            type: i === hierarchyChain.length - 1 ? 'subfeature' : 'feature',
            level,
            status: typeof f.status === 'object' ? (f.status as any).name : f.status,
            data: f,
            children: []
          };
          
          if (!currentNode.children) {
            currentNode.children = [];
          }
          
          currentNode.children.push(featureNode);
          currentNode = featureNode;
        }
      }
      
      setHierarchyTree(tree);
      
      // Expand all nodes by default
      const expanded: Record<string, boolean> = {};
      const expandNode = (node: HierarchyNode) => {
        expanded[node.id] = true;
        if (node.children) {
          node.children.forEach(expandNode);
        }
      };
      expandNode(tree);
      setExpandedNodes(expanded);
      
      toast.success('Hierarchy traced successfully');
    } catch (error) {
      console.error('Error tracing hierarchy:', error);
      toast.error('Failed to trace hierarchy');
    } finally {
      setIsTracing(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const copyHierarchyToClipboard = () => {
    if (!hierarchyTree) return;
    
    const formatNode = (node: HierarchyNode, depth = 0): string => {
      const indent = '  '.repeat(depth);
      let result = `${indent}${node.name}`;
      
      if (node.level) {
        result += ` (${node.level})`;
      }
      
      if (node.status) {
        result += ` [${node.status}]`;
      }
      
      if (node.id !== 'root') {
        result += ` - ID: ${node.id}`;
      }
      
      result += '\n';
      
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          result += formatNode(child, depth + 1);
        });
      }
      
      return result;
    };
    
    const hierarchyText = formatNode(hierarchyTree);
    
    navigator.clipboard.writeText(hierarchyText)
      .then(() => toast.success('Hierarchy copied to clipboard'))
      .catch(() => toast.error('Failed to copy hierarchy to clipboard'));
  };

  const renderNode = (node: HierarchyNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    
    return (
      <div key={node.id} className="ml-4">
        <div 
          className={`flex items-center py-1 ${node.id === selectedFeature?.id ? 'bg-indigo-50 rounded' : ''}`}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          <div className="w-6">
            {hasChildren && (
              isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )
            )}
          </div>
          
          <div className="flex-1">
            <span className={`
              ${node.type === 'product' ? 'font-bold text-indigo-700' : ''}
              ${node.type === 'component' ? 'font-semibold text-indigo-600' : ''}
              ${node.type === 'feature' ? 'font-medium text-gray-800' : ''}
              ${node.type === 'subfeature' ? 'text-gray-700' : ''}
            `}>
              {node.name}
            </span>
            
            {node.level && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {node.level}
              </span>
            )}
            
            {node.status && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                {node.status}
              </span>
            )}
            
            <span className="ml-2 text-xs text-gray-500">
              {node.id !== 'root' && `ID: ${node.id}`}
            </span>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-gray-200 ml-3 pl-3">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">ProductBoard Hierarchy Tester</h2>
          
          {hierarchyTree && (
            <button
              onClick={copyHierarchyToClipboard}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              Copy Hierarchy
            </button>
          )}
        </div>
        
        <div className="space-y-6">
          {/* API Key Section */}
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
                ) : (
                  'Test Connection'
                )}
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
          
          {/* Search Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Search Features</h3>
            
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <Input
                  id="search_term"
                  label="Feature Name or ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter feature ID (e.g., MT225162) or feature name"
                  className="flex-1"
                />
                
                <button
                  onClick={searchFeatures}
                  disabled={isSearching || !localApiKey || !searchTerm.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSearching ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                      Search
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500">
                Tip: For best results, search by feature ID (e.g., MT225162). You can also paste a full feature title like "MT225162: Feature Name" and the ID will be automatically extracted.
              </p>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Search Results</h4>
                <div className="border rounded-md overflow-hidden">
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
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searchResults.map((feature) => (
                        <tr key={feature.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {feature.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {feature.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof feature.status === 'object' && feature.status !== null 
                              ? ((feature.status as any).name || 'Unknown') 
                              : (feature.status || 'Unknown')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => traceHierarchy(feature)}
                              disabled={isTracing}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Trace Hierarchy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* Hierarchy Display */}
          {isTracing ? (
            <div className="flex items-center justify-center h-64">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Tracing hierarchy...</span>
            </div>
          ) : hierarchyTree ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Feature Hierarchy</h3>
              
              <div className="border rounded-md p-4 bg-gray-50 overflow-auto max-h-[500px]">
                {renderNode(hierarchyTree)}
              </div>
              
              {selectedFeature && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Feature Details</h4>
                  <div className="border rounded-md p-4 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Name:</span>
                        <p className="text-sm text-gray-900">{selectedFeature.name}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">ID:</span>
                        <p className="text-sm text-gray-900">{selectedFeature.id}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Status:</span>
                        <p className="text-sm text-gray-900">
                          {typeof selectedFeature.status === 'object' && selectedFeature.status !== null 
                            ? ((selectedFeature.status as any).name || 'Unknown') 
                            : (selectedFeature.status || 'Unknown')}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Parent:</span>
                        <p className="text-sm text-gray-900">
                          {selectedFeature.parent 
                            ? `${selectedFeature.parent.name} (${selectedFeature.parent.id})` 
                            : 'None'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-medium text-gray-500">Description:</span>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {selectedFeature.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
