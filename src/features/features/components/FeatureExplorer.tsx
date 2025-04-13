import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '../../../components/ui/shadcn/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/shadcn/dialog';
import { EnhancedTable, ColumnDef } from '../../../components/data-display/EnhancedTable';
import { FilterBar, FilterConfig, FilterValues } from '../../../components/data-display/FilterBar';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { HierarchySelector, HierarchyItem, HierarchySelection } from '../../../components/data-display/HierarchySelector';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useFeatures } from '../../../hooks/useFeatures';
import { Feature as ApiFeature } from '../../../lib/api/features';
import ReactMarkdown from 'react-markdown';

// UI Feature type (extends the API Feature type with UI-specific fields)
interface Feature extends Omit<ApiFeature, 'metadata'> {
  priority: 'low' | 'medium' | 'high' | 'critical';
  parentType?: 'component' | 'feature';
  adoId?: string;
  lastSyncedAt?: string;
  product?: string;
  epic?: string;
  parentId?: string; // For backward compatibility with the UI
  // Add any other UI-specific fields
}

// Function to transform API features to UI features
const transformApiFeaturesToUiFeatures = (apiFeatures: ApiFeature[]): Feature[] => {
  return apiFeatures.map(apiFeature => {
    // Extract metadata from the API feature
    const metadata = typeof apiFeature.metadata === 'string' 
      ? JSON.parse(apiFeature.metadata) 
      : apiFeature.metadata || {};
    
    // Map API feature to UI feature
    // Determine the type based on feature_type field
    const featureType = apiFeature.feature_type === 'subfeature' ? 'sub-feature' : 'feature';
    
    return {
      id: apiFeature.id,
      productboard_id: apiFeature.productboard_id,
      name: apiFeature.name,
      description: apiFeature.description || '',
      status: apiFeature.status as any || 'planned',
      type: featureType, // Use the mapped feature type
      parent_id: apiFeature.parent_id,
      parentId: apiFeature.parent_id, // For backward compatibility with the UI
      priority: metadata.priority || 'medium',
      parentType: metadata.parentType || 'feature',
      adoId: metadata.adoId,
      lastSyncedAt: metadata.lastSyncedAt,
      product: metadata.product || 'Unknown',
      epic: metadata.epic || 'Unknown',
      workspace_id: apiFeature.workspace_id
    };
  });
};

// Mock hierarchy data
const MOCK_HIERARCHY_ITEMS: HierarchyItem[] = [
  { id: 'p1', name: 'Platform', type: 'product' },
  { id: 'p2', name: 'Web App', type: 'product' },
  { id: 'e1', name: 'Security', type: 'epic', parentId: 'p1' },
  { id: 'e2', name: 'Integration', type: 'epic', parentId: 'p1' },
  { id: 'e3', name: 'UI/UX', type: 'epic', parentId: 'p2' },
  { id: 'f1', name: 'User Authentication', type: 'feature', parentId: 'e1' },
  { id: 'f2', name: 'Feature Sync Engine', type: 'feature', parentId: 'e2' },
  { id: 'f3', name: 'Interactive Dashboard', type: 'feature', parentId: 'e3' },
  { id: 'f4', name: 'Custom Fields Mapping', type: 'feature', parentId: 'e2' },
  { id: 'f5', name: 'Bulk Actions', type: 'feature', parentId: 'e3' },
];

// Filter configurations
const FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'type',
    type: 'select',
    label: 'Type',
    options: [
      { label: 'All', value: 'all' },
      { label: 'Features', value: 'feature' },
      { label: 'Stories', value: 'sub-feature' },
    ]
  },
  {
    id: 'status',
    type: 'select',
    label: 'Status',
    options: [
      { label: 'Planned', value: 'planned' },
      { label: 'In Progress', value: 'in-progress' },
      { label: 'Completed', value: 'completed' },
      { label: 'Backlog', value: 'backlog' },
    ]
  },
  {
    id: 'priority',
    type: 'select',
    label: 'Priority',
    options: [
      { label: 'Critical', value: 'critical' },
      { label: 'High', value: 'high' },
      { label: 'Medium', value: 'medium' },
      { label: 'Low', value: 'low' },
    ]
  },
  {
    id: 'sync',
    type: 'select',
    label: 'Sync Status',
    options: [
      { label: 'Synced', value: 'synced' },
      { label: 'Unsynced', value: 'unsynced' },
    ]
  }
];

