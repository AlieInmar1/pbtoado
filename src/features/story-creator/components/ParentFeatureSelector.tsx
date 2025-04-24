import React, { useState, useEffect } from 'react';
import { useFeatures } from '../../../hooks/useFeatures';
import { Feature } from '../../../lib/api/features';

interface ParentFeatureSelectorProps {
  selectedParentId?: string;
  componentId?: string;
  onChange: (featureId: string, featureName: string) => void;
  required?: boolean;
  className?: string;
}

/**
 * ParentFeatureSelector allows selecting a parent feature from ProductBoard
 * to establish a hierarchical relationship when creating stories.
 * 
 * It filters features based on the selected component and provides a
 * searchable dropdown interface for easy selection.
 */
export const ParentFeatureSelector: React.FC<ParentFeatureSelectorProps> = ({
  selectedParentId,
  componentId,
  onChange,
  required = false,
  className = ''
}) => {
  const { features, isLoading } = useFeatures();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  
  // Filter features based on component and search term
  useEffect(() => {
    let filtered = features;
    
    // Filter by component if provided
    // Since component relationship isn't directly in the Feature type,
    // we'll check if it's in the metadata (implementation may vary)
    if (componentId) {
      filtered = filtered.filter(feature => {
        // Check if component info is in metadata
        if (feature.metadata && feature.metadata.componentId) {
          return feature.metadata.componentId === componentId;
        }
        return true; // Include all if no component mapping exists
      });
    }
    
    // Filter by type - only include features, not sub-features or stories
    filtered = filtered.filter(feature => feature.type === 'feature');
    
    // Filter by search term
    if (searchTerm) {
      const lowercaseTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(feature =>
        feature.name.toLowerCase().includes(lowercaseTerm) ||
        feature.productboard_id.toLowerCase().includes(lowercaseTerm)
      );
    }
    
    setFilteredFeatures(filtered);
  }, [features, componentId, searchTerm]);
  
  // Get the selected feature name
  const getSelectedFeatureName = (): string => {
    if (!selectedParentId) return '';
    
    const feature = features.find(f => f.productboard_id === selectedParentId);
    return feature ? feature.name : '';
  };
  
  // Handle feature selection
  const handleSelectFeature = (feature: Feature) => {
    onChange(feature.productboard_id, feature.name);
    setShowDropdown(false);
    setSearchTerm('');
  };
  
  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Parent Feature {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="mt-1 relative">
        <button
          type="button"
          className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
        >
          <span className="block truncate">
            {getSelectedFeatureName() || 'Select a parent feature'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </button>
        
        {showDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            <div className="sticky top-0 z-10 bg-white p-2 border-b">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {isLoading ? (
              <div className="px-3 py-2 text-gray-500">Loading features...</div>
            ) : filteredFeatures.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">No features found</div>
            ) : (
              <ul className="max-h-40 overflow-y-auto" role="listbox">
                {filteredFeatures.map((feature) => (
                  <li
                    key={feature.productboard_id}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${
                      selectedParentId === feature.productboard_id ? 'bg-indigo-100' : ''
                    }`}
                    onClick={() => handleSelectFeature(feature)}
                    role="option"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{feature.name}</span>
                      <span className="text-xs text-gray-500">ID: {feature.productboard_id}</span>
                    </div>
                    
                    {selectedParentId === feature.productboard_id && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      
      <p className="mt-1 text-sm text-gray-500">
        Select a parent feature to create a hierarchical relationship
      </p>
    </div>
  );
};
