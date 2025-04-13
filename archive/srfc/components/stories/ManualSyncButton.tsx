import React, { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { Story } from '../../types/database';

interface ManualSyncButtonProps {
  story: Story;
  onSync: () => void;
}

export function ManualSyncButton({ story, onSync }: ManualSyncButtonProps) {
  const { currentWorkspace } = useWorkspace();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!currentWorkspace) return;

    setSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-story`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storyId: story.id,
            direction: 'bidirectional',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      toast.success('Story sync started');
      onSync();
    } catch (error) {
      console.error('Error syncing story:', error);
      toast.error('Failed to sync story');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      <ArrowPathIcon
        className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`}
      />
      {syncing ? 'Syncing...' : 'Sync'}
    </button>
  );
}