/**
 * FeatureExplorer component displaying ProductBoard features with filtering and details
 */
export const FeatureExplorer: React.FC = () => {
  // Use the features hook to fetch data
  const { features: apiFeatures, isLoading: isLoadingFeatures, sync, isSyncing: isSyncingFeatures } = useFeatures();
  
  // Transform API features to UI features
  const features = useMemo(() => {
    // Log the raw API features to see what we're working with
    console.log('Raw API features:', apiFeatures);
    
    const transformedFeatures = transformApiFeaturesToUiFeatures(apiFeatures);
    
    // Log the transformed features to see if the mapping is correct
    console.log('Transformed features:', transformedFeatures);
    
    return transformedFeatures;
  }, [apiFeatures]);
  
  // Selected feature for details
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Filter state
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  // Hierarchy selection state
  const [hierarchySelection, setHierarchySelection] = useState<HierarchySelection>({});
  
  // Dialog open state
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  // Update loading state when features are loading
  useEffect(() => {
    setIsLoading(isLoadingFeatures);
  }, [isLoadingFeatures]);
  
  // Update syncing state when features are syncing
  useEffect(() => {
    setIsSyncing(isSyncingFeatures);
  }, [isSyncingFeatures]);
  
  // Handle filter change
  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
  }, []);
  
  // Handle hierarchy selection change
  const handleHierarchyChange = useCallback((selection: HierarchySelection) => {
    setHierarchySelection(selection);
  }, []);
  
  // Filter features based on filters and hierarchy selection
  const filteredFeatures = useMemo(() => {
    // First pass: filter features based on criteria
    const filteredBySearchAndFilters = features.filter((feature: Feature) => {
      // Type filter
      if (filterValues.type && filterValues.type !== 'all' && feature.type !== filterValues.type) {
        return false;
      }
      
      // Text search filter
      if (filterValues.search && !feature.name.toLowerCase().includes((filterValues.search as string).toLowerCase()) && 
          !(feature.description || '').toLowerCase().includes((filterValues.search as string).toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filterValues.status && feature.status !== filterValues.status) {
        return false;
      }
      
      // Priority filter
      if (filterValues.priority && feature.priority !== filterValues.priority) {
        return false;
      }
      
      // Sync status filter
      if (filterValues.sync === 'synced' && !feature.adoId) {
        return false;
      }
      if (filterValues.sync === 'unsynced' && feature.adoId) {
        return false;
      }
      
      // Hierarchy filters
      if (hierarchySelection.productId && feature.product !== 
          MOCK_HIERARCHY_ITEMS.find(item => item.id === hierarchySelection.productId)?.name) {
        return false;
      }
      
      if (hierarchySelection.epicId && feature.epic !== 
          MOCK_HIERARCHY_ITEMS.find(item => item.id === hierarchySelection.epicId)?.name) {
        return false;
      }
      
      return true;
    });
    
    // Second pass: ensure sub-features are only shown if their parent feature is shown
    return filteredBySearchAndFilters.filter(feature => {
      // If it's a sub-feature, check if its parent is in the filtered list
      if (feature.type === 'sub-feature' && feature.parentId) {
        const parentFeature = filteredBySearchAndFilters.find(f => f.id === feature.parentId);
        return !!parentFeature;
      }
      
      // Regular features are always shown if they passed the first filter
      return true;
    });
  }, [filterValues, hierarchySelection]);
  
  // Define table columns
  const columns = useMemo<ColumnDef<Feature>[]>(() => [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      enableSorting: true,
      cell: ({ row }) => {
        const feature = row as unknown as Feature;
        const isSubFeature = feature.type === 'sub-feature';
        
        return (
          <div className={`flex items-center ${isSubFeature ? 'pl-6' : ''}`}>
            {isSubFeature && (
              <div className="mr-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Story
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium">{feature.name}</span>
              {feature.productboard_id && (
                <span className="text-xs text-gray-500">#{feature.productboard_id}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.status as 'planned' | 'in-progress' | 'completed' | 'backlog';
        const statusType = status === 'in-progress' ? 'active' : status;
        return <StatusBadge type={statusType as any} variant="status" />;
      }
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      enableSorting: true,
      cell: ({ row }) => {
        const priority = row.priority;
        return <StatusBadge type={priority} variant="priority" />;
      }
    },
    {
      id: 'product',
      header: 'Product',
      accessorKey: 'product',
      enableSorting: true,
    },
    {
      id: 'epic',
      header: 'Epic',
      accessorKey: 'epic',
      enableSorting: true,
    },
    {
      id: 'sync',
      header: 'Sync Status',
      enableSorting: true,
      cell: ({ row }) => {
        const feature = row as unknown as Feature;
        if (feature.adoId) {
          return (
            <div className="flex items-center space-x-2">
              <StatusBadge type="synced" variant="sync" />
              <span className="text-xs text-gray-500">{feature.adoId}</span>
            </div>
          );
        }
        return <StatusBadge type="pending" variant="sync" label="Not Synced" />;
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const feature = row as unknown as Feature;
        return (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2"
              title="View in ProductBoard"
              onClick={() => {
                // In a real app, this would open the feature in ProductBoard
                window.open(`https://productboard.com/features/${feature.id}`, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => {
                setSelectedFeature(feature);
                setIsDialogOpen(true);
              }}
              title="View feature details"
            >
              Details
            </Button>
          </div>
        );
      }
    }
  ], []);
  
  // Feature detail expanded content
  const expandedContent = useCallback((feature: Feature) => {
    // Create a local state for syncing status
    // Note: This is a simplified approach for the demo
    // In a real app, you would use React state hooks
    let syncingState = false;
    
    const handleSync = () => {
      // This is just a placeholder since we can't use React state in this callback
      // In a real implementation, you would use state and useEffect
      alert('In a real app, this would sync the feature with Azure DevOps');
    };
    
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
        <div className="flex gap-4 mb-2">
          <StatusBadge 
            type={feature.status === 'in-progress' ? 'active' : feature.status as any} 
            variant="status" 
          />
          <StatusBadge 
            type={feature.priority} 
            variant="priority" 
          />
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Description</h4>
          <div 
            className="text-sm text-slate-500 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: feature.description || '' }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Product</h4>
            <p className="text-sm text-slate-500">
              {feature.product || 'N/A'}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Epic</h4>
            <p className="text-sm text-slate-500">
              {feature.epic || 'N/A'}
            </p>
          </div>
        </div>
        
        {feature.adoId && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Azure DevOps ID</h4>
            <div className="flex items-center">
              <p className="text-sm font-mono bg-slate-100 p-2 rounded flex-grow">
                {feature.adoId}
              </p>
            </div>
          </div>
        )}
        
        {feature.lastSyncedAt && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Last Synced</h4>
            <p className="text-sm text-slate-500">
              {new Date(feature.lastSyncedAt).toLocaleString()}
            </p>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-4">
          {!feature.adoId ? (
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleSync}
              title="Sync this feature to Azure DevOps"
            >
              Sync to Azure DevOps
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center"
              onClick={handleSync}
              title="Force a resync of this feature"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Force Resync
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            title="View in ProductBoard"
            onClick={() => {
              window.open(`https://productboard.com/features/${feature.id}`, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View in ProductBoard
          </Button>
        </div>
      </div>
    );
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">ProductBoard Features</h1>
        <Button 
          variant="primary"
          disabled={isLoading}
          title="Synchronize all features with ProductBoard"
          onClick={() => {
            // Call the sync function from the useFeatures hook
            sync();
          }}
        >
          {isLoading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Features
            </>
          )}
        </Button>
      </div>
      
      {/* Hierarchy Selector */}
      <HierarchySelector 
        items={MOCK_HIERARCHY_ITEMS}
        onSelectionChange={handleHierarchyChange}
        initialSelection={hierarchySelection}
      />
      
      {/* Filter Bar */}
      <FilterBar 
        filters={FILTER_CONFIGS}
        onFilterChange={handleFilterChange}
        initialValues={filterValues}
      />
      
      {/* Features Table */}
      <EnhancedTable 
        data={filteredFeatures}
        columns={columns}
        getRowId={(row) => row.id}
        expandedContent={expandedContent}
        initialSortColumn="name"
        initialSortDirection="asc"
        pageSize={10}
      />
      
      {/* Feature Details Dialog */}
      <Dialog 
        open={isDialogOpen && selectedFeature !== null} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedFeature(null);
        }}
      >
        {selectedFeature && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedFeature.name}</DialogTitle>
              <DialogDescription>
                Feature details from ProductBoard
              </DialogDescription>
            </DialogHeader>
            
            {isLoading ? (
              <div className="py-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex gap-4">
                  <StatusBadge 
                    type={selectedFeature.status === 'in-progress' ? 'active' : selectedFeature.status as any} 
                    variant="status" 
                  />
                  <StatusBadge 
                    type={selectedFeature.priority} 
                    variant="priority" 
                  />
                  {selectedFeature.type === 'sub-feature' && (
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center">
                      Story
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Description</h4>
                  <div 
                    className="text-sm text-slate-500 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedFeature.description || '' }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Product</h4>
                    <p className="text-sm text-slate-500">
                      {selectedFeature.product || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Epic</h4>
                    <p className="text-sm text-slate-500">
                      {selectedFeature.epic || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {selectedFeature.type === 'sub-feature' && selectedFeature.parentId && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Parent Feature</h4>
                    <p className="text-sm text-slate-500">
                      {features.find((f: Feature) => f.id === selectedFeature.parentId)?.name || 'N/A'}
                    </p>
                  </div>
                )}
                
                {selectedFeature.adoId && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Azure DevOps ID</h4>
                    <div className="flex items-center">
                      <p className="text-sm font-mono bg-slate-100 p-2 rounded flex-grow">
                        {selectedFeature.adoId}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2"
                        title="Copy to clipboard"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedFeature.adoId || '');
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedFeature.lastSyncedAt && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Last Synced</h4>
                    <p className="text-sm text-slate-500">
                      {new Date(selectedFeature.lastSyncedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="flex items-center space-x-2">
              {!selectedFeature.adoId ? (
                <Button 
                  variant="primary"
                  disabled={isSyncing}
                  onClick={() => {
                    setIsSyncing(true);
                    // Simulate API call
                    setTimeout(() => {
                      setIsSyncing(false);
                      // Update the feature with a mock ADO ID
                      setSelectedFeature({
                        ...selectedFeature,
                        adoId: `ADO-${Math.floor(Math.random() * 1000)}`,
                        lastSyncedAt: new Date().toISOString()
                      });
                    }, 1500);
                  }}
                >
                  {isSyncing ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                      Syncing...
                    </>
                  ) : (
                    'Sync to Azure DevOps'
                  )}
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  className="flex items-center"
                  disabled={isSyncing}
                  onClick={() => {
                    setIsSyncing(true);
                    // Simulate API call
                    setTimeout(() => {
                      setIsSyncing(false);
                      // Update the lastSyncedAt timestamp
                      setSelectedFeature({
                        ...selectedFeature,
                        lastSyncedAt: new Date().toISOString()
                      });
                    }, 1500);
                  }}
                >
                  {isSyncing ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-primary rounded-full"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Force Resync
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline"
                title="Open in ProductBoard"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View in ProductBoard
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
