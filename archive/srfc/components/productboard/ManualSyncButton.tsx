import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useDatabase } from '../../contexts/DatabaseContext';

interface ManualSyncButtonProps {
  workspaceId: string;
  direction?: 'push' | 'pull' | 'both';
  onSyncComplete?: () => void;
}

export function ManualSyncButton({
  workspaceId,
  direction = 'pull',
  onSyncComplete
}: ManualSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { db } = useDatabase();

  const handleSync = async () => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-stories`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId,
            direction,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync with ProductBoard');
      }
      
      toast.success(`Successfully synced with ProductBoard (${direction})`);
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync with ProductBoard');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      {isSyncing ? (
        <>
          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Sync {direction === 'push' ? 'to' : direction === 'pull' ? 'from' : 'with'} ProductBoard
        </>
      )}
    </button>
  );
}
