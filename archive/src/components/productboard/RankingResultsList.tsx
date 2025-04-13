import React from 'react';
import { Button } from '../ui/Button';
import { RankingResultItem, RankingResultItemProps } from './RankingResultItem';

export interface RankingResult extends Omit<RankingResultItemProps, 'onRemove'> {
  storyId: string;
}

interface RankingResultsListProps {
  results: RankingResult[];
  onSave: (results: RankingResult[]) => Promise<void>;
  onRemoveItem?: (index: number) => void;
  saving: boolean;
}

export function RankingResultsList({ 
  results, 
  onSave,
  onRemoveItem,
  saving 
}: RankingResultsListProps) {
  const mockStories = results.filter(r => r.storyId.startsWith('mock-'));
  const hasMockStories = mockStories.length > 0;
  
  const handleSave = () => {
    onSave(results);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Extracted Rankings</h3>
        <Button onClick={handleSave} disabled={saving || results.length === 0}>
          {saving ? 'Saving...' : 'Save Rankings'}
        </Button>
      </div>
      
      {hasMockStories && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-amber-700">
            <strong>Note:</strong> {mockStories.length} stories were not found in the database. 
            These stories (highlighted in yellow) will be displayed but not saved.
          </p>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Story ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {onRemoveItem && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, index) => (
              <RankingResultItem
                key={result.storyId}
                storyId={result.storyId}
                title={result.title}
                currentRank={result.currentRank}
                previousRank={result.previousRank}
                isMockStory={result.storyId.startsWith('mock-')}
                onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
