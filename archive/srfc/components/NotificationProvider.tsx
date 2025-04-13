import React, { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { supabase } from '../lib/supabase';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (!currentWorkspace) return;

    // Subscribe to sync logs
    const syncLogsChannel = supabase
      .channel('sync-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sync_logs',
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        (payload) => {
          const { action, status, error_message } = payload.new;
          
          if (status === 'completed') {
            toast.success(`Sync ${action} completed successfully`);
          } else if (status === 'failed') {
            toast.error(`Sync ${action} failed: ${error_message}`);
          }
        }
      )
      .subscribe();

    // Subscribe to story changes
    const storiesChannel = supabase
      .channel('stories')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const { sync_status: newStatus } = payload.new;
            const { sync_status: oldStatus } = payload.old;

            if (newStatus !== oldStatus) {
              if (newStatus === 'conflict') {
                toast.error('Sync conflict detected', {
                  description: 'Please review and resolve the conflict',
                });
              } else if (newStatus === 'synced') {
                toast.success('Story synced successfully');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(syncLogsChannel);
      supabase.removeChannel(storiesChannel);
    };
  }, [currentWorkspace]);

  return (
    <>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
      />
      {children}
    </>
  );
}