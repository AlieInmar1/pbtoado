import React, { useState } from 'react';
import { ProductBoardFeatureExplorer } from '../productboard/ProductBoardFeatureExplorer';
import { ProductBoardHierarchyTester } from './ProductBoardHierarchyTester';
import { ProductBoardHierarchyExplorer } from '../productboard/ProductBoardHierarchyExplorer';

interface ProductBoardToolsProps {
  apiKey: string;
}

export function ProductBoardTools({ apiKey }: ProductBoardToolsProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'hierarchy' | 'unified'>('features');

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-4 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'features'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('features')}
        >
          Feature Explorer
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'hierarchy'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('hierarchy')}
        >
          Hierarchy Tester
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'unified'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('unified')}
        >
          Unified Explorer
        </button>
      </div>
      
      {activeTab === 'features' && (
        <ProductBoardFeatureExplorer apiKey={apiKey} />
      )}
      
      {activeTab === 'hierarchy' && (
        <ProductBoardHierarchyTester apiKey={apiKey} />
      )}
      
      {activeTab === 'unified' && (
        <ProductBoardHierarchyExplorer apiKey={apiKey} />
      )}
    </div>
  );
}
