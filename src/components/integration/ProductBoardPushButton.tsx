import React, { useState } from 'react';
import { Story } from '../../types/story-creator';
import { ProductBoardPushOptions, ProductBoardPushResult } from '../../types/productboard';
import { pushStoryToProductBoard, pushAdoWorkItemToProductBoard } from '../../lib/api/productBoardService';
import { useProducts } from '../../hooks/useProducts';
import { useComponents } from '../../hooks/useComponents';

interface ProductBoardPushButtonProps {
  item: Story | any; // Using any for ADO WorkItem for now since we don't have a proper type defined
  onSuccess?: (result: ProductBoardPushResult) => void;
  onError?: (error: Error | string) => void;
  showStatus?: boolean;
  showOptions?: boolean;
  buttonText?: string;
  className?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * A reusable button component for pushing items to ProductBoard.
 * Can be used with both Story Creator stories and Azure DevOps work items.
 */
export const ProductBoardPushButton: React.FC<ProductBoardPushButtonProps> = ({
  item,
  onSuccess,
  onError,
  showStatus = true,
  showOptions = false,
  buttonText = 'Push to ProductBoard',
  className = '',
  buttonSize = 'md',
  variant = 'primary'
}) => {
  // Component state
  const [pushing, setPushing] = useState(false);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [result, setResult] = useState<ProductBoardPushResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Options state
  const [options, setOptions] = useState<ProductBoardPushOptions>({});
  
  // Get products and components for selection
  const { products, isLoading: productsLoading } = useProducts();
  const { components, isLoading: componentsLoading } = useComponents();
  
  // Handle push to ProductBoard
  const handlePush = async () => {
    setPushing(true);
    setResult(null);
    setError(null);
    
    try {
      let pushResult: ProductBoardPushResult;
      
      // Determine if it's a Story or ADO Work Item
      if ('title' in item && ('commitment_status' in item || 'description' in item)) {
        // It's a Story
        pushResult = await pushStoryToProductBoard(item as Story, options);
      } else if ('fields' in item && '_links' in item) {
        // It's an ADO Work Item
        pushResult = await pushAdoWorkItemToProductBoard(item, options);
      } else {
        throw new Error('Unsupported item type for ProductBoard push');
      }
      
      setResult(pushResult);
      
      if (pushResult.success) {
        onSuccess?.(pushResult);
      } else {
        setError(pushResult.message || 'Unknown error pushing to ProductBoard');
        onError?.(pushResult.message || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setPushing(false);
    }
  };
  
  // Toggle options panel
  const toggleOptions = () => {
    setShowOptionsPanel(!showOptionsPanel);
  };
  
  // Handle option change
  const handleOptionChange = (name: keyof ProductBoardPushOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Button size class mapping
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base'
  };
  
  // Button variant class mapping
  const variantClasses = {
    primary: 'border border-transparent shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'border border-transparent shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    outline: 'border border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500'
  };
  
  // Combine button classes
  const buttonClasses = `${sizeClasses[buttonSize]} ${variantClasses[variant]} font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`;
  
  return (
    <div className="pb-push-button">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handlePush}
          disabled={pushing}
          className={`${buttonClasses} relative ${
            pushing ? 'opacity-80' : ''
          }`}
        >
          {pushing && (
            <span className="absolute inset-0 flex items-center justify-center">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
          )}
          <span className={pushing ? 'opacity-0' : ''}>
            {buttonText}
          </span>
        </button>
        
        {showOptions && (
          <button
            type="button"
            onClick={toggleOptions}
            className="px-2 py-1 border border-gray-300 text-xs rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showOptionsPanel ? 'Hide Options' : 'Options'}
          </button>
        )}
      </div>
      
      {showOptionsPanel && (
        <div className="mt-3 p-4 border rounded-md bg-gray-50">
          <h4 className="text-sm font-medium mb-3">ProductBoard Options</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                value={options.productId || ''}
                onChange={(e) => handleOptionChange('productId', e.target.value)}
                disabled={productsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">None (Use default)</option>
                {products?.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Component</label>
              <select
                value={options.componentId || ''}
                onChange={(e) => handleOptionChange('componentId', e.target.value)}
                disabled={componentsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">None (Use default)</option>
                {components?.map(component => (
                  <option key={component.productboard_id} value={component.productboard_id}>
                    {component.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status Override</label>
              <select
                value={options.statusOverride || ''}
                onChange={(e) => handleOptionChange('statusOverride', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">None (Use default)</option>
                <option value="backlog">Backlog</option>
                <option value="discovery">Discovery</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="released">Released</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Parent Feature (ID)</label>
              <input
                type="text"
                value={options.parentId || ''}
                onChange={(e) => handleOptionChange('parentId', e.target.value)}
                placeholder="ProductBoard Feature ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Specify a parent feature ID to create a hierarchy
              </p>
            </div>
          </div>
        </div>
      )}
      
      {showStatus && result && (
        <div className="mt-3">
          {result.success ? (
            <div className="p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
              Successfully pushed to ProductBoard (ID: {result.productboardId})
            </div>
          ) : (
            <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {result.message || 'Error pushing to ProductBoard'}
            </div>
          )}
        </div>
      )}
      
      {showStatus && error && !result && (
        <div className="p-3 mt-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};
