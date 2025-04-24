import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  XMarkIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import type { SessionStory as GroomingSessionStory } from '../src/types/grooming';

// Define a custom Story interface that includes the properties used in this component
interface Story {
  id: string;
  title: string;
  description?: string;
  status?: string;
  level?: string | { name: string };
  pb_title?: string | { name: string };
  story_points?: number;
}

interface StorySelectorProps {
  workspaceId: string;
  sessionId: string;
  existingSessionStories: GroomingSessionStory[];
  onAddStory: (story: Story) => Promise<void>;
  onClose: () => void;
  getStoriesForWorkspace: (workspaceId: string) => Promise<Story[]>;
}

export function StorySelector({
  workspaceId,
  sessionId,
  existingSessionStories,
  onAddStory,
  onClose,
  getStoriesForWorkspace
}: StorySelectorProps) {
  // State management
  const [stories, setStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'epic' | 'feature' | 'story'>('all');

  // Get existing story IDs to filter them out - memoize to prevent unnecessary recalculations
  const existingStoryIds = useMemo(() => 
    existingSessionStories.map(ss => ss.story_id),
    [existingSessionStories]
  );

  // Load stories only once when the component mounts
  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;
    
    const loadStories = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      
      // Set a timeout to ensure loading state doesn't get stuck
      loadingTimeout = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('Loading stories is taking longer than expected');
          setError('Loading stories is taking longer than expected. Please try again.');
          setLoading(false);
        }
      }, 15000); // 15 seconds timeout
      
      try {
        console.log('Loading stories for workspace:', workspaceId);
        const allStories = await getStoriesForWorkspace(workspaceId);
        console.log('Stories loaded:', allStories?.length || 0);
        
        if (!isMounted) return;
        
        // Clear the timeout since we got a response
        clearTimeout(loadingTimeout);
        
        if (!allStories || allStories.length === 0) {
          console.log('No stories found');
          setStories([]);
          setLoading(false);
          return;
        }
        
        // Filter out stories that are already in the session
        const availableStories = allStories.filter(story => !existingStoryIds.includes(story.id));
        console.log('Available stories after filtering:', availableStories.length);
        
        // Use functional updates to avoid stale state
        setStories(availableStories);
      } catch (error) {
        console.error('Error loading stories:', error);
        setError(`Failed to load stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        if (isMounted) {
          // Clear the timeout to prevent it from firing after we're done
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    };

    loadStories();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [workspaceId, existingStoryIds, getStoriesForWorkspace]);

  // Track expanded story cards
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  
  // Toggle expanded state for a story
  const toggleStoryExpanded = useCallback((storyId: string) => {
    setExpandedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  }, []);
  
  // Filter stories based on search query and filter - memoize to prevent unnecessary recalculations
  const filteredStories = useMemo(() => {
    let result = [...stories];
    
    // Apply level filter
    if (filter !== 'all') {
      result = result.filter(story => {
        const storyLevel = typeof story.level === 'object' && story.level !== null
          ? (story.level as any).name
          : story.level;
        return storyLevel === filter;
      });
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(story => {
        // Handle pb_title which might be an object
        const titleText = typeof story.pb_title === 'object' && story.pb_title !== null
          ? (story.pb_title as any).name || ''
          : story.pb_title || '';
          
        // Handle description which might be an object
        const descriptionText = typeof story.description === 'object' && story.description !== null
          ? (story.description as any).text || JSON.stringify(story.description)
          : story.description || '';
          
        return titleText.toLowerCase().includes(query) || 
               descriptionText.toLowerCase().includes(query);
      });
    }
    
    return result;
  }, [stories, searchQuery, filter]);

  // Memoize the handleAddStory function to prevent unnecessary re-renders
  const handleAddStory = useCallback(async (story: Story) => {
    // Prevent adding a story that's already being added
    if (adding === story.id) return;
    
    setAdding(story.id);
    try {
      await onAddStory(story);
      // Remove the story from the list after it's been added
      setStories(prevStories => prevStories.filter(s => s.id !== story.id));
    } catch (error) {
      console.error('Error adding story to session:', error);
      // Show error to user
      alert(`Failed to add story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdding(null);
    }
  }, [adding, onAddStory]);

  // Extract string value from potentially object properties
  const getStringValue = useCallback((value: any, defaultValue: string = ''): string => {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    if (typeof value === 'object') {
      return value.name || value.text || JSON.stringify(value);
    }
    
    return String(value);
  }, []);

  // Determine CSS class for story level badge
  const getLevelBadgeClass = useCallback((story: Story): string => {
    const level = getStringValue(story.level, 'story');
    
    if (level === 'epic') return 'bg-purple-100 text-purple-800';
    if (level === 'feature') return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  }, [getStringValue]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Stories to Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Levels</option>
              <option value="epic">Epics</option>
              <option value="feature">Features</option>
              <option value="story">Stories</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-2 text-gray-600">Loading stories...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Stories</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stories found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {stories.length === 0 
                  ? 'There are no available stories to add to this session.' 
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredStories.map((story) => {
                const isExpanded = expandedStories.has(story.id);
                
                return (
                  <li key={story.id} className="py-3">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 min-w-0 cursor-pointer" 
                        onClick={() => toggleStoryExpanded(story.id)}
                      >
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${getLevelBadgeClass(story)}`}>
                            {getStringValue(story.level, 'story')}
                          </span>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getStringValue(story.pb_title, '[No Title]')}
                          </p>
                        </div>
                        
                        {isExpanded && story.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {getStringValue(story.description, '')}
                          </p>
                        )}
                        
                        {isExpanded && (
                          <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                            {story.story_points && <span>Points: {story.story_points}</span>}
                            {story.status && (
                              <>
                                <span>•</span>
                                <span>Status: {getStringValue(story.status, 'Unknown')}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddStory(story)}
                        disabled={adding === story.id}
                        className="ml-4 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {adding === story.id ? (
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
