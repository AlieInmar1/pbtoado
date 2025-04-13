import React from 'react';
import ProductBoardHierarchyManager from '../components/productboard/ProductBoardHierarchyManager';

const ProductBoardHierarchy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ProductBoard Hierarchy Management</h1>
      <p className="mb-4 text-gray-700">
        This tool allows you to sync and manage the hierarchical structure of your ProductBoard data,
        including products, components, initiatives, and features.
      </p>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <p className="text-gray-700 mb-3">
          ProductBoard's hierarchy consists of:
        </p>
        <ul className="list-disc list-inside ml-4 mb-4 text-gray-700">
          <li><span className="font-medium">Products</span> - The top level grouping in ProductBoard</li>
          <li><span className="font-medium">Components</span> - Sub-areas of products</li>
          <li><span className="font-medium">Initiatives</span> - Strategic projects or themes</li>
          <li><span className="font-medium">Features</span> - Specific capabilities or user stories</li>
        </ul>
        <p className="text-gray-700">
          This tool will synchronize this hierarchy with your local database, allowing you to reference
          ProductBoard structure in your workflows and integrations.
        </p>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              You'll need a valid ProductBoard API key to use this feature. The sync process may take a few minutes 
              depending on the size of your ProductBoard instance.
            </p>
          </div>
        </div>
      </div>
      
      <ProductBoardHierarchyManager />
    </div>
  );
};

export default ProductBoardHierarchy;
