import React, { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/Card';
import { PageHeader } from '../components/admin/PageHeader';
import { ArrowPathIcon, CubeIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ProductBoardClient } from '../lib/api/productboard';
import { ProductSelector } from '../components/productboard/ProductSelector';
import { EnhancedProductHierarchyView } from '../components/productboard/EnhancedProductHierarchyView';
import type { Configuration } from '../types/database';
import type { ProductBoardFeature, ProductBoardProduct, ProductBoardComponent } from '../lib/api/productboard';

export function ProductBoard() {
  const { db } = useDatabase();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Partial<Configuration>>({});
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<ProductBoardFeature | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productHierarchy, setProductHierarchy] = useState<{
    product: ProductBoardProduct;
    components: Array<{
      component: ProductBoardComponent;
      features: Array<{
        feature: ProductBoardFeature;
        subfeatures: ProductBoardFeature[];
      }>;
    }>;
  } | null>(null);

  useEffect(() => {
    if (!db) return;
    // Use the same hardcoded workspace ID as in AdminPanel.tsx
    const workspaceId = '6f171cbd-8b15-4779-b4fc-4092649e70d1';
    
    async function loadConfig() {
      try {
        // Get configuration for the hardcoded workspace ID
        const config = await db?.configurations.getByWorkspace(workspaceId);
        
        // If the configuration doesn't have a productboard_api_key, try to get it from the workspace
        if (!config?.productboard_api_key) {
          const workspace = await db?.workspaces.getById(workspaceId);
          if (workspace?.pb_api_key) {
            setConfig({
              ...config,
              productboard_api_key: workspace.pb_api_key
            });
            return;
          }
        }
        
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
        
        // Load products but don't automatically load hierarchy
        // until a product is selected
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

  const loadProductHierarchy = async (apiKey: string, productId: string) => {
    console.log('loadProductHierarchy called with productId:', productId);
    
    if (!productId) {
      console.log('No productId provided, setting hierarchy to null');
      setProductHierarchy(null);
      return;
    }
    
    setLoadingHierarchy(true);
    try {
      console.log('Creating ProductBoardClient with apiKey:', apiKey.substring(0, 5) + '...');
      const client = new ProductBoardClient(apiKey);
      
      console.log('Calling getProductHierarchy with productId:', productId);
      const hierarchy = await client.getProductHierarchy(productId);
      
      console.log('Received hierarchy:', hierarchy);
      setProductHierarchy(hierarchy);
      
      // Count total features and subfeatures
      let totalFeatures = 0;
      hierarchy.components.forEach(({ features }) => {
        totalFeatures += features.length;
        features.forEach(({ subfeatures }) => {
          totalFeatures += subfeatures.length;
        });
      });
      
      toast.success(`Loaded product hierarchy with ${hierarchy.components.length} components and ${totalFeatures} features`);
    } catch (error) {
      console.error('Error loading ProductBoard hierarchy:', error);
      
      // Display a more user-friendly error message
      if (error instanceof Error && error.message.includes('Invalid ProductBoard API key')) {
        toast.error('Invalid ProductBoard API key. Please check your API key in the Admin Panel.');
      } else {
        toast.error('Failed to load ProductBoard hierarchy. Please try again later.');
      }
      
      setProductHierarchy(null);
    } finally {
      setLoadingHierarchy(false);
    }
  };

  const handleRefresh = async () => {
    if (!config.productboard_api_key) {
      toast.error('ProductBoard API key is required');
      return;
    }
    
    await testConnection();
    
    if (selectedProductId) {
      await loadProductHierarchy(config.productboard_api_key, selectedProductId);
    }
  };

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
          title="ProductBoard"
        />
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Explore ProductBoard data and configure sync settings</p>
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
        title="ProductBoard"
        buttonText="Refresh"
        buttonIcon={ArrowPathIcon}
        onButtonClick={handleRefresh}
      />
      
      <div className="flex justify-end space-x-4 mb-4">
        <a
          href="/admin/productboard/initiatives"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          View Initiatives
        </a>
        <a
          href="/admin/productboard/features"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Features
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
        <a
          href="/admin/productboard/rankings"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Story Rankings
        </a>
        <a
          href="/admin/productboard/ranking-settings"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Ranking Settings
        </a>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">Explore ProductBoard data and view available features</p>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Product Hierarchy</h3>
              <div className="flex items-center space-x-4">
                <div className="w-64">
                  <ProductSelector
                    apiKey={config.productboard_api_key || ''}
                    value={selectedProductId}
                    onChange={(productId) => {
                      setSelectedProductId(productId);
                      if (config.productboard_api_key) {
                        loadProductHierarchy(config.productboard_api_key, productId);
                      }
                    }}
                    label=""
                  />
                </div>
                {loadingHierarchy && (
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-indigo-600" />
                )}
              </div>
            </div>
            
            <EnhancedProductHierarchyView 
              hierarchy={productHierarchy}
              loading={loadingHierarchy}
              onSelectFeature={setSelectedFeature}
            />
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
                <strong>Note:</strong> Select a product to view its features.
                You can filter features by selecting a different product.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Details Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Feature Details: {selectedFeature.name}
              </h3>
              <button 
                onClick={() => setSelectedFeature(null)}
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
                        <p className="text-sm text-gray-900">{selectedFeature.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-sm text-gray-900">{selectedFeature.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <p className="text-sm text-gray-900">
                          {typeof selectedFeature.status === 'object' && selectedFeature.status !== null 
                            ? ((selectedFeature.status as any).name || 'Unknown') 
                            : (selectedFeature.status || 'Unknown')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created:</span>
                        <p className="text-sm text-gray-900">
                          {selectedFeature.created_at ? new Date(selectedFeature.created_at).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Updated:</span>
                        <p className="text-sm text-gray-900">
                          {selectedFeature.updated_at ? new Date(selectedFeature.updated_at).toLocaleString() : '-'}
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
                          {selectedFeature.parent 
                            ? `${selectedFeature.parent.name} (${selectedFeature.parent.id})` 
                            : 'None'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Product:</span>
                        <p className="text-sm text-gray-900">
                          {selectedFeature.product 
                            ? `${selectedFeature.product.name} (${selectedFeature.product.id})` 
                            : 'None'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Children:</span>
                        {selectedFeature.children && selectedFeature.children.length > 0 ? (
                          <ul className="text-sm text-gray-900 list-disc pl-5">
                            {selectedFeature.children.map(child => (
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
                      {selectedFeature.description || 'No description available.'}
                    </p>
                  </CardContent>
                </Card>

                {/* All Fields (Raw Data) */}
                <Card className="md:col-span-2 overflow-hidden">
                  <CardContent>
                    <h4 className="font-medium text-gray-900 mb-2">All Available Fields</h4>
                    <div className="bg-gray-50 p-4 rounded overflow-x-auto max-h-[300px]">
                      <pre className="text-xs text-gray-800">
                        {JSON.stringify(selectedFeature, null, 2)}
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
