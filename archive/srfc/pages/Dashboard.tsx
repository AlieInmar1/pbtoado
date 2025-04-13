import React, { useState, useCallback } from 'react';
import { StoriesTable } from '../components/StoriesTable';
import { Toolbar } from '../components/Toolbar';
import { AIAssistant } from '../components/AIAssistant';
import { GroomingAssistant } from '../components/GroomingAssistant';

export function Dashboard() {
  const [selectedCount, setSelectedCount] = useState(0);
  const [archiveHandler, setArchiveHandler] = useState<() => Promise<void>>(() => Promise.resolve());

  // Memoize the onSelectionChange callback to prevent infinite re-renders
  const handleSelectionChange = useCallback((count: number, handler: () => Promise<void>) => {
    setSelectedCount(count);
    setArchiveHandler(() => handler);
  }, []);

  return (
    <div className="relative">
      <div className="p-4">
        <Toolbar
          selectedCount={selectedCount}
          onArchiveSelected={archiveHandler}
        />
        <StoriesTable
          onSelectionChange={handleSelectionChange}
        />
      </div>
      <div className="fixed bottom-8 right-8 z-50">
        <AIAssistant />
      </div>
    </div>
  );
}
