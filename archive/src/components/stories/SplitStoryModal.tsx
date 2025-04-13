import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { Story } from '../../types/database';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface SplitStoryModalProps {
  story: Story;
  onClose: () => void;
  onSplit: (titles: string[], story?: Story) => Promise<void>;
}

export function SplitStoryModal({ story, onClose, onSplit }: SplitStoryModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [titles, setTitles] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);

  const handleAddTitle = () => {
    setTitles([...titles, '']);
  };

  const handleRemoveTitle = (index: number) => {
    setTitles(titles.filter((_, i) => i !== index));
  };

  const handleTitleChange = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    setTitles(newTitles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate titles
    const validTitles = titles.filter(title => title.trim() !== '');
    if (validTitles.length < 2) {
      toast.error('Please provide at least two valid titles for splitting');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSplit(validTitles, story);
      toast.success(`Successfully split story into ${validTitles.length} new stories`);
      onClose();
    } catch (error) {
      console.error('Error splitting story:', error);
      toast.error('Failed to split story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Split Story"
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-1">Original Story:</h3>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="font-medium">{story.pb_title}</p>
          <p className="text-sm text-gray-600 mt-1">{story.description || 'No description'}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">New Stories:</h3>
          <p className="text-xs text-gray-500 mb-4">
            Enter titles for the new stories that will be created by splitting this story.
            Each new story will inherit the same properties as the original.
          </p>
          
          <div className="space-y-3">
            {titles.map((title, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(index, e.target.value)}
                  placeholder={`New story ${index + 1} title`}
                  className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
                {titles.length > 2 && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="p-1"
                    onClick={() => handleRemoveTitle(index)}
                  >
                    <TrashIcon className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddTitle}
            className="mt-3 inline-flex items-center text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Another Story
          </Button>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
            {loading ? 'Splitting...' : 'Split Story'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
