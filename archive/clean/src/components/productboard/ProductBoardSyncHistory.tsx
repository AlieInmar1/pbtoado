import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductBoardSyncHistory as SyncHistoryType } from '../../types/database';

export function ProductBoardSyncHistory() {
  const { currentWorkspace } = useWorkspace();
  const [history, setHistory] = useState<SyncHistoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [boardNames, setBoardNames] = useState<Record<string, string>>({});
  
  // Use the same hardcoded workspace ID as in AdminPanel.tsx
  const workspaceId = '6f171cbd-8b15-4779-b4fc-4092649e70d1';
  
  useEffect(() => {
    loadHistory();
    loadBoardNames();
  }, []);
  
  const loadHistory = async () => {
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as SupabaseClient)
        .from('productboard_sync_history')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) {
        throw error;
      }
      
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading sync history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadBoardNames = async () => {
    try {
      const { data, error } = await (supabase as SupabaseClient)
        .from('productboard_tracked_boards')
        .select('board_id, board_name')
        .eq('workspace_id', workspaceId);
      
      if (error) {
        throw error;
      }
      
      const names: Record<string, string> = {};
      data?.forEach(board => {
        names[board.board_id] = board.board_name;
      });
      
      setBoardNames(names);
    } catch (error: any) {
      console.error('Error loading board names:', error);
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'In progress';
    
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationMs = end - start;
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${Math.round(durationMs / 1000)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.round((durationMs % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  };
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Sync History</h2>
        <Button 
          onClick={loadHistory} 
          variant="secondary"
          size="sm"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
      
      <p className="text-gray-600 mb-4">
        Recent synchronization operations between ProductBoard and Azure DevOps.
      </p>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Board
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stories Synced
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {boardNames[item.board_id] || item.board_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.stories_synced}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(item.started_at, item.completed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No sync history found. Try syncing a board first.
            </div>
          )}
        </>
      )}
    </Card>
  );
}
