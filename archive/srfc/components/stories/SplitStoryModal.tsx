import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Story } from '../../types/database';
import { Input } from '../ui/Input';

interface SplitStoryModalProps {
  story: Story;
  onClose: () => void;
  onSplit: (titles: string[], story?: Story) => Promise<void>;
}

interface SplitStory {
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export function SplitStoryModal({ story, onClose, onSplit }: SplitStoryModalProps) {
  const [splitStories, setSplitStories] = useState<SplitStory[]>([
    {
      title: '',
      description: story.description || '',
      acceptanceCriteria: story.acceptance_criteria || [],
    },
    {
      title: '',
      description: '',
      acceptanceCriteria: [],
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (splitStories.some(s => !s.title.trim())) {
      setError('All story titles are required');
      return;
    }

    try {
      // Create new stories with their content
      const newStories = splitStories.map(s => ({
        ...story,
        pb_title: s.title,
        description: s.description,
        acceptance_criteria: s.acceptanceCriteria,
      }));
      
      await onSplit(splitStories.map(s => s.title), newStories);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split story');
    }
  };

  const addNewSplit = () => {
    setSplitStories([
      ...splitStories,
      {
        title: '',
        description: '',
        acceptanceCriteria: [],
      },
    ]);
  };

  const removeSplit = (index: number) => {
    setSplitStories(splitStories.filter((_, i) => i !== index));
  };

  const updateSplitStory = (index: number, field: keyof SplitStory, value: string | string[]) => {
    const newSplitStories = [...splitStories];
    newSplitStories[index] = {
      ...newSplitStories[index],
      [field]: value,
    };
    setSplitStories(newSplitStories);
  };

  const addAcceptanceCriterion = (storyIndex: number) => {
    const newSplitStories = [...splitStories];
    newSplitStories[storyIndex].acceptanceCriteria.push('');
    setSplitStories(newSplitStories);
  };

  const removeAcceptanceCriterion = (storyIndex: number, criterionIndex: number) => {
    const newSplitStories = [...splitStories];
    newSplitStories[storyIndex].acceptanceCriteria.splice(criterionIndex, 1);
    setSplitStories(newSplitStories);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Split Story</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900">Original Story</h3>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Title:</span> {story.pb_title}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Description:</span> {story.description}
              </p>
              {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Acceptance Criteria:</span>
                  <ul className="list-disc list-inside mt-1">
                    {story.acceptance_criteria.map((criterion, index) => (
                      <li key={index}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-6">
              {splitStories.map((splitStory, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                  {index > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSplit(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    Split Story {index + 1}
                  </h4>
                  
                  <div className="space-y-4">
                    <Input
                      label="Title"
                      value={splitStory.title}
                      onChange={(e) => updateSplitStory(index, 'title', e.target.value)}
                      placeholder={`Split story ${index + 1} title`}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={splitStory.description}
                        onChange={(e) => updateSplitStory(index, 'description', e.target.value)}
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter description"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Acceptance Criteria
                        </label>
                        <button
                          type="button"
                          onClick={() => addAcceptanceCriterion(index)}
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {splitStory.acceptanceCriteria.map((criterion, criterionIndex) => (
                          <div key={criterionIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={criterion}
                              onChange={(e) => {
                                const newCriteria = [...splitStory.acceptanceCriteria];
                                newCriteria[criterionIndex] = e.target.value;
                                updateSplitStory(index, 'acceptanceCriteria', newCriteria);
                              }}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder={`Criterion ${criterionIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeAcceptanceCriterion(index, criterionIndex)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addNewSplit}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
              >
                Add another story
              </button>
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
                Split Story
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}