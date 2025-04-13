import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { createProductBoardHierarchySyncService, SyncResult } from '../../lib/services/ProductBoardHierarchySyncService';
import { supabase } from '../../lib/supabase';

interface SyncStatusProps {
  syncResult: SyncResult | null;
  isLoading: boolean;
}

// Status indicator component
const SyncStatus: React.FC<SyncStatusProps> = ({ syncResult, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
        <span className="text-sm text-gray-600">Syncing in progress...</span>
      </div>
    );
  }

  if (!syncResult) {
    return (
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-gray-300 mr-2"></div>
        <span className="text-sm text-gray-600">Not synced yet</span>
      </div>
    );
  }

  if (syncResult.status === 'failed') {
    return (
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
        <span className="text-sm text-red-600">
          Sync failed: {syncResult.error || 'Unknown error'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
      <span className="text-sm text-gray-600">
        Last synced: {new Date(syncResult.completedAt || syncResult.startedAt).toLocaleString()}
      </span>
    </div>
  );
};

// Stats display component
const SyncStats: React.FC<{ syncResult: SyncResult | null }> = ({ syncResult }) => {
  if (!syncResult || syncResult.status === 'failed') {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-2xl font-bold">{syncResult.productsCount}</div>
        <div className="text-xs uppercase text-gray-500">Products</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-2xl font-bold">{syncResult.componentsCount}</div>
        <div className="text-xs uppercase text-gray-500">Components</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-2xl font-bold">{syncResult.initiativesCount}</div>
        <div className="text-xs uppercase text-gray-500">Initiatives</div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-2xl font-bold">{syncResult.featuresCount}</div>
        <div className="text-xs uppercase text-gray-500">Features</div>
      </div>
    </div>
  );
};

// Main component
const ProductBoardHierarchyManager: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [syncOptions, setSyncOptions] = useState({
    includeFeatures: true,
    includeComponents: true,
    includeInitiatives: true,
    maxDepth: 5,
  });

  // Create the service instance
  const syncService = createProductBoardHierarchySyncService();

  // Load initial state
  useEffect(() => {
    if (!currentWorkspace?.id) return;
    
    // Get latest sync status
    const loadSyncStatus = async () => {
      const result = await syncService.getLatestSyncHistory(currentWorkspace.id);
      setSyncResult(result);
    };
    
    // Get ProductBoard API key if it exists
    const loadApiKey = async () => {
      const { data, error } = await supabase
        .from('configurations')
        .select('productboard_api_key')
        .eq('workspace_id', currentWorkspace.id)
        .single();
        
      if (!error && data?.productboard_api_key) {
        setApiKey(data.productboard_api_key);
      }
    };
    
    loadSyncStatus();
    loadApiKey();
  }, [currentWorkspace?.id, supabase]);

  // Handle sync button click
  const handleSync = async () => {
    if (!currentWorkspace?.id || !apiKey || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await syncService.startSync({
        workspaceId: currentWorkspace.id,
        productboardApiKey: apiKey,
        ...syncOptions,
      });
      
      setSyncResult(result);
    } catch (error) {
      console.error('Error syncing ProductBoard hierarchy:', error);
      setSyncResult({
        syncId: 'error',
        status: 'failed',
        productsCount: 0,
        componentsCount: 0,
        featuresCount: 0,
        initiativesCount: 0,
        initiativeFeaturesCount: 0,
        componentInitiativesCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        startedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle API key change
  const handleApiKeyChange = async (value: string) => {
    setApiKey(value);
    
    // Save the API key if we have a workspace
    if (currentWorkspace?.id) {
      await supabase
        .from('configurations')
        .upsert({
          workspace_id: currentWorkspace.id,
          productboard_api_key: value,
          // Assuming these fields are required and we need to provide defaults
          // for upsert to work correctly
          openai_api_key: null,
          slack_api_key: null,
          slack_channel_id: null,
          google_spaces_webhook_url: null,
          ado_api_key: null,
          ado_organization: null,
          ado_project_id: null,
          field_propagation_enabled: false,
          epic_to_feature_rules: {},
          feature_to_story_rules: {},
          risk_threshold_days: 30,
        });
    }
  };

  // Handle option changes
  const handleOptionChange = (option: keyof typeof syncOptions, value: any) => {
    setSyncOptions(prev => ({
      ...prev,
      [option]: value,
    }));
  };

  // No workspace selected
  if (!currentWorkspace) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Please select a workspace to manage ProductBoard hierarchy.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">ProductBoard Hierarchy</h2>
      
      <div className="mb-6">
        <SyncStatus syncResult={syncResult} isLoading={isLoading} />
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          ProductBoard API Key
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            className="flex-1 p-2 border rounded-md"
            placeholder="Enter ProductBoard API key"
          />
          <button
            onClick={handleSync}
            disabled={isLoading || !apiKey}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>
      
      <SyncStats syncResult={syncResult} />
      
      <div className="mt-4">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
        >
          <span>{advancedOpen ? 'Hide' : 'Show'} Advanced Options</span>
          <svg 
            className={`ml-1 h-4 w-4 transform ${advancedOpen ? 'rotate-180' : ''}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
              clipRule="evenodd"
            />
          </svg>
        </button>
        
        {advancedOpen && (
          <div className="mt-2 p-4 border rounded-md">
            <h3 className="font-medium mb-2">Sync Options</h3>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncOptions.includeFeatures}
                  onChange={(e) => handleOptionChange('includeFeatures', e.target.checked)}
                  className="mr-2"
                />
                <span>Include Features</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncOptions.includeComponents}
                  onChange={(e) => handleOptionChange('includeComponents', e.target.checked)}
                  className="mr-2"
                />
                <span>Include Components</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncOptions.includeInitiatives}
                  onChange={(e) => handleOptionChange('includeInitiatives', e.target.checked)}
                  className="mr-2"
                />
                <span>Include Initiatives</span>
              </label>
              
              <div>
                <label className="block mb-1">
                  <span>Maximum Feature Depth</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={syncOptions.maxDepth}
                  onChange={(e) => handleOptionChange('maxDepth', parseInt(e.target.value, 10))}
                  className="p-2 border rounded-md w-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controls how deep to traverse feature hierarchies (1-10)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductBoardHierarchyManager;
