import React, { useState, useEffect, useCallback } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/shadcn/select';
import { Button } from '../ui/shadcn/button';
import { ChevronRight, X } from 'lucide-react';

// Types for hierarchy items
export type HierarchyItem = {
  id: string;
  name: string;
  type: 'product' | 'epic' | 'feature' | 'story';
  parentId?: string;
};

export type HierarchySelection = {
  productId?: string;
  epicId?: string;
  featureId?: string;
  storyId?: string;
};

export type HierarchySelectorProps = {
  items: HierarchyItem[];
  onSelectionChange: (selection: HierarchySelection) => void;
  initialSelection?: HierarchySelection;
  className?: string;
};

/**
 * HierarchySelector component provides cascading dropdowns for
 * filtering by product hierarchy (Product → Epic → Feature → Story).
 */
export const HierarchySelector: React.FC<HierarchySelectorProps> = ({
  items,
  onSelectionChange,
  initialSelection = {},
  className = '',
}) => {
  const [selection, setSelection] = useState<HierarchySelection>(initialSelection);

  // Apply selection when it changes
  useEffect(() => {
    onSelectionChange(selection);
  }, [selection, onSelectionChange]);

  // Filter items by type and parent
  const getFilteredItems = useCallback((type: 'product' | 'epic' | 'feature' | 'story', parentId?: string) => {
    return items.filter(item => {
      if (item.type !== type) return false;
      
      if (type === 'product') return true; // Products have no parent
      
      if (type === 'epic' && selection.productId) {
        return item.parentId === selection.productId;
      }
      
      if (type === 'feature' && selection.epicId) {
        return item.parentId === selection.epicId;
      }
      
      if (type === 'story' && selection.featureId) {
        return item.parentId === selection.featureId;
      }
      
      return false;
    });
  }, [items, selection]);

  // Handle selection change
  const handleSelectionChange = useCallback((level: keyof HierarchySelection, id?: string) => {
    setSelection(prev => {
      const newSelection: HierarchySelection = { ...prev };
      
      // Handle "All" options
      if (id === '_all_products' || id === '_all_epics' || 
          id === '_all_features' || id === '_all_stories') {
        id = undefined;
      }
      
      // Set the selected ID for this level
      newSelection[level] = id;
      
      // Clear child selections
      if (level === 'productId') {
        newSelection.epicId = undefined;
        newSelection.featureId = undefined;
        newSelection.storyId = undefined;
      } else if (level === 'epicId') {
        newSelection.featureId = undefined;
        newSelection.storyId = undefined;
      } else if (level === 'featureId') {
        newSelection.storyId = undefined;
      }
      
      return newSelection;
    });
  }, []);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelection({});
  }, []);

  // Get item by ID
  const getItemById = useCallback((id?: string) => {
    if (!id) return undefined;
    return items.find(item => item.id === id);
  }, [items]);

  // Get selected items for breadcrumb
  const selectedProduct = getItemById(selection.productId);
  const selectedEpic = getItemById(selection.epicId);
  const selectedFeature = getItemById(selection.featureId);
  const selectedStory = getItemById(selection.storyId);

  // Check if any selection is made
  const hasSelection = !!(selection.productId || selection.epicId || selection.featureId || selection.storyId);

  // Get filtered items for each level
  const products = getFilteredItems('product');
  const epics = getFilteredItems('epic');
  const features = getFilteredItems('feature');
  const stories = getFilteredItems('story');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selectors */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        {/* Product selector */}
        <Select
          value={selection.productId || ''}
          onValueChange={(value) => handleSelectionChange('productId', value || undefined)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_products">All Products</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Epic selector (only show if product is selected) */}
        {selection.productId && (
          <Select
            value={selection.epicId || ''}
            onValueChange={(value) => handleSelectionChange('epicId', value || undefined)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Epic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_epics">All Epics</SelectItem>
              {epics.map((epic) => (
                <SelectItem key={epic.id} value={epic.id}>
                  {epic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Feature selector (only show if epic is selected) */}
        {selection.epicId && (
          <Select
            value={selection.featureId || ''}
            onValueChange={(value) => handleSelectionChange('featureId', value || undefined)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Feature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_features">All Features</SelectItem>
              {features.map((feature) => (
                <SelectItem key={feature.id} value={feature.id}>
                  {feature.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Story selector (only show if feature is selected) */}
        {selection.featureId && (
          <Select
            value={selection.storyId || ''}
            onValueChange={(value) => handleSelectionChange('storyId', value || undefined)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Story" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_stories">All Stories</SelectItem>
              {stories.map((story) => (
                <SelectItem key={story.id} value={story.id}>
                  {story.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear all button */}
        {hasSelection && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAll}
            className="text-gray-500 hover:text-gray-700 h-10"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Breadcrumb trail */}
      {hasSelection && (
        <div className="flex items-center flex-wrap text-sm text-gray-600">
          {selectedProduct && (
            <div className="flex items-center">
              <span className="font-medium">{selectedProduct.name}</span>
              {selection.epicId && <ChevronRight className="h-4 w-4 mx-1" />}
            </div>
          )}
          
          {selectedEpic && (
            <div className="flex items-center">
              <span className="font-medium">{selectedEpic.name}</span>
              {selection.featureId && <ChevronRight className="h-4 w-4 mx-1" />}
            </div>
          )}
          
          {selectedFeature && (
            <div className="flex items-center">
              <span className="font-medium">{selectedFeature.name}</span>
              {selection.storyId && <ChevronRight className="h-4 w-4 mx-1" />}
            </div>
          )}
          
          {selectedStory && (
            <div className="flex items-center">
              <span className="font-medium">{selectedStory.name}</span>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAll}
            className="ml-2 p-0 h-5 w-5"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
