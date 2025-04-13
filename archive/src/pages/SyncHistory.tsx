import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function SyncHistory() {
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { syncRecords, loading: dbLoading } = useDatabase();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      loadSyncHistory();
    }
  }, [currentWorkspace]);

  const loadSyncHistory = async () => {
    if (!currentWorkspace) return;
    
    setLoading(true);
    try {
      const records = await syncRecords.getRecent(currentWorkspace.id, 50);
      setHistory(records);
    } catch (error) {
      console.error('Failed to load sync history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (workspaceLoading || dbLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="mt-2 text-lg font-medium text-gray-900">No Workspace Selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a workspace from the dropdown in the navigation bar to view sync history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Synchronization History</h1>
        <Button 
          className="inline-flex items-center"
          onClick={loadSyncHistory}
          disabled={loading}
        >
          {loading ? (
            <span className="mr-2 animate-spin">↻</span>
          ) : (
            <span className="mr-2">↻</span>
          )}
          Refresh
        </Button>
      </div>

      <Card className="bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto text-gray-400 text-xl font-bold my-2">SH</div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Sync History</h3>
            <p className="mt-1 text-sm text-gray-500">
              No synchronization records found for this workspace.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source → Target
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items Processed
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.sync_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status === 'success' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="font-bold mr-1">✓</span>
                          Success
                        </span>
                      ) : record.status === 'failed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <span className="font-bold mr-1">✗</span>
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <span className="font-bold mr-1">⟳</span>
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.sync_source} → {record.sync_target}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span>{record.items_processed} total</span>
                        <span className="text-xs text-gray-500">
                          {record.items_created} created, {record.items_updated} updated, {record.items_failed} failed
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(record.duration_ms / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0 text-blue-400 font-bold">
            i
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Synchronization history shows all data exchanges between ProductBoard and Azure DevOps.
              Successful syncs indicate data was properly transferred, while failures may require attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
