import React, { useState } from 'react';
import { syncAllData } from '../../lib/api/azureDevOpsWithCacheProxy';

// Default values (we'll replace these with environment variables or settings from Supabase)
const DEFAULT_ORG = 'inmar';
const DEFAULT_PROJECT = 'Healthcare';
const DEFAULT_API_KEY = 'Aq2nR947X8QPHE5vCMT8RtdsGUudZtm41CLvITcJsb7dY3isf8loJQQJ99BDACAAAAAQLZitAAASAZDO1Jt4';

interface SyncButtonProps {
  className?: string;
  onSyncComplete?: (result: { success: boolean; message: string }) => void;
}

const AzureDevOpsSyncButton: React.FC<SyncButtonProps> = ({ 
  className = '', 
  onSyncComplete 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [forceFullSync, setForceFullSync] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await syncAllData(DEFAULT_ORG, DEFAULT_PROJECT, DEFAULT_API_KEY, forceFullSync);
      setSyncResult(result);
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = { 
        success: false, 
        message: `Error syncing Azure DevOps data: ${errorMessage}` 
      };
      setSyncResult(result);
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="forceFullSync"
          checked={forceFullSync}
          onChange={(e) => setForceFullSync(e.target.checked)}
          disabled={isSyncing}
          className="mr-2 h-4 w-4"
        />
        <label htmlFor="forceFullSync" className="text-sm">
          Force full sync (slower but more thorough)
        </label>
      </div>
      
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          isSyncing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSyncing ? 'Syncing...' : `${forceFullSync ? 'Full' : 'Incremental'} Sync Azure DevOps Data`}
      </button>
      
      {syncResult && (
        <div
          className={`mt-2 p-3 rounded text-sm ${
            syncResult.success
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {syncResult.message}
        </div>
      )}
    </div>
  );
};

export default AzureDevOpsSyncButton;
