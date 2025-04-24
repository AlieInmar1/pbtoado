import React, { useState, useCallback, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  XMarkIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useFeatures } from '../src/hooks/useFeatures';
import { Feature } from '../src/lib/api/features';
import { useWorkspace } from '../src/contexts/WorkspaceContext';
import { toast } from './lib/sonner';

interface ProductBoardStorySelectorProps {
  sessionId: string;
  onAddFeature: (feature: Feature) => Promise<void>;
  onClose: () => void;
}

export function ProductBoardStorySelector({
  sessionId,
  onAddFeature,
  onClose
}: ProductBoardStorySelectorProps) {
  const { currentWorkspace } = useWorkspace();
  const { features, isLoading, isError, error, refetch, sync, isSyncing } = useFeatures();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'feature' | 'sub-feature'>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique products and statuses for filtering
  const products = useMemo(() => {
    const productSet = new Set<string>();
    features.forEach(feature => {
      if (feature.metadata?.product) {
        productSet.add(feature.metadata.product);
      }
    });
    return ['all', ...Array.from(productSet)];
  }, [features]);

  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    features.forEach(feature => {
      if (feature.status) {
        statusSet.add(feature.status);
      }
    });
    return ['all', ...Array.from(statusSet)];
  }, [features]);

  // Filter features based on search query and filters
  // Track expanded feature cards
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  
  // Toggle expanded state for a feature
  const toggleFeatureExpanded = useCallback((featureId: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      return newSet;
    });
  }, []);
  
  const filteredFeatures = useMemo(() => {
    // Don't show any features initially until search or filters are applied
    const hasActiveFilter = 
      searchQuery !== '' || 
      filter !== 'all' || 
      productFilter !== 'all' || 
      statusFilter !== 'all';
      
    if (!hasActiveFilter) {
      return [];
    }
    
    let result = [...features];
    
    // Apply type filter
    if (filter !== 'all') {
      result = result.filter(feature => feature.type === filter);
    }
    
    // Apply product filter
    if (productFilter !== 'all') {
      result = result.filter(feature => 
        feature.metadata?.product === productFilter
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(feature => 
        feature.status === statusFilter
      );
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(feature => 
        feature.name.toLowerCase().includes(query) || 
        (feature.description && feature.description.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [features, filter, productFilter, statusFilter, searchQuery]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredFeatures.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle adding a feature as a story
  const handleAddFeature = useCallback(async (feature: Feature) => {
    if (adding === feature.id) return;
    
    setAdding(feature.id);
    try {
      await onAddFeature(feature);
      toast.success(`Added "${feature.name}" to session`);
    } catch (error) {
      console.error('Error adding feature to session:', error);
      toast.error(`Failed to add feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdding(null);
    }
  }, [adding, onAddFeature]);

  // Handle syncing ProductBoard data
  const handleSync = useCallback(async () => {
    try {
      await sync();
      toast.success('ProductBoard data synced successfully');
    } catch (error) {
      console.error('Error syncing ProductBoard data:', error);
      toast.error(`Failed to sync: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [sync]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add ProductBoard Features to Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSyncing ? 'Syncing...' : 'Sync ProductBoard'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center">
                <FunnelIcon className="h-5 w-5 text-gray-400 mr-1" />
                <span className="text-sm text-gray-500 mr-2">Filters:</span>
              </div>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="block py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="feature">Features</option>
                <option value="sub-feature">Sub-features</option>
              </select>
              
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="block py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {products.map(product => (
                  <option key={product} value={product}>
                    {product === 'all' ? 'All Products' : product}
                  </option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading || isSyncing ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-2 text-gray-600">
                {isSyncing ? 'Syncing ProductBoard data...' : 'Loading features...'}
              </span>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Features</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No features found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {features.length === 0 
                  ? 'No ProductBoard features available. Try syncing with ProductBoard.' 
                  : searchQuery || filter !== 'all' || productFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Enter a search term or apply filters to find features.'}
              </p>
              {features.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Sync ProductBoard
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <ul className="divide-y divide-gray-200">
                {filteredFeatures
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((feature) => {
                    const isExpanded = expandedFeatures.has(feature.id);
                    
                    return (
                      <li key={feature.id} className="py-3">
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer" 
                            onClick={() => toggleFeatureExpanded(feature.id)}
                          >
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                                feature.type === 'feature' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {feature.type}
                              </span>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {feature.name}
                              </p>
                            </div>
                            
                            {isExpanded && feature.description && (
                              <p className="mt-1 text-sm text-gray-500">
                                {feature.description}
                              </p>
                            )}
                            
                            {isExpanded && (
                              <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                                {feature.status && (
                                  <span>Status: {feature.status}</span>
                                )}
                                {feature.metadata?.product && (
                                  <>
                                    <span>•</span>
                                    <span>Product: {feature.metadata.product}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddFeature(feature)}
                            disabled={adding === feature.id}
                            className="ml-4 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {adding === feature.id ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding...
                              </span>
                            ) : (
                              <>
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-4 space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
