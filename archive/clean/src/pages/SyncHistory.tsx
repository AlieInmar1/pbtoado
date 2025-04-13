import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { 
  DataTable, 
  DataTableHeader, 
  DataTableBody, 
  DataTableRow, 
  DataTableCell 
} from '../components/ui/DataTable';

interface SyncRecord {
  id: string;
  created_at: string;
  sync_type: string;
  status: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_message: string | null;
  sync_source: string;
  sync_target: string;
  duration_ms: number;
  workspace_id: string;
}

export function SyncHistory() {
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSyncHistory() {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('sync_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (error) {
          throw new Error(error.message);
        }
        
        setSyncRecords(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sync history');
        console.error('Error fetching sync history:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSyncHistory();
  }, []);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function getSyncStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-indigo-500" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Synchronization History</h1>
      </div>
      
      <Card className="rounded-md shadow">
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableCell header>Date</DataTableCell>
              <DataTableCell header>Type</DataTableCell>
              <DataTableCell header>Source → Target</DataTableCell>
              <DataTableCell header>Status</DataTableCell>
              <DataTableCell header>Items</DataTableCell>
              <DataTableCell header>Duration</DataTableCell>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {syncRecords.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={6} className="text-center">
                  No synchronization records found
                </DataTableCell>
              </DataTableRow>
            ) : (
              syncRecords.map((record) => (
                <DataTableRow key={record.id}>
                  <DataTableCell className="text-gray-500">
                    {formatDate(record.created_at)}
                  </DataTableCell>
                  <DataTableCell className="text-gray-900">
                    {record.sync_type}
                  </DataTableCell>
                  <DataTableCell className="text-gray-500">
                    {record.sync_source} → {record.sync_target}
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge 
                      status={record.status.toLowerCase() === 'success' ? 'success' : 
                             record.status.toLowerCase() === 'failed' ? 'error' :
                             record.status.toLowerCase() === 'in_progress' ? 'info' :
                             record.status.toLowerCase() === 'partial' ? 'warning' : 'pending'}
                      text={record.status}
                    />
                  </DataTableCell>
                  <DataTableCell className="text-gray-500">
                    {record.items_processed} processed
                    {record.items_failed > 0 && (
                      <span className="text-red-500 ml-1">
                        ({record.items_failed} failed)
                      </span>
                    )}
                  </DataTableCell>
                  <DataTableCell className="text-gray-500">
                    {formatDuration(record.duration_ms)}
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </Card>
    </div>
  );
}
