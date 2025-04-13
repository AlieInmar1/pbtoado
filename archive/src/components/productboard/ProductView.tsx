import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '../ui/Card';
import { ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ProductBoardClient, ProductBoardFeature, ProductBoardProduct, ProductBoardComponent } from '../../lib/api/productboard';
import { FeatureDetailModal } from './FeatureDetailModal';

interface ProductViewProps {
  apiKey: string;
  productId: string;
  onBack?: () => void;
}

export function ProductView({ apiKey, productId, onBack }: ProductViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductBoardProduct | null>(null);
  const [components, setComponents] = useState<Array<{
    component: ProductBoardComponent;
    features: ProductBoardFeature[];
    isExpanded: boolean;
  }>>([]);
  const [selectedFeature, setSelectedFeature] = useState<ProductBoardFeature | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [client, setClient] = useState<ProductBoardClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize client
  useEffect(() => {
    if (apiKey) {
      const newClient = new ProductBoardClient(apiKey);
      setClient(newClient);
    }
  }, [apiKey]);

  // Load product data
  useEffect(() => {
    if (!client || !productId) return;
    
    const loadProductData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load product details
        const productData = await client.getProductById(productId);
        setProduct(productData);
        
        // Load components for this product
        const componentsData = await client.getComponentsForProduct(productId);
        
        // Initialize components with empty features arrays
        const componentsWithFeatures = componentsData.map(component => ({
          component,
          features: [] as ProductBoardFeature[],
          isExpanded: false
        }));
        
        setComponents(componentsWithFeatures);
        
        // Load features for each component
        for (let i = 0; i < componentsWithFeatures.length; i++) {
          try {
            const features = await client.getFeaturesForComponent(componentsWithFeatures[i].component.id);
            
            setComponents(prev => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                features
              };
              return updated;
            });
          } catch (componentError) {
            console.error(`Error loading features for component ${componentsWithFeatures[i].component.id}:`, componentError);
          }
        }
        
        toast.success(`Loaded product "${productData.name}" with ${componentsData.length} components`);
      } catch (err) {
        console.error('Error loading product data:', err);
        setError('Failed to load product data. Please check your API key and try again.');
        toast.error('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProductData();
  }, [client, productId]);

  const toggleComponentExpansion = (index: number) => {
    setComponents(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isExpanded: !updated[index].isExpanded
      };
      return updated;
    });
  };

  const handleFeatureClick = (feature: ProductBoardFeature) => {
    setSelectedFeature(feature);
  };

  const handleProductClick = (productId: string) => {
    // This is already the product view, so we don't need to do anything
    toast.info('Already viewing this product');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Loading product data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">{error}</div>
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go Back
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No product data found</div>
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go Back
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Product: {product.name}
            </h2>
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Back to Initiatives
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {product.description || 'No description available'}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Product ID: {product.id}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Components and Features</h3>
          
          {components.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No components found for this product
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              {components.map((componentData, index) => (
                <div key={componentData.component.id} className="border-b last:border-b-0">
                  {/* Component Header */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleComponentExpansion(index)}
                  >
                    <div className="flex items-center">
                      <ChevronRightIcon 
                        className={`h-5 w-5 text-gray-500 mr-2 transition-transform ${
                          componentData.isExpanded ? 'transform rotate-90' : ''
                        }`} 
                      />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {componentData.component.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {componentData.features.length} features
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {componentData.component.id}
                    </div>
                  </div>
                  
                  {/* Features List */}
                  {componentData.isExpanded && (
                    <div className="bg-white">
                      {componentData.features.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 italic">
                          No features found for this component
                        </div>
                      ) : (
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
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {componentData.features.map(feature => (
                              <tr 
                                key={feature.id} 
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleFeatureClick(feature)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{feature.id}</div>
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
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        showRawJson={showRawJson}
        setShowRawJson={setShowRawJson}
        onProductClick={handleProductClick}
        client={client}
      />
    </Card>
  );
}
