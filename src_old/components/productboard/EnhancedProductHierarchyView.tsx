import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, DocumentTextIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import type { 
  ProductBoardProduct, 
  ProductBoardComponent, 
  ProductBoardFeature 
} from '../../lib/api/productboard';

interface EnhancedProductHierarchyViewProps {
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

export function EnhancedProductHierarchyView({ 
  hierarchy, 
  loading, 
  onSelectFeature 
}: EnhancedProductHierarchyViewProps) {
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({});
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [showAllStories, setShowAllStories] = useState(true);

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

  const toggleShowAllStories = () => {
    setShowAllStories(prev => !prev);
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

  // Count features and stories
  let featureCount = 0;
  let storyCount = 0;
  
  hierarchy.components.forEach(({ features }) => {
    featureCount += features.length;
    features.forEach(({ subfeatures }) => {
      storyCount += subfeatures.length;
    });
  });

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-600">
          {featureCount} Features • {storyCount} Stories
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleShowAllStories}
            className={`px-3 py-1 text-xs rounded-full ${
              showAllStories 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showAllStories ? 'Showing All Stories' : 'Show Features Only'}
          </button>
        </div>
      </div>

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
                  className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded group"
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
                  <div className="ml-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100">
                    {features.length} feature{features.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Unified Feature + Story List */}
                {expandedComponents[component.id] && (
                  <div className="ml-6 mt-2 space-y-2">
                    {features.length === 0 ? (
                      <div className="text-sm text-gray-500">No features found</div>
                    ) : (
                      /* Iterate through each feature */
                      features.map(({ feature, subfeatures }) => (
                        <React.Fragment key={feature.id}>
                          {/* Feature Item */}
                          <div className="border-l-2 border-gray-200 pl-4">
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
                                <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-2" />
                              )}
                              <div className="font-medium text-gray-800">
                                {feature.name}
                                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                                  Feature
                                </span>
                                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                  {typeof feature.status === 'object' && feature.status !== null 
                                    ? ((feature.status as any).name || 'Unknown') 
                                    : (feature.status || 'Unknown')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stories related to this feature */}
                          {(expandedFeatures[feature.id] || showAllStories) && subfeatures.map(story => (
                            <div 
                              key={story.id} 
                              className="ml-6 pl-4 border-l-2 border-dashed border-indigo-100"
                            >
                              <div 
                                className={`flex p-2 rounded hover:bg-gray-50 ${
                                  onSelectFeature ? 'cursor-pointer' : ''
                                }`}
                                onClick={() => onSelectFeature && onSelectFeature(story)}
                              >
                                <DocumentDuplicateIcon className="h-4 w-4 text-indigo-400 mr-2 flex-shrink-0" />
                                <div className="text-sm">
                                  <div className="text-gray-700 flex items-baseline flex-wrap">
                                    <span>{story.name}</span>
                                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-600">
                                      Story
                                    </span>
                                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                      {typeof story.status === 'object' && story.status !== null 
                                        ? ((story.status as any).name || 'Unknown') 
                                        : (story.status || 'Unknown')}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Parent: {feature.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
