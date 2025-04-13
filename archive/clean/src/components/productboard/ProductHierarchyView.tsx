import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { 
  ProductBoardProduct, 
  ProductBoardComponent, 
  ProductBoardFeature 
} from '../../lib/api/productboard';

interface ProductHierarchyViewProps {
  hierarchy: {
    product: ProductBoardProduct;
    components: Array<{
      component: ProductBoardComponent;
      features: Array<{
        feature: ProductBoardFeature;
        subfeatures: ProductBoardFeature[];
      }>;
    }>;
  } | null;
  loading: boolean;
  onSelectFeature?: (feature: ProductBoardFeature) => void;
}

export function ProductHierarchyView({ 
  hierarchy, 
  loading, 
  onSelectFeature 
}: ProductHierarchyViewProps) {
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({});
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

  const toggleComponent = (componentId: string) => {
    setExpandedComponents(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  };

  const toggleFeature = (featureId: string) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Select a product to view its hierarchy</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[600px]">
      {/* Product Level */}
      <div className="mb-4">
        <div className="font-bold text-lg text-indigo-700 mb-2">
          {hierarchy.product.name}
        </div>
        <div className="text-sm text-gray-500 mb-4">
          {hierarchy.product.description || 'No description available'}
        </div>
      </div>

      {/* Components Level */}
      {hierarchy.components.length === 0 ? (
        <div className="text-sm text-gray-500 pl-4 mb-2">No components found</div>
      ) : (
        <div className="space-y-2">
          {hierarchy.components.map(({ component, features }) => (
            <div key={component.id} className="border-l-2 border-gray-200 pl-4">
              {/* Component Header */}
              <div 
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => toggleComponent(component.id)}
              >
                {features.length > 0 ? (
                  expandedComponents[component.id] ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                  )
                ) : (
                  <div className="w-6"></div> // Spacer for alignment
                )}
                <div className="font-semibold text-indigo-600">{component.name}</div>
              </div>

              {/* Features Level */}
              {expandedComponents[component.id] && (
                <div className="ml-6 mt-2 space-y-2">
                  {features.length === 0 ? (
                    <div className="text-sm text-gray-500">No features found</div>
                  ) : (
                    features.map(({ feature, subfeatures }) => (
                      <div key={feature.id} className="border-l-2 border-gray-200 pl-4">
                        {/* Feature Header */}
                        <div 
                          className={`flex items-center p-2 rounded ${
                            onSelectFeature ? 'cursor-pointer hover:bg-gray-50' : ''
                          }`}
                          onClick={() => {
                            if (subfeatures.length > 0) {
                              toggleFeature(feature.id);
                            }
                            if (onSelectFeature) {
                              onSelectFeature(feature);
                            }
                          }}
                        >
                          {subfeatures.length > 0 ? (
                            expandedFeatures[feature.id] ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                            )
                          ) : (
                            <div className="w-6"></div> // Spacer for alignment
                          )}
                          <div className="font-medium text-gray-800">
                            {feature.name}
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              {typeof feature.status === 'object' && feature.status !== null 
                                ? ((feature.status as any).name || 'Unknown') 
                                : (feature.status || 'Unknown')}
                            </span>
                          </div>
                        </div>

                        {/* Subfeatures Level */}
                        {expandedFeatures[feature.id] && (
                          <div className="ml-6 mt-2 space-y-2">
                            {subfeatures.length === 0 ? (
                              <div className="text-sm text-gray-500">No subfeatures found</div>
                            ) : (
                              subfeatures.map(subfeature => (
                                <div 
                                  key={subfeature.id} 
                                  className={`p-2 rounded ${
                                    onSelectFeature ? 'cursor-pointer hover:bg-gray-50' : ''
                                  }`}
                                  onClick={() => onSelectFeature && onSelectFeature(subfeature)}
                                >
                                  <div className="text-sm text-gray-700">
                                    {subfeature.name}
                                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                      {typeof subfeature.status === 'object' && subfeature.status !== null 
                                        ? ((subfeature.status as any).name || 'Unknown') 
                                        : (subfeature.status || 'Unknown')}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
