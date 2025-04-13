import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { supabase } from '../lib/supabase';
import { ProductBoardFeature } from '../types/productboard';
import { FeatureCardView } from '../components/productboard/FeatureCardView';
import { FeatureDetailModal } from '../components/productboard/FeatureDetailModal';
import { ViewToggle } from '../components/ui/ViewToggle';
import { SearchBar } from '../components/ui/SearchBar';
import { FilterChips, FilterOption } from '../components/ui/FilterChips';
import { Select } from '../components/ui/Select';
import { StoriesTable } from '../components/StoriesTable';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { FeaturesDashboard } from '../components/productboard/FeaturesDashboard';
import { ExpandableFeatureRow } from '../components/productboard/ExpandableFeatureRow';

export function ProductBoardFeatures() {
  const { currentWorkspace } = useWorkspace();
  const [features, setFeatures] = useState<ProductBoardFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);
  const [selectedFeatureTypes, setSelectedFeatureTypes] = useState<string[]>([]);
  const [detailFeature, setDetailFeature] = useState<ProductBoardFeature | null>(null);
  const [statusOptions, setStatusOptions] = useState<FilterOption[]>([]);
  const [featureTypeOptions, setFeatureTypeOptions] = useState<FilterOption[]>([]);
  
  // Fetch features and load filter options
  useEffect(() => {
    async function loadFeatures() {
      if (!currentWorkspace?.id) {
        setFeatures([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch features
        const { data, error } = await supabase
          .from('productboard_features')
          .select('*')
          .eq('workspace_id', currentWorkspace.id);

        if (error) throw error;
        
        setFeatures(data || []);
        
        // Extract unique statuses for filter options
        const statusSet = new Set<string>();
        const featureTypeSet = new Set<string>();
        
        data?.forEach(feature => {
          if (feature.status_name) statusSet.add(feature.status_name);
          if (feature.feature_type) featureTypeSet.add(feature.feature_type);
        });
        
        // Generate status filter options with appropriate colors
        const statusOpts: FilterOption[] = Array.from(statusSet).map(status => {
          let color = '';
          
          // Assign colors based on status name patterns
          if (status.toLowerCase().includes('progress')) {
            color = 'bg-amber-100 text-amber-800 border-amber-200';
          } else if (status.toLowerCase().includes('done') || status.toLowerCase().includes('complete')) {
            color = 'bg-green-100 text-green-800 border-green-200';
          } else if (status.toLowerCase().includes('backlog') || status.toLowerCase().includes('planned')) {
            color = 'bg-blue-100 text-blue-800 border-blue-200';
          } else if (status.toLowerCase().includes('cancel') || status.toLowerCase().includes('reject')) {
            color = 'bg-red-100 text-red-800 border-red-200';
          }
          
          return { id: status, label: status, color };
        });
        setStatusOptions(statusOpts);
        
        // Generate feature type filter options
        const typeOpts: FilterOption[] = Array.from(featureTypeSet).map(type => {
          let color = '';
          
          // Assign colors based on feature type
          if (type.toLowerCase().includes('epic')) {
            color = 'bg-purple-100 text-purple-800 border-purple-200';
          } else if (type.toLowerCase().includes('feature')) {
            color = 'bg-indigo-100 text-indigo-800 border-indigo-200';
          } else if (type.toLowerCase().includes('story')) {
            color = 'bg-blue-100 text-blue-800 border-blue-200';
          } else if (type.toLowerCase().includes('task')) {
            color = 'bg-green-100 text-green-800 border-green-200';
          }
          
          return { id: type, label: type, color };
        });
        setFeatureTypeOptions(typeOpts);
        
      } catch (error) {
        console.error('Error fetching features:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeatures();
  }, [currentWorkspace?.id]);

  // Filter features based on search query and filters
  const filteredFeatures = features.filter(feature => {
    // Apply search filter
    if (searchQuery && !feature.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (selectedStatusFilters.length > 0 && 
        !selectedStatusFilters.includes(feature.status_name || '')) {
      return false;
    }
    
    // Apply feature type filter
    if (selectedFeatureTypes.length > 0 && 
        !selectedFeatureTypes.includes(feature.feature_type || '')) {
      return false;
    }
    
    return true;
  });

  // Handle feature detail view
  const handleViewDetails = (feature: ProductBoardFeature) => {
    setDetailFeature(feature);
  };

  // Handle archive action
  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('productboard_features')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;

      // Update local state to reflect change
      setFeatures(prev => 
        prev.map(feature => 
          feature.id === id ? { ...feature, is_archived: true } : feature
        )
      );
    } catch (error) {
      console.error('Error archiving feature:', error);
    }
  };

  // Handle split action (placeholder)
  const handleSplit = (feature: ProductBoardFeature) => {
    // This would open a modal for splitting the feature
    console.log('Split feature:', feature.id);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('productboard_features')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id);

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error refreshing features:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
        <span className="ml-2 text-gray-600">Loading features...</span>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspace Selected</h3>
        <p className="text-gray-500">Please select a workspace to view features</p>
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Features Found</h3>
          <p className="text-gray-500">
            {(searchQuery || selectedStatusFilters.length > 0 || selectedFeatureTypes.length > 0) 
              ? 'Try adjusting your filters or clearing them to see more features'
              : 'There are no features available in this workspace'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <div className="p-4 bg-white border-b space-y-4">
          {/* Top row with controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SearchBar 
                placeholder="Search features..." 
                onSearch={setSearchQuery} 
                className="w-96"
              />
              <div className="h-6 w-px bg-gray-200" />
              <ViewToggle 
                activeView={viewMode} 
                onChange={setViewMode}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Second row with filters */}
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <Select
                value={''}
                onChange={(e) => console.log('Product filter:', e.target.value)}
                options={[
                  { value: '', label: 'All Products' },
                  { value: 'mobile', label: 'Mobile App' },
                  { value: 'web', label: 'Web Platform' },
                  { value: 'api', label: 'API Services' },
                ]}
                className="w-36"
              />
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <span className="text-sm text-gray-500 font-medium">Status:</span>
            <FilterChips
              options={statusOptions}
              selectedFilters={selectedStatusFilters}
              onChange={setSelectedStatusFilters}
            />
            <div className="h-6 w-px bg-gray-200" />
            <span className="text-sm text-gray-500 font-medium">Type:</span>
            <FilterChips
              options={featureTypeOptions}
              selectedFilters={selectedFeatureTypes}
              onChange={setSelectedFeatureTypes}
            />
          </div>
        </div>

        {/* Content based on view mode */}
        <FeaturesDashboard features={filteredFeatures} />
        
        {viewMode === 'table' ? (
          <div className="shadow-sm border-b border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeatures.map((feature, index) => (
                  <ExpandableFeatureRow
                    key={feature.id}
                    feature={feature}
                    index={index}
                    onViewDetails={handleViewDetails}
                    onArchive={handleArchive}
                    onSplit={handleSplit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <FeatureCardView 
            features={filteredFeatures}
            onViewDetails={handleViewDetails}
            onArchive={handleArchive}
            onSplit={handleSplit}
          />
        )}
      </div>

      {/* Feature detail modal */}
      {detailFeature && (
        <FeatureDetailModal 
          feature={detailFeature} 
          onClose={() => setDetailFeature(null)}
        />
      )}
    </div>
  );
}
