import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { Story } from '../../types/database';

interface CompletenessScoreModalProps {
  story: Story;
  onClose: () => void;
  onSave: (completionPercentage: number) => Promise<void>;
}

export function CompletenessScoreModal({ story, onClose, onSave }: CompletenessScoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(
    story.completion_percentage ?? 0
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setCompletionPercentage(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      await onSave(completionPercentage);
      toast.success('Completion percentage updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating completion percentage:', error);
      toast.error('Failed to update completion percentage');
    } finally {
      setLoading(false);
    }
  };

  // Get color based on completion percentage
  const getCompletionColor = () => {
    if (completionPercentage < 25) return 'bg-red-100 text-red-800';
    if (completionPercentage < 50) return 'bg-orange-100 text-orange-800';
    if (completionPercentage < 75) return 'bg-yellow-100 text-yellow-800';
    if (completionPercentage < 100) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Update Completion Status"
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-1">Story:</h3>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="font-medium">{story.pb_title}</p>
          <p className="text-sm text-gray-600 mt-1">{story.description || 'No description'}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="completionPercentage" className="block text-sm font-medium text-gray-700 mb-1">
            Completion Percentage (0-100)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              id="completionPercentage"
              min="0"
              max="100"
              step="5"
              value={completionPercentage}
              onChange={handleInputChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={completionPercentage}
              onChange={handleInputChange}
              className="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
        
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <div className="h-4 bg-gray-100">
            <div 
              className="h-full bg-indigo-500" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-center my-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionColor()}`}>
            {completionPercentage < 25 && 'Just Started'}
            {completionPercentage >= 25 && completionPercentage < 50 && 'In Progress'}
            {completionPercentage >= 50 && completionPercentage < 75 && 'Well Underway'}
            {completionPercentage >= 75 && completionPercentage < 100 && 'Nearly Complete'}
            {completionPercentage === 100 && 'Complete'}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Completion Stages</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center">
              <input
                type="checkbox"
                className="rounded text-indigo-600 mr-2"
                checked={completionPercentage >= 25}
                readOnly
              />
              <span>Requirements defined</span>
            </li>
            <li className="flex items-center">
              <input
                type="checkbox"
                className="rounded text-indigo-600 mr-2"
                checked={completionPercentage >= 50}
                readOnly
              />
              <span>Development started</span>
            </li>
            <li className="flex items-center">
              <input
                type="checkbox"
                className="rounded text-indigo-600 mr-2"
                checked={completionPercentage >= 75}
                readOnly
              />
              <span>Testing in progress</span>
            </li>
            <li className="flex items-center">
              <input
                type="checkbox"
                className="rounded text-indigo-600 mr-2"
                checked={completionPercentage >= 90}
                readOnly
              />
              <span>Code review completed</span>
            </li>
            <li className="flex items-center">
              <input
                type="checkbox"
                className="rounded text-indigo-600 mr-2"
                checked={completionPercentage === 100}
                readOnly
              />
              <span>Ready for release</span>
            </li>
          </ul>
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
            {loading ? 'Saving...' : 'Save Completion Status'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
