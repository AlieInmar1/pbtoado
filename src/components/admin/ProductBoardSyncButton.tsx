import React, { useState } from 'react';
import { syncProductBoardData } from '../../lib/api/productBoard';

interface SyncButtonProps {
  className?: string;
  onSyncComplete?: (result: { success: boolean; message: string; stats?: any }) => void;
}

const ProductBoardSyncButton: React.FC<SyncButtonProps> = ({ 
  className = '', 
  onSyncComplete 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);
  const [forceFullSync, setForceFullSync] = useState(false);
  const [includeComponents, setIncludeComponents] = useState(true);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      // Call the syncProductBoardData function with options
      const result = await syncProductBoardData({
        reset: forceFullSync,
        resetTables: !includeComponents ? ['productboard_components'] : []
      });
      
      setSyncResult(result);
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = { 
        success: false, 
        message: `Error syncing ProductBoard data: ${errorMessage}` 
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
          Force full sync (clears existing data before syncing)
        </label>
      </div>
      
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="includeComponents"
          checked={includeComponents}
          onChange={(e) => setIncludeComponents(e.target.checked)}
          disabled={isSyncing}
          className="mr-2 h-4 w-4"
        />
        <label htmlFor="includeComponents" className="text-sm">
          Include components
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
        {isSyncing ? 'Syncing...' : `${forceFullSync ? 'Full' : 'Incremental'} Sync ProductBoard Data`}
      </button>
      
      {syncResult && (
        <div
          className={`mt-2 p-3 rounded text-sm ${
            syncResult.success
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          <div className="mb-2">{syncResult.message}</div>
          
          {syncResult.success && syncResult.stats && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white p-2 rounded border border-green-200">
                <div className="text-xs text-gray-500">Features</div>
                <div className="font-semibold">{syncResult.stats.features_count || 0}</div>
              </div>
              
              <div className="bg-white p-2 rounded border border-green-200">
                <div className="text-xs text-gray-500">Initiatives</div>
                <div className="font-semibold">{syncResult.stats.initiatives_count || 0}</div>
              </div>
              
              <div className="bg-white p-2 rounded border border-green-200">
                <div className="text-xs text-gray-500">Objectives</div>
                <div className="font-semibold">{syncResult.stats.objectives_count || 0}</div>
              </div>
              
              <div className="bg-white p-2 rounded border border-green-200">
                <div className="text-xs text-gray-500">Components</div>
                <div className="font-semibold">{syncResult.stats.components_count || 0}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductBoardSyncButton;
