import React from 'react';
import { Button } from './ui/Button';
import { ArrowPathIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

interface ToolbarProps {
  selectedCount: number;
  onArchiveSelected: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export function Toolbar({ selectedCount, onArchiveSelected, onRefresh }: ToolbarProps) {
  return (
    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md mb-4">
      <div className="flex items-center space-x-4">
        {onRefresh && (
          <Button
            variant="secondary"
            onClick={onRefresh}
            className="inline-flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
        
        <span className="text-sm text-gray-500">
          {selectedCount > 0 
            ? `${selectedCount} item${selectedCount === 1 ? '' : 's'} selected` 
            : 'No items selected'}
        </span>
      </div>
      
      <div>
        <Button
          variant="danger"
          onClick={onArchiveSelected}
          disabled={selectedCount === 0}
          className="inline-flex items-center"
        >
          <ArchiveBoxIcon className="h-4 w-4 mr-2" />
          Archive Selected
        </Button>
      </div>
    </div>
  );
}
