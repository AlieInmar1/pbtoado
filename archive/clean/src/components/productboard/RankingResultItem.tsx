import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export interface RankingResultItemProps {
  storyId: string;
  title: string;
  currentRank: number;
  previousRank: number | null;
  isMockStory?: boolean;
  onRemove?: () => void;
}

export function RankingResultItem({ 
  storyId, 
  title, 
  currentRank, 
  previousRank,
  isMockStory = false,
  onRemove
}: RankingResultItemProps) {
  const change = previousRank !== null ? previousRank - currentRank : null;
  
  return (
    <tr className={isMockStory ? 'bg-yellow-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {currentRank}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isMockStory ? (
          <span title="This ID was extracted from the image but not found in the database">
            {storyId.split('-')[1]}
          </span>
        ) : (
          storyId
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {title}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {change !== null ? (
          <span className={`flex items-center ${
            change > 0 ? 'text-green-600' : 
            change < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {change > 0 ? (
              <ArrowUpIcon className="h-4 w-4 mr-1" />
            ) : change < 0 ? (
              <ArrowDownIcon className="h-4 w-4 mr-1" />
            ) : null}
            {change === 0 ? 'No change' : Math.abs(change)}
          </span>
        ) : (
          'New'
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isMockStory ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Not in DB
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            In Database
          </span>
        )}
      </td>
      {onRemove && (
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={onRemove}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Remove
          </button>
        </td>
      )}
    </tr>
  );
}
