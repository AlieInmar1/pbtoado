import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { Story } from '../../types/database';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface DependencyModalProps {
  story: Story;
  onClose: () => void;
  onSave: (dependencies: string[]) => Promise<void>;
}

export function DependencyModal({ story, onClose, onSave }: DependencyModalProps) {
  const { currentWorkspace } = useWorkspace();
  const { stories } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [loadingStories, setLoadingStories] = useState(true);
  const [availableStories, setAvailableStories] = useState<Story[]>([]);
  const [dependencies, setDependencies] = useState<string[]>(
    (story as any).dependencies || []
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Load available stories when component mounts
  useEffect(() => {
    const loadAvailableStories = async () => {
      if (!currentWorkspace) return;
      
      setLoadingStories(true);
      try {
        const allStories = await stories.getAll(currentWorkspace.id);
        // Filter out current story and already selected dependencies
        const filtered = allStories.filter(s => 
          s.id !== story.id && 
          !dependencies.includes(s.id)
        );
        setAvailableStories(filtered);
      } catch (error) {
        console.error('Error loading stories:', error);
        toast.error('Failed to load available stories');
      } finally {
        setLoadingStories(false);
      }
    };
    
    loadAvailableStories();
  }, [currentWorkspace, stories, story.id, dependencies]);

  const handleAddDependency = (id: string) => {
    setDependencies([...dependencies, id]);
  };

  const handleRemoveDependency = (id: string) => {
    setDependencies(dependencies.filter(depId => depId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      await onSave(dependencies);
      toast.success('Dependencies updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating dependencies:', error);
      toast.error('Failed to update dependencies');
    } finally {
      setLoading(false);
    }
  };

  // Filter available stories based on search query
  const filteredStories = availableStories.filter(s => 
    s.pb_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pb_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get story by ID from available stories or dependencies
  const getDependencyStory = (id: string) => {
    return availableStories.find(s => s.id === id) || { pb_title: 'Unknown Story', id };
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Manage Dependencies"
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-1">Story:</h3>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="font-medium">{story.pb_title}</p>
          <p className="text-sm text-gray-600 mt-1">{story.description || 'No description'}</p>
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 text-sm text-blue-700">
            <p>
              Dependencies are stories that must be completed before this story can be started or completed.
              Adding dependencies helps track work that needs to be done first.
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Current Dependencies */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Dependencies</h3>
            {dependencies.length === 0 ? (
              <div className="text-sm text-gray-500 italic">No dependencies added yet</div>
            ) : (
              <ul className="space-y-2">
                {dependencies.map(depId => {
                  const depStory = getDependencyStory(depId);
                  return (
                    <li 
                      key={depId} 
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <span className="text-sm">
                        {depStory.pb_title}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleRemoveDependency(depId)}
                        className="p-1"
                      >
                        <TrashIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          
          {/* Search and Add New Dependencies */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Dependencies</h3>
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search stories by title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            {loadingStories ? (
              <div className="flex justify-center py-4">
                <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {filteredStories.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No matching stories found
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredStories.map(story => (
                      <li 
                        key={story.id} 
                        className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddDependency(story.id)}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{story.pb_title}</p>
                          <p className="text-xs text-gray-500">{story.pb_id}</p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs"
                        >
                          Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Dependencies'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
