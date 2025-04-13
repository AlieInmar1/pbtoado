import React, { useState } from 'react';
import { 
  PlusIcon, 
  XMarkIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowsUpDownIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import type { GroomingSessionStory, Story } from '../../types/database';

interface SessionStoryListProps {
  sessionStories: (GroomingSessionStory & { story: Story })[];
  onAddStoryClick: () => void;
  onRemoveStory: (sessionStoryId: string) => Promise<void>;
  onReorderStory: (sessionStoryId: string, newOrder: number) => Promise<void>;
  onStoryClick: (sessionStory: GroomingSessionStory & { story: Story }) => void;
  onSplitStory: (sessionStory: GroomingSessionStory & { story: Story }) => void;
  sessionStatus: 'planned' | 'in_progress' | 'completed';
}

export function SessionStoryList({
  sessionStories,
  onAddStoryClick,
  onRemoveStory,
  onReorderStory,
  onStoryClick,
  onSplitStory,
  sessionStatus
}: SessionStoryListProps) {
  const [loading, setLoading] = useState(false);
  const [actionStoryId, setActionStoryId] = useState<string | null>(null);

  // Sort stories by discussion_order
  const sortedStories = [...sessionStories].sort((a, b) => {
    // If discussion_order is undefined or null, put at the end
    if (a.discussion_order === undefined || a.discussion_order === null) return 1;
    if (b.discussion_order === undefined || b.discussion_order === null) return -1;
    return a.discussion_order - b.discussion_order;
  });

  const handleRemoveStory = async (id: string) => {
    if (loading) return;
    
    setLoading(true);
    setActionStoryId(id);
    try {
      await onRemoveStory(id);
    } catch (error) {
      console.error('Error removing story:', error);
    } finally {
      setLoading(false);
      setActionStoryId(null);
    }
  };

  const handleMoveStory = async (id: string, direction: 'up' | 'down') => {
    if (loading) return;
    
    const currentIndex = sortedStories.findIndex(s => s.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedStories.length) return;
    
    // Get the current order values
    const currentOrder = sortedStories[currentIndex].discussion_order ?? currentIndex;
    const targetOrder = sortedStories[newIndex].discussion_order ?? newIndex;
    
    // Swap the orders
    setLoading(true);
    setActionStoryId(id);
    try {
      await onReorderStory(id, targetOrder);
    } catch (error) {
      console.error('Error reordering story:', error);
    } finally {
      setLoading(false);
      setActionStoryId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'discussed': return 'bg-green-100 text-green-800';
      case 'deferred': return 'bg-yellow-100 text-yellow-800';
      case 'split': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Stories</h3>
        <button
          onClick={onAddStoryClick}
          disabled={sessionStatus === 'completed'}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Stories
        </button>
      </div>

      {sortedStories.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stories added</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add stories to discuss in this grooming session
          </p>
          <div className="mt-6">
            <button
              onClick={onAddStoryClick}
              disabled={sessionStatus === 'completed'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Stories
            </button>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {sortedStories.map((sessionStory, index) => (
            <li key={sessionStory.id} className="py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex flex-col items-center mr-3">
                  <button
                    onClick={() => handleMoveStory(sessionStory.id, 'up')}
                    disabled={index === 0 || loading || sessionStatus === 'completed'}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-gray-500">
                    {sessionStory.discussion_order !== undefined && sessionStory.discussion_order !== null 
                      ? sessionStory.discussion_order + 1 
                      : index + 1}
                  </span>
                  <button
                    onClick={() => handleMoveStory(sessionStory.id, 'down')}
                    disabled={index === sortedStories.length - 1 || loading || sessionStatus === 'completed'}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div 
                  className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                  onClick={() => onStoryClick(sessionStory)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                        sessionStory.story.level === 'epic' ? 'bg-purple-100 text-purple-800' :
                        sessionStory.story.level === 'feature' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {sessionStory.story.level || 'story'}
                      </span>
                      <p className="text-sm font-medium text-gray-900">{sessionStory.story.pb_title}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sessionStory.status)}`}>
                      {sessionStory.status}
                    </span>
                  </div>
                  
                  {sessionStory.story.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{sessionStory.story.description}</p>
                  )}
                  
                  <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                    {sessionStory.story.story_points && (
                      <span className="flex items-center">
                        <ArrowsUpDownIcon className="h-3.5 w-3.5 mr-1" />
                        Points: {sessionStory.story.story_points}
                      </span>
                    )}
                    
                    {sessionStory.discussion_points && sessionStory.discussion_points.length > 0 && (
                      <span className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 mr-1" />
                        {sessionStory.discussion_points.length} discussion points
                      </span>
                    )}
                    
                    {sessionStory.complexity_rating && (
                      <span className="flex items-center">
                        Complexity: {sessionStory.complexity_rating}/5
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0 flex items-center space-x-1">
                  {sessionStatus !== 'completed' && (
                    <>
                      <button
                        onClick={() => onSplitStory(sessionStory)}
                        disabled={loading || actionStoryId === sessionStory.id}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Split story"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveStory(sessionStory.id)}
                        disabled={loading || actionStoryId === sessionStory.id}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Remove from session"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
