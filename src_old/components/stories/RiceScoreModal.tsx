import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { Story } from '../../types/database';

interface RiceScoreModalProps {
  story: Story;
  onClose: () => void;
  onSave: (riceScore: Story['rice_score']) => Promise<void>;
}

export function RiceScoreModal({ story, onClose, onSave }: RiceScoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [riceScore, setRiceScore] = useState({
    reach: story.rice_score?.reach || 1,
    impact: story.rice_score?.impact || 1,
    confidence: story.rice_score?.confidence || 1,
    effort: story.rice_score?.effort || 1,
    total: story.rice_score?.total || 1
  });

  const calculateTotal = () => {
    const { reach, impact, confidence, effort } = riceScore;
    return (reach * impact * confidence) / effort;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = parseInt(value, 10);
    
    if (isNaN(newValue) || newValue < 1) return;
    
    const newRiceScore = { ...riceScore, [name]: newValue };
    newRiceScore.total = calculateTotal();
    
    setRiceScore(newRiceScore);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      await onSave(riceScore);
      toast.success('RICE score updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating RICE score:', error);
      toast.error('Failed to update RICE score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Update RICE Score"
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
            <p><strong>RICE Score</strong> helps prioritize features:</p>
            <ul className="mt-1 list-disc list-inside ml-2">
              <li><strong>Reach</strong>: How many users will this impact? (1-10)</li>
              <li><strong>Impact</strong>: How much will it impact each user? (1-10)</li>
              <li><strong>Confidence</strong>: How confident are we in these estimates? (1-10)</li>
              <li><strong>Effort</strong>: How much work will this take? (1-10)</li>
            </ul>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="reach" className="block text-sm font-medium text-gray-700 mb-1">
              Reach (1-10)
            </label>
            <input
              type="number"
              id="reach"
              name="reach"
              min="1"
              max="10"
              value={riceScore.reach}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-1">
              Impact (1-10)
            </label>
            <input
              type="number"
              id="impact"
              name="impact"
              min="1"
              max="10"
              value={riceScore.impact}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confidence" className="block text-sm font-medium text-gray-700 mb-1">
              Confidence (1-10)
            </label>
            <input
              type="number"
              id="confidence"
              name="confidence"
              min="1"
              max="10"
              value={riceScore.confidence}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="effort" className="block text-sm font-medium text-gray-700 mb-1">
              Effort (1-10)
            </label>
            <input
              type="number"
              id="effort"
              name="effort"
              min="1"
              max="10"
              value={riceScore.effort}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Final RICE Score: <span className="text-lg font-bold text-indigo-600">{riceScore.total.toFixed(2)}</span>
            </h3>
            <p className="text-xs text-gray-500">
              Formula: (Reach × Impact × Confidence) ÷ Effort
            </p>
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
            {loading ? 'Saving...' : 'Save RICE Score'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
