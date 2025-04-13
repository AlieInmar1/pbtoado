import React, { useState, useCallback } from 'react';
import { StoriesTable } from '../components/StoriesTable';
import { Toolbar } from '../components/Toolbar';

export function StoryManagement() {
  const [selectedCount, setSelectedCount] = useState(0);
  const [archiveHandler, setArchiveHandler] = useState<() => Promise<void>>(() => Promise.resolve());

  // Memoize the onSelectionChange callback to prevent infinite re-renders
  const handleSelectionChange = useCallback((count: number, handler: () => Promise<void>) => {
    setSelectedCount(count);
    setArchiveHandler(() => handler);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Story Management</h1>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="p-4">
          <Toolbar
            selectedCount={selectedCount}
            onArchiveSelected={archiveHandler}
          />
          <StoriesTable
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </div>
    </div>
  );
}
