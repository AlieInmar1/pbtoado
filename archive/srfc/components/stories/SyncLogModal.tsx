import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import type { Story } from '../../types/database';

interface SyncLogModalProps {
  story: Story;
  onClose: () => void;
}

interface SyncLog {
  id: string;
  direction: string;
  status: string;
  error_message: string | null;
  details: any;
  created_at: string;
  completed_at: string | null;
}

export function SyncLogModal({ story, onClose }: SyncLogModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [story.id, currentWorkspace]);

  async function loadLogs() {
    if (!currentWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('story_id', story.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Sync History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">Story: {story.pb_title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Last synced: {story.last_synced_at ? formatDate(story.last_synced_at) : 'Never'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading sync history...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No sync history available</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        {log.status === 'completed' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        ) : log.status === 'failed' ? (
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                        ) : null}
                        <span className="font-medium text-gray-900">
                          {log.direction === 'pb_to_ado'
                            ? 'Productboard → Azure DevOps'
                            : log.direction === 'ado_to_pb'
                            ? 'Azure DevOps → Productboard'
                            : 'Bidirectional Sync'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Started: {formatDate(log.created_at)}
                      </div>
                      {log.completed_at && (
                        <div className="text-sm text-gray-500">
                          Completed: {formatDate(log.completed_at)}
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  {log.error_message && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {log.error_message}
                    </div>
                  )}

                  {log.details && (
                    <div className="mt-2 text-sm text-gray-600">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}