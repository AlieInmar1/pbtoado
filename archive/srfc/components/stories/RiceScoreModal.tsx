import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Story } from '../../types/database';

interface RiceScoreModalProps {
  story: Story;
  onClose: () => void;
  onSave: (riceScore: Story['rice_score']) => Promise<void>;
}

export function RiceScoreModal({ story, onClose, onSave }: RiceScoreModalProps) {
  const [reach, setReach] = useState(story.rice_score?.reach || 0);
  const [impact, setImpact] = useState(story.rice_score?.impact || 0);
  const [confidence, setConfidence] = useState(story.rice_score?.confidence || 0);
  const [effort, setEffort] = useState(story.rice_score?.effort || 0);
  const [error, setError] = useState<string | null>(null);

  const calculateTotal = () => {
    return Math.round((reach * impact * confidence) / (effort * 100));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (effort === 0) {
      setError('Effort cannot be zero');
      return;
    }

    try {
      await onSave({
        reach,
        impact,
        confidence,
        effort,
        total: calculateTotal(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save RICE score');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Calculate RICE Score</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reach (Monthly Users)
            </label>
            <input
              type="number"
              min="0"
              value={reach}
              onChange={(e) => setReach(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Impact (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={impact}
              onChange={(e) => setImpact(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confidence (0-100%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Effort (Story Points)
            </label>
            <input
              type="number"
              min="1"
              value={effort}
              onChange={(e) => setEffort(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-700">
              RICE Score = (Reach × Impact × Confidence) ÷ (Effort × 100)
            </div>
            <div className="mt-2 text-lg font-medium text-indigo-600">
              Total: {calculateTotal()}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
            >
              Save Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}