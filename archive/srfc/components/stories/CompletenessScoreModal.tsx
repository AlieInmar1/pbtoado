import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { Story } from '../../types/database';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useFunctions } from '../../contexts/FunctionContext';
import { toast } from 'sonner';

interface Criterion {
  id: string;
  label: string;
  weight: number;
  description: string;
}

const CRITERIA: Criterion[] = [
  {
    id: 'description',
    label: 'Clear Description',
    weight: 20,
    description: 'Story has a clear, understandable description of what needs to be done',
  },
  {
    id: 'acceptance',
    label: 'Acceptance Criteria',
    weight: 25,
    description: 'Story includes specific, testable acceptance criteria',
  },
  {
    id: 'scope',
    label: 'Well-Scoped',
    weight: 15,
    description: 'Story is appropriately sized and has clear boundaries',
  },
  {
    id: 'dependencies',
    label: 'Dependencies Identified',
    weight: 15,
    description: 'Technical and business dependencies are clearly identified',
  },
  {
    id: 'value',
    label: 'Business Value',
    weight: 25,
    description: 'Story clearly articulates the business value and user benefit',
  },
];

interface CompletenessScoreModalProps {
  story: Story;
  onClose: () => void;
  onSave: (score: number) => Promise<void>;
}

export function CompletenessScoreModal({ story, onClose, onSave }: CompletenessScoreModalProps) {
  const { functions } = useFunctions();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    // Initialize scores based on current completeness
    const currentScore = story.completeness_score || 0;
    const defaultValue = Math.floor(currentScore / CRITERIA.length);
    const initialScores = Object.fromEntries(
      CRITERIA.map(c => [c.id, defaultValue])
    );
    setScores(initialScores);
  }, [story]);

  const calculateTotal = () => {
    return Math.floor(
      Object.entries(scores).reduce((total, [id, score]) => {
        const criterion = CRITERIA.find(c => c.id === id);
        return total + (score * (criterion?.weight || 0)) / 100;
      }, 0)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(calculateTotal());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save completeness score');
    }
  };

  const analyzeWithAI = async () => {
    if (!currentWorkspace || !functions) return;
    
    setAnalyzing(true);
    try {
      const analysis = await functions.analyzeStory({
        workspaceId: currentWorkspace.id,
        storyData: {
          title: story.pb_title,
          description: story.description || '',
          acceptanceCriteria: story.acceptance_criteria || [],
        },
      });

      // Update scores
      setScores({
        description: analysis.scores.description,
        acceptance: analysis.scores.acceptance,
        scope: analysis.scores.scope,
        dependencies: analysis.scores.dependencies,
        value: analysis.scores.value,
      });

      // Update suggestions
      setSuggestions(analysis.suggestions);

      toast.success('Story analyzed successfully');
    } catch (error) {
      console.error('Error analyzing story:', error);
      toast.error('Failed to analyze story');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Story Completeness Score</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            {CRITERIA.map((criterion) => (
              <div key={criterion.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {criterion.label}
                      <span className="ml-2 text-gray-500">
                        (Weight: {criterion.weight}%)
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {criterion.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={scores[criterion.id] || 0}
                      onChange={(e) => {
                        setScores({
                          ...scores,
                          [criterion.id]: parseInt(e.target.value),
                        });
                      }}
                      className="w-32"
                    />
                    <div className="mt-1 text-center text-sm text-gray-500">
                      {scores[criterion.id] || 0}%
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  {scores[criterion.id] >= 80 ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Good
                    </div>
                  ) : scores[criterion.id] < 50 ? (
                    <div className="flex items-center text-red-600 text-sm">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      Needs improvement
                    </div>
                  ) : null}
                </div>
                {suggestions[criterion.id] && (
                  <div className="mt-2 text-sm bg-blue-50 p-2 rounded text-blue-700">
                    <strong>AI Suggestion:</strong> {suggestions[criterion.id]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 bg-indigo-50 p-4 rounded-md">
            <div className="text-sm text-indigo-700">
              Overall Completeness Score
            </div>
            <div className="mt-1 text-2xl font-semibold text-indigo-600">
              {calculateTotal()}%
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={analyzing}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-transparent rounded-md shadow-sm hover:bg-indigo-100"
            >
              {analyzing ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </button>
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