import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { ProductBoardProductExplorer } from './ProductBoardProductExplorer';
import { ProductBoardInitiativeExplorer } from './ProductBoardInitiativeExplorer';

type ExplorerView = 'products' | 'initiatives';

interface ProductBoardHierarchyExplorerProps {
  apiKey?: string;
}

export function ProductBoardHierarchyExplorer({ apiKey }: ProductBoardHierarchyExplorerProps) {
  const [activeView, setActiveView] = useState<ExplorerView>('products');

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">ProductBoard Hierarchy Explorer</h2>
          <p className="text-sm text-gray-500 mt-1">
            Explore the ProductBoard hierarchy from different perspectives
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveView('products')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeView === 'products'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Products
            </button>
            <button
              onClick={() => setActiveView('initiatives')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeView === 'initiatives'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Initiatives
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeView === 'products' && (
            <ProductBoardProductExplorer apiKey={apiKey} />
          )}
          {activeView === 'initiatives' && (
            <ProductBoardInitiativeExplorer apiKey={apiKey} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
