import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { Story } from '../../types/database';

interface CreateStoryButtonProps {
  level: 'epic' | 'feature' | 'story';
  parentId?: string;
  className?: string;
}

export function CreateStoryButton({ level, parentId, className = '' }: CreateStoryButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level,
    status: 'open',
    product_line: '',
    parent_id: parentId || undefined
  });
  
  const { currentWorkspace } = useWorkspace();
  const { stories } = useDatabase();

  // Get color based on level
  const getButtonColor = () => {
    switch (level) {
      case 'epic':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'feature':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'story':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return;
    }
    
    setLoading(true);
    
    try {
      const storyData: Partial<Story> = {
        workspace_id: currentWorkspace.id,
        pb_title: formData.title,
        pb_id: `temp-${Date.now()}`,
        description: formData.description,
        level: formData.level,
        status: formData.status as 'open' | 'in_progress' | 'done' | 'blocked',
        product_line: formData.product_line,
        parent_id: formData.parent_id,
        completion_percentage: 0,
        sync_status: 'not_synced',
        needs_split: false,
        version: 1,
        is_draft: true
      };
      
      await stories.create(storyData);
      toast.success(`New ${level} created successfully`);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        level,
        status: 'open',
        product_line: '',
        parent_id: parentId || undefined
      });
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error(`Failed to create ${level}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`p-1 rounded ${getButtonColor()} ${className}`}
        title={`Create new ${level}`}
      >
        <PlusIcon className="h-3 w-3" />
      </button>
      
      {isModalOpen && (
        <Dialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Create New ${level.charAt(0).toUpperCase() + level.slice(1)}`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="product_line" className="block text-sm font-medium text-gray-700 mb-1">
                Product Line
              </label>
              <input
                type="text"
                id="product_line"
                name="product_line"
                value={formData.product_line}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="flex justify-end pt-4 space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
