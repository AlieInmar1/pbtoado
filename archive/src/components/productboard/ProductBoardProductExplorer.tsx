import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { ProductBoardClient, ProductBoardProduct, ProductBoardComponent, ProductBoardFeature } from '../../lib/api/productboard';
import { FeatureDetailModal } from './FeatureDetailModal';

interface ProductWithComponents extends ProductBoardProduct {
  isExpanded?: boolean;
  isLoading?: boolean;
  components?: ComponentWithFeatures[];
}

interface ComponentWithFeatures extends ProductBoardComponent {
  isExpanded?: boolean;
  isLoading?: boolean;
  features?: FeatureWithSubfeatures[];
}

interface FeatureWithSubfeatures extends ProductBoardFeature {
  isExpanded?: boolean;
  isLoading?: boolean;
  subfeatures?: ProductBoardFeature[];
}

export function ProductBoardProductExplorer({ apiKey }: { apiKey?: string }) {
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithComponents[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<ProductBoardFeature | null>(null);
  const [client, setClient] = useState<ProductBoardClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Breadcrumb navigation state
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{
    id: string;
    name: string;
    type: 'product' | 'component' | 'feature';
  }>>([]);

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
      
      // Automatically test connection and load products if API key is provided
      const autoTestConnection = async () => {
        setIsTestingConnection(true);
        setConnectionStatus('untested');
        
        try {
          const success = await newClient.testConnection();
          
          if (success) {
            setConnectionStatus('success');
            toast.success('Successfully connected to ProductBoard API');
            
            // If connection is successful, fetch products
            await fetchProducts(newClient);
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
        
        // If connection is successful, fetch products
        fetchProducts(client);
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

  const fetchProducts = async (clientInstance?: ProductBoardClient) => {
    const activeClient = clientInstance || client;
    
    if (!activeClient) {
      toast.error('ProductBoard API key is required');
      return;
    }

    setIsLoading(true);
    setProducts([]);
    
    try {
      toast.info('Fetching products from ProductBoard, this may take a moment...');
      
      // Get all products
      const allProducts = await activeClient.getProducts({});
      
      // Add isExpanded and isLoading properties to each product
      const processedProducts = allProducts.map(product => ({
        ...product,
        isExpanded: false,
        isLoading: false,
        components: undefined
      }));
      
      setProducts(processedProducts);
      
      if (processedProducts.length === 0) {
        toast.info('No products found in ProductBoard');
      } else {
        toast.success(`Successfully loaded ${processedProducts.length} products`);
      }
    } catch (error) {
      toast.error('Failed to fetch products from ProductBoard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductExpansion = async (productId: string) => {
    // Find the product in the state
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;
    
    const product = products[productIndex];
    
    // If the product is already expanded, just collapse it
    if (product.isExpanded) {
      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...product,
        isExpanded: false
      };
      setProducts(updatedProducts);
      return;
    }
    
    // If the product already has components loaded, just expand it
    if (product.components) {
      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...product,
        isExpanded: true
      };
      setProducts(updatedProducts);
      return;
    }
    
    // Otherwise, we need to load the components
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }
    
    // Set the product to loading state
    const loadingProducts = [...products];
    loadingProducts[productIndex] = {
      ...product,
      isLoading: true
    };
    setProducts(loadingProducts);
    
    try {
      console.log(`Fetching components for product ${productId}`);
      
      // Fetch components for this product - this now returns an empty array instead of throwing on error
      const components = await client.getComponentsForProduct(productId);
      
      console.log(`Received ${components.length} components for product ${productId}`);
      
      // Add isExpanded and isLoading properties to each component
      const processedComponents = components.map(component => ({
        ...component,
        isExpanded: false,
        isLoading: false,
        features: undefined
      }));
      
      // Update the product with the components and expanded state
      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...product,
        components: processedComponents,
        isExpanded: true,
        isLoading: false
      };
      setProducts(updatedProducts);
      
      if (components.length === 0) {
        toast.info(`No components found for product "${product.name}"`);
      } else {
        toast.success(`Loaded ${components.length} components for product "${product.name}"`);
      }
    } catch (error) {
      console.error(`Error loading components for product ${productId}:`, error);
      toast.error(`Failed to load components for product "${product.name}". Please check your API key and try again.`);
      
      // Reset the loading state and set empty components array to prevent future errors
      const resetProducts = [...products];
      resetProducts[productIndex] = {
        ...product,
        isLoading: false,
        components: [], // Set empty components array instead of undefined
        isExpanded: true // Still expand to show "No components found"
      };
      setProducts(resetProducts);
    }
  };

  const toggleComponentExpansion = async (productId: string, componentId: string) => {
    // Find the product in the state
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;
    
    const product = products[productIndex];
    if (!product.components) return;
    
    // Find the component in the product
    const componentIndex = product.components.findIndex(c => c.id === componentId);
    if (componentIndex === -1) return;
    
    const component = product.components[componentIndex];
    
    // If the component is already expanded, just collapse it
    if (component.isExpanded) {
      const updatedProducts = [...products];
      const updatedComponents = [...product.components];
      updatedComponents[componentIndex] = {
        ...component,
        isExpanded: false
      };
      updatedProducts[productIndex] = {
        ...product,
        components: updatedComponents
      };
      setProducts(updatedProducts);
      return;
    }
    
    // If the component already has features loaded, just expand it
    if (component.features) {
      const updatedProducts = [...products];
      const updatedComponents = [...product.components];
      updatedComponents[componentIndex] = {
        ...component,
        isExpanded: true
      };
      updatedProducts[productIndex] = {
        ...product,
        components: updatedComponents
      };
      setProducts(updatedProducts);
      return;
    }
    
    // Otherwise, we need to load the features
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }
    
    // Set the component to loading state
    const updatedProducts = [...products];
    const updatedComponents = [...product.components];
    updatedComponents[componentIndex] = {
      ...component,
      isLoading: true
    };
    updatedProducts[productIndex] = {
      ...product,
      components: updatedComponents
    };
    setProducts(updatedProducts);
    
    try {
      console.log(`Fetching features for component ${componentId}`);
      
      // Fetch features for this component
      const features = await client.getFeaturesForComponent(componentId);
      
      console.log(`Received ${features.length} features for component ${componentId}`);
      
      // Add isExpanded and isLoading properties to each feature
      const processedFeatures = features.map(feature => ({
        ...feature,
        isExpanded: false,
        isLoading: false,
        subfeatures: undefined
      }));
      
      // Update the component with the features and expanded state
      const newUpdatedProducts = [...products];
      const newUpdatedComponents = [...product.components];
      newUpdatedComponents[componentIndex] = {
        ...component,
        features: processedFeatures,
        isExpanded: true,
        isLoading: false
      };
      newUpdatedProducts[productIndex] = {
        ...product,
        components: newUpdatedComponents
      };
      setProducts(newUpdatedProducts);
      
      if (features.length === 0) {
        toast.info(`No features found for component "${component.name}"`);
      } else {
        toast.success(`Loaded ${features.length} features for component "${component.name}"`);
      }
    } catch (error) {
      console.error(`Error loading features for component ${componentId}:`, error);
      toast.error(`Failed to load features for component "${component.name}". Please check your API key and try again.`);
      
      // Reset the loading state and set empty features array to prevent future errors
      const resetProducts = [...products];
      const resetComponents = [...product.components];
      resetComponents[componentIndex] = {
        ...component,
        isLoading: false,
        features: [], // Set empty features array instead of undefined
        isExpanded: true // Still expand to show "No features found"
      };
      resetProducts[productIndex] = {
        ...product,
        components: resetComponents
      };
      setProducts(resetProducts);
    }
  };

  const toggleFeatureExpansion = async (productId: string, componentId: string, featureId: string) => {
    // Find the product in the state
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;
    
    const product = products[productIndex];
    if (!product.components) return;
    
    // Find the component in the product
    const componentIndex = product.components.findIndex(c => c.id === componentId);
    if (componentIndex === -1) return;
    
    const component = product.components[componentIndex];
    if (!component.features) return;
    
    // Find the feature in the component
    const featureIndex = component.features.findIndex(f => f.id === featureId);
    if (featureIndex === -1) return;
    
    const feature = component.features[featureIndex];
    
    // If the feature is already expanded, just collapse it
    if (feature.isExpanded) {
      const updatedProducts = [...products];
      const updatedComponents = [...product.components];
      const updatedFeatures = [...component.features];
      updatedFeatures[featureIndex] = {
        ...feature,
        isExpanded: false
      };
      updatedComponents[componentIndex] = {
        ...component,
        features: updatedFeatures
      };
      updatedProducts[productIndex] = {
        ...product,
        components: updatedComponents
      };
      setProducts(updatedProducts);
      return;
    }
    
    // If the feature already has subfeatures loaded, just expand it
    if (feature.subfeatures) {
      const updatedProducts = [...products];
      const updatedComponents = [...product.components];
      const updatedFeatures = [...component.features];
      updatedFeatures[featureIndex] = {
        ...feature,
        isExpanded: true
      };
      updatedComponents[componentIndex] = {
        ...component,
        features: updatedFeatures
      };
      updatedProducts[productIndex] = {
        ...product,
        components: updatedComponents
      };
      setProducts(updatedProducts);
      return;
    }
    
    // Otherwise, we need to load the subfeatures
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }
    
    // Set the feature to loading state
    const updatedProducts = [...products];
    const updatedComponents = [...product.components];
    const updatedFeatures = [...component.features];
    updatedFeatures[featureIndex] = {
      ...feature,
      isLoading: true
    };
    updatedComponents[componentIndex] = {
      ...component,
      features: updatedFeatures
    };
    updatedProducts[productIndex] = {
      ...product,
      components: updatedComponents
    };
    setProducts(updatedProducts);
    
    try {
      console.log(`Fetching subfeatures for feature ${featureId}`);
      
      // Fetch subfeatures for this feature
      const subfeatures = await client.getSubfeaturesForFeature(featureId);
      
      console.log(`Received ${subfeatures.length} subfeatures for feature ${featureId}`);
      
      // Update the feature with the subfeatures and expanded state
      const newUpdatedProducts = [...products];
      const newUpdatedComponents = [...product.components];
      const newUpdatedFeatures = [...component.features];
      newUpdatedFeatures[featureIndex] = {
        ...feature,
        subfeatures,
        isExpanded: true,
        isLoading: false
      };
      newUpdatedComponents[componentIndex] = {
        ...component,
        features: newUpdatedFeatures
      };
      newUpdatedProducts[productIndex] = {
        ...product,
        components: newUpdatedComponents
      };
      setProducts(newUpdatedProducts);
      
      if (subfeatures.length === 0) {
        toast.info(`No subfeatures found for feature "${feature.name}"`);
      } else {
        toast.success(`Loaded ${subfeatures.length} subfeatures for feature "${feature.name}"`);
      }
    } catch (error) {
      console.error(`Error loading subfeatures for feature ${featureId}:`, error);
      toast.error(`Failed to load subfeatures for feature "${feature.name}". Please check your API key and try again.`);
      
      // Reset the loading state and set empty subfeatures array to prevent future errors
      const resetProducts = [...products];
      const resetComponents = [...product.components];
      const resetFeatures = [...component.features];
      resetFeatures[featureIndex] = {
        ...feature,
        isLoading: false,
        subfeatures: [], // Set empty subfeatures array instead of undefined
        isExpanded: true // Still expand to show "No subfeatures found"
      };
      resetComponents[componentIndex] = {
        ...component,
        features: resetFeatures
      };
      resetProducts[productIndex] = {
        ...product,
        components: resetComponents
      };
      setProducts(resetProducts);
    }
  };

  const getFilteredProducts = () => {
    if (!filterText) return products;
    
    const query = filterText.toLowerCase();
    return products.filter(product => 
      product.name?.toLowerCase().includes(query) ||
      product.id?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  };

  // Handle feature click to show details
  const handleFeatureClick = (feature: ProductBoardFeature) => {
    setSelectedFeature(feature);
  };

  // Handle parent click in feature detail modal
  const handleParentClick = (parentId: string, parentType: string) => {
    // Close the modal
    setSelectedFeature(null);
    
    // TODO: Navigate to the parent based on type
    toast.info(`Navigating to ${parentType} ${parentId} is not implemented yet`);
  };

  // Handle product click in feature detail modal
  const handleProductClick = (productId: string) => {
    // Close the modal
    setSelectedFeature(null);
    
    // Find the product
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error(`Product ${productId} not found`);
      return;
    }
    
    // Expand the product if it's not already expanded
    if (!product.isExpanded) {
      toggleProductExpansion(productId);
    }
    
    // Scroll to the product
    const productElement = document.getElementById(`product-${productId}`);
    if (productElement) {
      productElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRefresh = async () => {
    if (!client) {
      toast.error('ProductBoard API key is required');
      return;
    }
    
    await fetchProducts(client);
  };

  // Close modal and clear selected feature
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeature(null);
  };

  const filteredProducts = getFilteredProducts();

  if (!apiKey && !localApiKey) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">ProductBoard Product Explorer</h2>
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
                {isTestingConnection ? 'Testing...' : 'Test & Load Products'}
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
          <h2 className="text-lg font-medium text-gray-900">ProductBoard Product Explorer</h2>
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
                  {isTestingConnection ? 'Testing...' : 'Test & Load Products'}
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
          
          {/* Products List */}
          {connectionStatus === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">ProductBoard Products</h3>
                
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
                    placeholder="Search products..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Results Count */}
              <div className="text-sm text-gray-500">
                Showing {filteredProducts.length} of {products.length} products
                {filterText && ` (filtered by "${filterText}")`}
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-600">Loading products...</span>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id} 
                      id={`product-${product.id}`}
                      className="border rounded-md overflow-hidden"
                    >
                      {/* Product Header */}
                      <div 
                        className="flex items-center justify-between p-4 bg-indigo-50 cursor-pointer hover:bg-indigo-100"
                        onClick={() => toggleProductExpansion(product.id)}
                      >
                        <div className="flex items-center">
                          {product.isLoading ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
                          ) : (
                            <ChevronRightIcon 
                              className={`h-5 w-5 text-indigo-600 mr-2 transition-transform ${
                                product.isExpanded ? 'transform rotate-90' : ''
                              }`} 
                            />
                          )}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {product.components 
                                ? `${product.components.length} components` 
                                : 'Click to load components'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {product.id}
                        </div>
                      </div>
                      
                      {/* Components List */}
                      {product.isExpanded && product.components && (
                        <div className="bg-white">
                          {product.components.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 italic">
                              No components found for this product
                            </div>
                          ) : (
                            <div className="pl-8">
                              {product.components.map((component) => (
                                <div key={component.id} className="border-t">
                                  {/* Component Header */}
                                  <div 
                                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                    onClick={() => toggleComponentExpansion(product.id, component.id)}
                                  >
                                    <div className="flex items-center">
                                      {component.isLoading ? (
                                        <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-600 mr-2" />
                                      ) : (
                                        <ChevronRightIcon 
                                          className={`h-5 w-5 text-gray-600 mr-2 transition-transform ${
                                            component.isExpanded ? 'transform rotate-90' : ''
                                          }`} 
                                        />
                                      )}
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-900">
                                          {component.name}
                                        </h5>
                                        <p className="text-xs text-gray-500">
                                          {component.features 
                                            ? `${component.features.length} features` 
                                            : 'Click to load features'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ID: {component.id}
                                    </div>
                                  </div>
                                  
                                  {/* Features List */}
                                  {component.isExpanded && component.features && (
                                    <div className="bg-white">
                                      {component.features.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500 italic">
                                          No features found for this component
                                        </div>
                                      ) : (
                                        <div className="pl-8">
                                          {component.features.map((feature) => (
                                            <div key={feature.id} className="border-t">
                                              {/* Feature Header */}
                                              <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
                                                <div className="flex items-center">
                                                  <div 
                                                    className="mr-2 cursor-pointer"
                                                    onClick={() => toggleFeatureExpansion(product.id, component.id, feature.id)}
                                                  >
                                                    {feature.isLoading ? (
                                                      <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-400" />
                                                    ) : (
                                                      <ChevronRightIcon 
                                                        className={`h-5 w-5 text-gray-400 transition-transform ${
                                                          feature.isExpanded ? 'transform rotate-90' : ''
                                                        }`} 
                                                      />
                                                    )}
                                                  </div>
                                                  <div 
                                                    className="cursor-pointer"
                                                    onClick={() => handleFeatureClick(feature)}
                                                  >
                                                    <h6 className="text-sm font-medium text-gray-900">
                                                      {feature.name}
                                                    </h6>
                                                    <p className="text-xs text-gray-500">
                                                      {typeof feature.status === 'object' && feature.status !== null 
                                                        ? ((feature.status as any).name || 'Unknown') 
                                                        : (feature.status || 'Unknown')}
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  ID: {feature.id}
                                                </div>
                                              </div>
                                              
                                              {/* Subfeatures List */}
                                              {feature.isExpanded && feature.subfeatures && (
                                                <div className="bg-white">
                                                  {feature.subfeatures.length === 0 ? (
                                                    <div className="p-4 text-sm text-gray-500 italic pl-8">
                                                      No subfeatures found for this feature
                                                    </div>
                                                  ) : (
                                                    <div className="pl-8">
                                                      {feature.subfeatures.map((subfeature) => (
                                                        <div key={subfeature.id} className="border-t">
                                                          <div 
                                                            className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer"
                                                            onClick={() => handleFeatureClick(subfeature)}
                                                          >
                                                            <div>
                                                              <h6 className="text-sm font-medium text-gray-900">
                                                                {subfeature.name}
                                                              </h6>
                                                              <p className="text-xs text-gray-500">
                                                                {typeof subfeature.status === 'object' && subfeature.status !== null 
                                                                  ? ((subfeature.status as any).name || 'Unknown') 
                                                                  : (subfeature.status || 'Unknown')}
                                                              </p>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                              ID: {subfeature.id}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No products found. Click "Test & Load Products" to fetch data from ProductBoard.
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
        onProductClick={handleProductClick}
        client={client}
      />
    </Card>
  );
}
