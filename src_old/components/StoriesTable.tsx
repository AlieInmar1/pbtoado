import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScissorsIcon, EyeIcon, ArchiveBoxIcon, ClipboardDocumentCheckIcon, ArrowPathRoundedSquareIcon, ChevronRightIcon, ChevronDownIcon, ArrowPathIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { CreateStoryButton } from './stories/CreateStoryButton';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { SplitStoryModal } from './stories/SplitStoryModal';
import { RiceScoreModal } from './stories/RiceScoreModal';
import { CompletenessScoreModal } from './stories/CompletenessScoreModal';
import { DependencyModal } from './stories/DependencyModal';
import { FeatureDetailModal } from './productboard/FeatureDetailModal';
import { FeatureCardView } from './productboard/FeatureCardView';
import { SearchBar } from './ui/SearchBar';
import { FilterChips, FilterOption } from './ui/FilterChips';
import { ViewToggle, ViewMode } from './ui/ViewToggle';
import { Select } from './ui/Select';
import type { Story } from '../types/database';
import { ProductBoardFeature, StoryWithChildren } from '../types/productboard';

interface StoriesTableProps {
  onSelectionChange?: (count: number, handler: () => Promise<void>) => void;
}

export function StoriesTable({ onSelectionChange }: StoriesTableProps) {
  const [stories, setStories] = useState<StoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();
  const [filters, setFilters] = useState({
    product: '',
    type: '',
    status: '',
  });
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [splitStory, setSplitStory] = useState<Story | null>(null);
  const [riceStory, setRiceStory] = useState<Story | null>(null);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [completenessStory, setCompletenessStory] = useState<Story | null>(null);
  const [dependencyStory, setDependencyStory] = useState<Story | null>(null);
  const [detailFeature, setDetailFeature] = useState<ProductBoardFeature | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);

  useEffect(() => {
    async function loadStories() {
      if (!currentWorkspace?.id) {
        setStories([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from('productboard_features')
          .select('*')
          .eq('workspace_id', currentWorkspace.id);

        // Apply filters
        if (filters.product) {
          // Adapt filter based on ProductBoard field structure
          query = query.ilike('name', `%${filters.product}%`);
        }
        if (filters.type) {
          // Use feature_type instead of level
          query = query.eq('feature_type', filters.type);
        }
        if (filters.status) {
          // Use status_name instead of status
          query = query.eq('status_name', filters.status);
        }

        const { data, error } = await query.order('updated_at_timestamp', { ascending: false });

        if (error) throw error;
        setStories(organizeProductBoardHierarchy(data || []));
      } catch (error) {
        console.error('Error loading product board features:', error);
        toast.error('Failed to load features');
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, [currentWorkspace?.id, filters]);

  const toggleExpand = (storyId: string) => {
    setExpandedStories(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  };

  const handleCompletenessScore = async (score: number) => {
    if (!completenessStory) return;

    try {
      // Currently the completeness_score is only in the UI context
      // This would need to be properly implemented for ProductBoard features
      toast.info('Completeness score functionality not implemented for ProductBoard features');
      
      // Refresh features list
      const { data, error: refreshError } = await supabase
        .from('productboard_features')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id);

      if (refreshError) throw refreshError;
      setStories(organizeProductBoardHierarchy(data || []));
    } catch (error) {
      console.error('Error updating completeness score:', error);
      throw error;
    }
  };

  const handleArchive = async (storyId: string) => {
    try {
      // For ProductBoard features, we'll set is_archived to true
      const { error } = await supabase
        .from('productboard_features')
        .update({ is_archived: true })
        .eq('id', storyId);

      if (error) throw error;

      // Refresh features list
      const { data, error: refreshError } = await supabase
        .from('productboard_features')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id);

      if (refreshError) throw refreshError;
      setStories(organizeProductBoardHierarchy(data || []));
    } catch (error) {
      console.error('Error archiving feature:', error);
      throw error;
    }
  };

  // Function to handle refresh button click
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      // Query without workspace filter to see all features 
      const { data, error } = await supabase
        .from('productboard_features')
        .select('*');

      if (error) throw error;

      setStories(organizeProductBoardHierarchy(data || []));
    } catch (error) {
      console.error('Error fetching features:', error);
      toast.error('Failed to refresh features');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to organize ProductBoard features into a hierarchy
  const organizeProductBoardHierarchy = (features: ProductBoardFeature[]): StoryWithChildren[] => {
    // For now, return a flat list of features as we build up the hierarchy
    // In the future, this can be enhanced to use parent_type and parent_productboard_id
    return features.map(feature => ({
      ...feature,
      expanded: expandedStories.has(feature.id),
      // Add fields expected by the component until we fully refactor
      level: feature.feature_type || 'feature',
      pb_title: feature.name,
      status: feature.status_name || 'unknown',
      product_line: feature.parent_type || 'unknown',
      parent_id: feature.parent_productboard_id,
      story_points: null,
      completeness_score: null,
      sync_status: null,
      rice_score: null,
      current_rank: null,
      previous_rank: null
    }));
  };

  const handleBulkArchive = useCallback(async () => {
    if (selectedStories.size === 0) return;

    try {
      const { error } = await supabase
        .from('productboard_features')
        .update({ is_archived: true })
        .in('id', Array.from(selectedStories));

      if (error) throw error;

      // Refresh features list
      const { data, error: refreshError } = await supabase
        .from('productboard_features')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id);

      if (refreshError) throw refreshError;
      setStories(organizeProductBoardHierarchy(data || []));
      setSelectedStories(new Set());
    } catch (error) {
      console.error('Error archiving features:', error);
    }
  }, [selectedStories, currentWorkspace?.id]);

  const handleRiceScore = async (riceScore: Story['rice_score']) => {
    if (!riceStory) return;

    try {
      // For ProductBoard features, we'll show a notification as this feature isn't implemented yet
      toast.info('RICE score functionality not yet implemented for ProductBoard features');
      
      // Refresh features list
      const { data, error: refreshError } = await supabase
        .from('productboard_features')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id);

      if (refreshError) throw refreshError;
      setStories(organizeProductBoardHierarchy(data || []));
    } catch (error) {
      console.error('Error updating RICE score:', error);
      throw error;
    }
  };

  const handleSplit = async (titles: string[], story?: Story) => {
    if (!splitStory) return;

    try {
      // For ProductBoard features, we'll show a notification as splitting isn't implemented yet
      toast.info('Splitting functionality not yet implemented for ProductBoard features');
      
      // Refresh features list
      const { data, error } = await supabase
        .from('productboard_features')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id);

      if (error) throw error;
      setStories(organizeProductBoardHierarchy(data || []));
    } catch (error) {
      console.error('Error splitting story:', error);
      throw error;
    }
  };

  // Update parent component when selection changes
  useEffect(() => {
    onSelectionChange?.(selectedStories.size, handleBulkArchive);
  }, [selectedStories.size, onSelectionChange, handleBulkArchive]);

  const renderStoryRow = (story: StoryWithChildren, depth = 0) => {
    const hasChildren = story.children && story.children.length > 0;
    const isExpanded = expandedStories.has(story.id);

    return (
      <React.Fragment key={story.id}>
        <tr className={`
          ${story.sync_status === 'synced' ? 'bg-green-50' : ''}
          ${story.sync_status === 'conflict' ? 'bg-red-50' : ''}
          ${story.sync_status === 'pending' ? 'bg-yellow-50' : ''}
        `}>
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="checkbox"
              checked={selectedStories.has(story.id)}
              onChange={(e) => {
                const newSelected = new Set(selectedStories);
                if (e.target.checked) {
                  newSelected.add(story.id);
                } else {
                  newSelected.delete(story.id);
                }
                setSelectedStories(newSelected);
              }}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(story.id)}
                  className="mr-2 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                </button>
              )}
              <span className="text-sm font-medium text-gray-900">{story.name || story.pb_title}</span>
              {story.level !== 'story' && (
                <CreateStoryButton
                  level={story.level === 'epic' ? 'feature' : 'story'}
                  parentId={story.id}
                  className="ml-2"
                />
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {story.status || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            {story.parent_id ? (
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                Story
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Feature
              </span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {story.product_line}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {story.status}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {story.story_points || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {story.current_rank || '-'}
            {story.previous_rank && story.current_rank && story.previous_rank !== story.current_rank && (
              <span className={`ml-2 ${
                story.current_rank < story.previous_rank ? 'text-green-600' : 
                story.current_rank > story.previous_rank ? 'text-red-600' : ''
              }`}>
                {story.current_rank < story.previous_rank ? (
                  <ArrowUpIcon className="inline h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="inline h-4 w-4" />
                )}
                {Math.abs(story.current_rank - story.previous_rank)}
              </span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {story.sync_status}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <button
              onClick={() => setDetailFeature(story)}
              className="text-gray-400 mr-2"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleArchive(story.id)}
              className="text-gray-400 mr-2"
              title="Archive Story"
            >
              <ArchiveBoxIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSplitStory(story as unknown as Story)}
              className="text-gray-400"
              title="Split Story"
            >
              <ScissorsIcon className="h-5 w-5" />
            </button>
          </td>
        </tr>
        {isExpanded && story.children?.map(child => renderStoryRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
        <span className="ml-2 text-gray-600">Loading stories...</span>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspace Selected</h3>
        <p className="text-gray-500">Please select a workspace to view stories</p>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="mb-4 flex gap-4 p-4 bg-white border-b">
          <div className="flex space-x-2">
            <Select
              value={filters.product}
              onChange={(e) => setFilters(f => ({ ...f, product: e.target.value }))}
              options={[
                { value: '', label: 'All Products' },
                { value: 'mobile', label: 'Mobile App' },
                { value: 'web', label: 'Web Platform' },
                { value: 'api', label: 'API Services' },
              ]}
              className="w-48"
            />
            <Select
              value={filters.type}
              onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
              options={[
                { value: '', label: 'All Types' },
                { value: 'epic', label: 'Epics' },
                { value: 'feature', label: 'Features' },
                { value: 'story', label: 'Stories' },
              ]}
              className="w-48"
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'done', label: 'Done' },
                { value: 'archived', label: 'Archived' },
              ]}
              className="w-48"
            />
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex space-x-2">
            <CreateStoryButton level="epic" />
            <CreateStoryButton level="feature" />
            <CreateStoryButton level="story" />
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={handleRefresh}
                className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
                title="Refresh Features"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-700">Refresh</span>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Stories Found</h3>
          <p className="text-gray-500">
            {Object.values(filters).some(f => f) 
              ? 'Try adjusting your filters or clearing them to see more stories'
              : 'Use the toolbar above to create stories or load sample data'}
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
              <div className="flex items-center space-x-1">
                <CreateStoryButton level="epic" />
                <span className="text-sm text-gray-700">Epic</span>
              </div>
              <div className="flex items-center space-x-1">
                <CreateStoryButton level="feature" />
                <span className="text-sm text-gray-700">Feature</span>
              </div>
              <div className="flex items-center space-x-1">
                <CreateStoryButton level="story" />
                <span className="text-sm text-gray-700">Story</span>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={handleRefresh}
                  className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
                  title="Refresh Features"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-700">Refresh</span>
              </div>
            </div>
          </div>
          
          {/* Second row with filters */}
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <Select
                value={filters.product}
                onChange={(e) => setFilters(f => ({ ...f, product: e.target.value }))}
                options={[
                  { value: '', label: 'All Products' },
                  { value: 'mobile', label: 'Mobile App' },
                  { value: 'web', label: 'Web Platform' },
                  { value: 'api', label: 'API Services' },
                ]}
                className="w-36"
              />
              <Select
                value={filters.type}
                onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'epic', label: 'Epics' },
                  { value: 'feature', label: 'Features' },
                  { value: 'story', label: 'Stories' },
                ]}
                className="w-36"
              />
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <FilterChips
              options={[
                { id: 'open', label: 'Open' },
                { id: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                { id: 'done', label: 'Done', color: 'bg-green-100 text-green-800 border-green-200' },
                { id: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-800 border-gray-200' }
              ]}
              selectedFilters={selectedStatusFilters}
              onChange={setSelectedStatusFilters}
            />
          </div>
        </div>

      {/* Apply search and filter logic */}
      {viewMode === 'table' ? (
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Select
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sync
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stories
              .filter(story => {
                // Apply search filter
                if (searchQuery && !story.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return false;
                }
                
                // Apply status filter
                if (selectedStatusFilters.length > 0 && 
                    !selectedStatusFilters.includes(story.status || '')) {
                  return false;
                }
                
                return true;
              })
              .map(story => renderStoryRow(story))}
          </tbody>
        </table>
      ) : (
        <FeatureCardView 
          features={stories.filter(story => {
            // Apply search filter
            if (searchQuery && !story.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false;
            }
            
            // Apply status filter
            if (selectedStatusFilters.length > 0 && 
                !selectedStatusFilters.includes(story.status || '')) {
              return false;
            }
            
            return true;
          })}
          onViewDetails={setDetailFeature}
          onArchive={handleArchive}
          onSplit={(story) => setSplitStory(story as unknown as Story)}
        />
      )}
      </div>
      {splitStory && (
        <SplitStoryModal
          story={splitStory}
          onClose={() => setSplitStory(null)}
          onSplit={handleSplit}
        />
      )}
      {riceStory && (
        <RiceScoreModal
          story={riceStory}
          onClose={() => setRiceStory(null)}
          onSave={handleRiceScore}
        />
      )}
      {completenessStory && (
        <CompletenessScoreModal
          story={completenessStory}
          onClose={() => setCompletenessStory(null)}
          onSave={handleCompletenessScore}
        />
      )}
      {dependencyStory && (
        <DependencyModal
          story={dependencyStory}
          onClose={() => setDependencyStory(null)}
        />
      )}
      {detailFeature && (
        <FeatureDetailModal
          feature={detailFeature}
          onClose={() => setDetailFeature(null)}
        />
      )}
    </div>
  );
}
