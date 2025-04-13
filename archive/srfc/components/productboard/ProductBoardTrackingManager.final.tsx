import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { extractAndSyncRankings } from '../../lib/productBoardRankingExtractor.updated';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { 
  TrashIcon, 
  ArrowPathIcon, 
  DocumentMagnifyingGlassIcon, 
  KeyIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductBoardTrackedBoard } from '../../types/database';
import { PreviewImportModal } from './PreviewImportModal';
import { TokenCaptureModal } from './TokenCaptureModal';

interface RankingItem {
  storyId: string;
  rank: number;
  adoId?: string;
  name?: string;
}

interface ProductBoardCredentials {
  id: string;
  workspace_id: string;
  username: string;
  password: string;
  scraping_api_key?: string;
  scraping_service?: string;
  created_at: string;
  updated_at: string;
}

export function ProductBoardTrackingManager() {
  const { currentWorkspace } = useWorkspace();
  const [boards, setBoards] = useState<ProductBoardTrackedBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [previewing, setPreviewing] = useState<Record<string, boolean>>({});
  const [refreshingTokens, setRefreshingTokens] = useState<Record<string, boolean>>({});
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardId, setNewBoardId] = useState('');
  const [newBoardUrl, setNewBoardUrl] = useState('');
  const [addingBoard, setAddingBoard] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBoard, setPreviewBoard] = useState<ProductBoardTrackedBoard | null>(null);
  const [previewRankings, setPreviewRankings] = useState<RankingItem[]>([]);
  const [previewError, setPreviewError] = useState<string | undefined>(undefined);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Scraping API state
  const [credentials, setCredentials] = useState<ProductBoardCredentials | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [scrapingApiKey, setScrapingApiKey] = useState('');
  const [scrapingService, setScrapingService] = useState('apify');
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [testingApiKey, setTestingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  
  // Token capture state
  const [capturingToken, setCapturingToken] = useState(false);
  const [selectedBoardForTokens, setSelectedBoardForTokens] = useState<ProductBoardTrackedBoard | null>(null);
  const [tokenCaptureModalOpen, setTokenCaptureModalOpen] = useState(false);
  const [tokens, setTokens] = useState<Record<string, { validUntil: string, lastUsed: string, isValid: boolean }>>({});
  const [loadingTokens, setLoadingTokens] = useState(false);
  
  // Use the same hardcoded workspace ID as in AdminPanel.tsx
  const workspaceId = '6f171cbd-8b15-4779-b4fc-4092649e70d1';
  
  useEffect(() => {
    loadBoards();
    loadCredentials();
  }, []);
  
  // Set default API key from the URL hash if present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#apikey=')) {
      const apiKey = hash.substring(8);
      setScrapingApiKey(apiKey);
      // Clear the hash to avoid exposing the API key
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  
  const loadBoards = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as SupabaseClient)
        .from('productboard_tracked_boards')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('board_name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setBoards(data || []);
    } catch (error: any) {
      console.error('Error loading boards:', error);
      toast.error(`Failed to load boards: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const loadCredentials = async () => {
    setLoadingCredentials(true);
    try {
      const { data, error } = await (supabase as SupabaseClient)
        .from('productboard_ui_credentials')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No credentials found, that's okay
          setCredentials(null);
        } else {
          throw error;
        }
      } else {
        setCredentials(data);
        setScrapingApiKey(data.scraping_api_key || '');
        setScrapingService(data.scraping_service || 'apify');
        // If there's an API key, assume it's valid until tested
        setApiKeyValid(data.scraping_api_key ? true : null);
      }
    } catch (error: any) {
      console.error('Error loading credentials:', error);
      toast.error(`Failed to load credentials: ${error.message}`);
    } finally {
      setLoadingCredentials(false);
    }
  };
  
  const handleAddBoard = async () => {
    if (!newBoardName || !newBoardId || !newBoardUrl) {
      toast.error('All fields are required');
      return;
    }
    
    setAddingBoard(true);
    
    try {
      const { error } = await (supabase as SupabaseClient)
        .from('productboard_tracked_boards')
        .insert({
          workspace_id: workspaceId,
          board_id: newBoardId,
          board_name: newBoardName,
          board_url: newBoardUrl,
          sync_enabled: true
        });
      
      if (error) {
        throw error;
      }
      
      toast.success('Board added successfully');
      setNewBoardName('');
      setNewBoardId('');
      setNewBoardUrl('');
      loadBoards();
    } catch (error: any) {
      console.error('Error adding board:', error);
      toast.error(`Failed to add board: ${error.message}`);
    } finally {
      setAddingBoard(false);
    }
  };
  
  const handleToggleSync = async (board: ProductBoardTrackedBoard) => {
    try {
      const { error } = await (supabase as SupabaseClient)
        .from('productboard_tracked_boards')
        .update({
          sync_enabled: !board.sync_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', board.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setBoards(boards.map(b => 
        b.id === board.id ? { ...b, sync_enabled: !board.sync_enabled } : b
      ));
      
      toast.success(`Board ${!board.sync_enabled ? 'enabled' : 'disabled'} for sync`);
    } catch (error: any) {
      console.error('Error toggling sync:', error);
      toast.error(`Failed to update board: ${error.message}`);
    }
  };
  
  const handleDeleteBoard = async (board: ProductBoardTrackedBoard) => {
    if (!confirm(`Are you sure you want to delete "${board.board_name}"?`)) {
      return;
    }
    
    try {
      const { error } = await (supabase as SupabaseClient)
        .from('productboard_tracked_boards')
        .delete()
        .eq('id', board.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setBoards(boards.filter(b => b.id !== board.id));
      
      toast.success('Board deleted successfully');
    } catch (error: any) {
      console.error('Error deleting board:', error);
      toast.error(`Failed to delete board: ${error.message}`);
    }
  };

  // Modified to use our new utility
  const handlePreviewBoard = async (board: ProductBoardTrackedBoard) => {
    // Set previewing state for this board
    setPreviewing(prev => ({ ...prev, [board.id]: true }));
    setPreviewBoard(board);
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    setPreviewError(undefined);
    setPreviewRankings([]);
    
    try {
      // Get preview data using our browser-based extraction
      const extractionResult = await extractAndSyncRankings(
        workspaceId,
        board.board_id,
        board.board_url,
        false, // Don't sync to ADO for preview
        true // Preview mode - don't store in database
      );
      
      if (!extractionResult.success || !extractionResult.rankings) {
        throw new Error(extractionResult.message || 'Failed to preview rankings');
      }
      
      // Transform rankings for preview
      const rankings = extractionResult.rankings;
      
      setPreviewRankings(
        rankings.map((item: any) => ({
          storyId: item.storyId,
          rank: item.rank,
          adoId: item.matchingId || undefined,
          name: item.name || undefined
        }))
      );
    } catch (error: any) {
      console.error('Error previewing board:', error);
      setPreviewError(error.message);
    } finally {
      // Clear previewing state for this board
      setPreviewing(prev => ({ ...prev, [board.id]: false }));
      setPreviewLoading(false);
    }
  };
  
  // Modified to use our new utility
  const handleSyncBoard = async (board: ProductBoardTrackedBoard) => {
    // Set syncing state for this board
    setSyncing(prev => ({ ...prev, [board.id]: true }));
    
    try {
      // Use our new token-based extraction implementation
      const result = await extractAndSyncRankings(
        workspaceId,
        board.board_id,
        board.board_url,
        true // Sync to ADO
      );
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to sync board');
      }
      
      // Show success message
      const newItemCount = result.newItems || 0;
      const updatedItemCount = result.updatedItems || 0;
      toast.success(`Synced ${newItemCount + updatedItemCount} items from "${board.board_name}"`);
      
      // Refresh the boards list to update last_synced_at
      loadBoards();
    } catch (error: any) {
      console.error('Error syncing board:', error);
      toast.error(`Failed to sync board: ${error.message}`);
    } finally {
      // Clear syncing state for this board
      setSyncing(prev => ({ ...prev, [board.id]: false }));
    }
  };
  
  // Function to test the Scraping API key
  const testScrapingApiKey = async () => {
    if (!scrapingApiKey) {
      toast.error('Please enter an API key to test');
      return;
    }
    
    setTestingApiKey(true);
    setApiKeyValid(null);
    setApiKeyError(null);
    
    try {
      // First try the test-scraping-api function
      // Use a dummy board ID for testing
      const testBoardId = 'test-api-key';
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-token-validity`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workspaceId,
            boardId: testBoardId
          })
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to call function');
      }
      
      if (data.success) {
        setApiKeyValid(true);
        toast.success('API key is valid');
      } else {
        setApiKeyValid(false);
        setApiKeyError(data.error || 'API key is invalid');
        toast.error(`API key is invalid: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error testing API key:', error);
      setApiKeyValid(false);
      setApiKeyError(error.message);
      toast.error(`Failed to test API key: ${error.message}`);
    } finally {
      setTestingApiKey(false);
    }
  };
  
  // Function to save the Scraping API key
  const saveScrapingApiKey = async () => {
    setSavingApiKey(true);
    
    try {
      // Check if credentials exist
      if (credentials) {
        // Update existing credentials
        const { error } = await (supabase as SupabaseClient)
          .from('productboard_ui_credentials')
          .update({
            scraping_api_key: scrapingApiKey,
            scraping_service: scrapingService,
            updated_at: new Date().toISOString()
          })
          .eq('id', credentials.id);
        
        if (error) {
          throw error;
        }
      } else {
        // Create new credentials
        const { error } = await (supabase as SupabaseClient)
          .from('productboard_ui_credentials')
          .insert({
            workspace_id: workspaceId,
            scraping_api_key: scrapingApiKey,
            scraping_service: scrapingService,
            username: '', // These are required but will be filled in later
            password: ''
          });
        
        if (error) {
          throw error;
        }
      }
      
      toast.success('API key saved successfully');
      loadCredentials(); // Reload credentials to get the updated data
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast.error(`Failed to save API key: ${error.message}`);
    } finally {
      setSavingApiKey(false);
    }
  };
  
  // Function to manually refresh tokens using Apify
  const handleRefreshTokens = async (board: ProductBoardTrackedBoard) => {
    setRefreshingTokens(prev => ({ ...prev, [board.id]: true }));
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scheduled-token-refresh`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            boardId: board.board_id,
            workspaceId: workspaceId,
            singleBoard: true
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh tokens');
      }
      
      const result = await response.json();
      
      if (result.successful > 0) {
        toast.success(`Token refresh completed successfully for ${board.board_name}`);
      } else if (result.processed === 0) {
        toast.info(`No token refresh needed for ${board.board_name} at this time`);
      } else {
        toast.error(`Failed to refresh token for ${board.board_name}: ${result.results?.[0]?.error || 'Unknown error'}`);
      }
      
      // Update token status
      loadTokenStatus(board.id);
    } catch (error: any) {
      console.error('Error refreshing tokens:', error);
      toast.error(`Failed to refresh tokens: ${error.message}`);
    } finally {
      setRefreshingTokens(prev => ({ ...prev, [board.id]: false }));
    }
  };
  
  // Function to check token status for a board
  const loadTokenStatus = async (boardId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-token-validity`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId,
            boardId
          }),
        }
      );
      
      if (!response.ok) {
        if (response.status !== 404) { // 404 is expected if no token exists
          throw new Error(`Failed to check token status: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      
      if (data && typeof data.isValid !== 'undefined') {
        setTokens(prev => ({
          ...prev,
          [boardId]: {
            isValid: data.isValid,
            validUntil: data.expiresAt || '',
            lastUsed: data.lastUsedAt || ''
          }
        }));
      }
    } catch (error: any) {
      console.error('Error checking token status:', error);
    }
  };
  
  // Load token status for all boards on component mount
  useEffect(() => {
    if (boards.length > 0) {
      setLoadingTokens(true);
      Promise.all(boards.map(board => loadTokenStatus(board.id)))
        .finally(() => setLoadingTokens(false));
    }
  }, [boards]);
  
  return (
    <>
      <PreviewImportModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        boardName={previewBoard?.board_name || ''}
        rankings={previewRankings}
        loading={previewLoading}
        error={previewError}
      />
      
      {/* Token Capture Modal */}
      <TokenCaptureModal
        isOpen={tokenCaptureModalOpen}
        onClose={() => setTokenCaptureModalOpen(false)}
        board={selectedBoardForTokens}
        workspaceId={workspaceId}
      />
      
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">ProductBoard Token Configuration</h2>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            Using Browser-Based Extraction
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Authentication tokens are required to extract rankings from ProductBoard. Use the Tokens button on each board to capture or refresh tokens.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                The new browser-based ranking extraction system is now active. This replaces the previous server-side extraction and doesn't require API keys.
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">ProductBoard Tracked Boards</h2>
        <p className="text-gray-600 mb-4">
          Add ProductBoard boards to track for story rankings. The system will extract rankings from these boards
          and update the corresponding Azure DevOps work items.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {boards.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Board Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Board ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Synced
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enabled
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {boards.map((board) => (
                      <tr key={board.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{board.board_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{board.board_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {board.last_synced_at 
                              ? new Date(board.last_synced_at).toLocaleString() 
                              : 'Never'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {tokens[board.id]?.isValid ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                {loadingTokens ? "Checking..." : "Invalid"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Switch
                            checked={board.sync_enabled}
                            onChange={() => handleToggleSync(board)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={() => handlePreviewBoard(board)}
                              variant="secondary"
                              size="sm"
                              disabled={previewing[board.id]}
                              className="inline-flex items-center"
                              title="Preview Import"
                            >
                              {previewing[board.id] ? (
                                <>
                                  <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-1 animate-pulse" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-1" />
                                  Preview
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedBoardForTokens(board);
                                setTokenCaptureModalOpen(true);
                              }}
                              variant="secondary"
                              size="sm"
                              disabled={capturingToken}
                              className="inline-flex items-center"
                              title="Capture authentication tokens"
                            >
                              <KeyIcon className="h-4 w-4 mr-1" />
                              Tokens
                            </Button>
                            <Button
                              onClick={() => handleSyncBoard(board)}
                              variant="secondary"
                              size="sm"
                              disabled={syncing[board.id]}
                              className="inline-flex items-center"
                            >
                              {syncing[board.id] ? (
                                <>
                                  <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                                  Sync Now
                                </>
                              )}
                            </Button>
                            <Link 
                              to={`/admin/productboard/rankings/${workspaceId}/${board.board_id}`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="View Rankings History"
                            >
                              <ChartBarIcon className="h-4 w-4 mr-1" />
                              Rankings
                            </Link>
                            
                            <div className="relative group">
                              <Button
                                onClick={() => window.open(board.board_url, '_blank')}
                                variant="secondary"
                                size="sm"
                                className="inline-flex items-center"
                                title="View Board"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Button>
                              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                View Board in ProductBoard
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDeleteBoard(board)}
                              variant="danger"
                              size="sm"
                              className="inline-flex items-center"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No boards added yet. Add a board below to start tracking.
              </div>
            )}
            
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Add New Board</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
