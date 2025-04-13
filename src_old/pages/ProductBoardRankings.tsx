import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductBoardItemRanking } from '../types/database';
import { Layout } from '../components/Layout';
import { ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { supabase as supabaseClient } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Component to display ProductBoard ranking data
const ProductBoardRankings: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId, boardId } = useParams<{ workspaceId: string, boardId: string }>();
  const supabase = supabaseClient as SupabaseClient;
  
  const [rankings, setRankings] = useState<ProductBoardItemRanking[]>([]);
  const [board, setBoard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [selectedSyncId, setSelectedSyncId] = useState<string | null>(null);
  const [changedOnly, setChangedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'current_rank', 
    direction: 'asc' 
  });
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  } | null>(null);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type, visible: true });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Fetch board details and sync history
  useEffect(() => {
    if (!workspaceId || !boardId) {
      console.log('Missing parameters:', { workspaceId, boardId });
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      console.log('Fetching data for workspace:', workspaceId, 'and board:', boardId);
      
      // Get board details
      const { data: boardData, error: boardError } = await supabase
        .from('productboard_tracked_boards')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('board_id', boardId)
        .single();
      
      if (boardError) {
        console.error('Board fetch error:', boardError);
        showToast(`Error loading board: ${boardError.message}`, 'error');
      } else {
        console.log('Board data retrieved:', boardData);
        setBoard(boardData);
      }
      
      // Get sync history - skip the board_id filter to see if any history exists
      const { data: syncData, error: syncError } = await supabase
        .from('productboard_sync_history')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (syncError) {
        console.error('Sync history fetch error:', syncError);
        showToast(`Error loading sync history: ${syncError.message}`, 'error');
      } else {
        console.log('Sync history retrieved:', syncData);
        setSyncHistory(syncData || []);
        if (syncData && syncData.length > 0) {
          console.log('Setting selected sync ID:', syncData[0].id);
          setSelectedSyncId(syncData[0].id);
        } else {
          console.log('No sync history found');
          // Fallback: Try to get rankings without sync_history_id filter
          fetchAllRankings();
        }
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [workspaceId, boardId, supabase]);
  
  // Fallback function to get all rankings for this board without sync history filter
  const fetchAllRankings = async () => {
    console.log('Attempting to fetch all rankings for this board without sync history filter');
    
    const { data, error } = await supabase
      .from('productboard_item_rankings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('board_id', boardId);
    
    if (error) {
      console.error('Error fetching all rankings:', error);
      showToast(`Error loading rankings: ${error.message}`, 'error');
    } else {
      console.log('Fetched rankings without sync filter:', data?.length || 0, 'records');
      if (data && data.length > 0) {
        setRankings(data);
        showToast(`Loaded ${data.length} rankings without sync history filter`, 'info');
      } else {
        console.log('No rankings found even without sync history filter');
      }
    }
  };
  
  // Fetch rankings when sync history ID changes
  useEffect(() => {
    if (!workspaceId || !boardId) {
      console.log('Missing parameters for rankings fetch');
      return;
    }
    
    if (!selectedSyncId) {
      console.log('No selected sync ID yet, skipping rankings fetch');
      return;
    }
    
    const fetchRankings = async () => {
      setIsLoading(true);
      console.log('Fetching rankings for sync ID:', selectedSyncId);
      
      // Get all rankings for the selected sync
      const { data, error } = await supabase
        .from('productboard_item_rankings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('board_id', boardId)
        .eq('sync_history_id', selectedSyncId);
      
      if (error) {
        console.error('Error loading rankings:', error);
        showToast(`Error loading rankings: ${error.message}`, 'error');
      } else {
        console.log('Rankings data retrieved:', data?.length || 0, 'records');
        setRankings(data || []);
        
        if (data && data.length === 0) {
          // If no rankings with this sync ID, try without sync ID filter
          console.log('No rankings found with this sync ID, trying without sync filter');
          const { data: allData, error: allError } = await supabase
            .from('productboard_item_rankings')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('board_id', boardId);
            
          if (allError) {
            console.error('Error loading all rankings:', allError);
          } else {
            console.log('All rankings retrieved:', allData?.length || 0, 'records');
            if (allData && allData.length > 0) {
              setRankings(allData);
              showToast(`Found ${allData.length} rankings without sync filter`, 'info');
            }
          }
        }
      }
      
      setIsLoading(false);
    };
    
    fetchRankings();
  }, [workspaceId, boardId, selectedSyncId, supabase]);
  
  // Sync rankings to ADO
  const syncToAdo = async () => {
    if (!workspaceId || !boardId) return;
    
    try {
      setIsLoading(true);
      
      // Get the API key
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, pb_api_key')
        .eq('id', workspaceId)
        .single();
      
      if (workspaceError || !workspace) {
        throw new Error(`Failed to get workspace: ${workspaceError?.message || 'Workspace not found'}`);
      }
      
      // Call the sync-productboard-rankings function with sync_to_ado=true
      const { data, error } = await supabase.functions.invoke('sync-productboard-rankings', {
        body: {
          workspace_id: workspaceId,
          board_id: boardId,
          scraping_api_key: workspace.pb_api_key,
          scraping_service: 'token',
          sync_to_ado: true
        }
      });
      
      if (error) {
        throw new Error(`Sync failed: ${error.message}`);
      }
      
      showToast(`Rankings synced to Azure DevOps: ${data.updatedCount || 0} work items updated`, 'success');
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      showToast(`Sync failed: ${error instanceof Error ? error.message : 'An error occurred'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Extract rankings with preview
  const extractRankings = async () => {
    if (!workspaceId || !boardId) return;
    
    try {
      setIsLoading(true);
      
      // Get the API key
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, pb_api_key')
        .eq('id', workspaceId)
        .single();
      
      if (workspaceError || !workspace) {
        throw new Error(`Failed to get workspace: ${workspaceError?.message || 'Workspace not found'}`);
      }
      
      // Call the sync-productboard-rankings function with sync_to_ado=false
      const { data, error } = await supabase.functions.invoke('sync-productboard-rankings', {
        body: {
          workspace_id: workspaceId,
          board_id: boardId,
          scraping_api_key: workspace.pb_api_key,
          scraping_service: 'token',
          sync_to_ado: false
        }
      });
      
      if (error) {
        throw new Error(`Extraction failed: ${error.message}`);
      }
      
      showToast(`Rankings extracted successfully: ${data.rankingResult?.newItems || 0} new items and ${data.rankingResult?.updatedItems || 0} changed items`, 'success');
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      showToast(`Extraction failed: ${error instanceof Error ? error.message : 'An error occurred'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sort
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Filter and sort rankings
  const filteredAndSortedRankings = React.useMemo(() => {
    let filteredItems = [...rankings];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        (item.story_id?.toLowerCase().includes(query) || 
         item.story_name?.toLowerCase().includes(query) ||
         item.matching_id?.toLowerCase().includes(query))
      );
    }
    
    // Apply changed only filter
    if (changedOnly) {
      filteredItems = filteredItems.filter(item => 
        item.previous_rank !== null && item.current_rank !== item.previous_rank
      );
    }
    
    // Apply sorting
    filteredItems.sort((a, b) => {
      // Default sorting by rank
      if (sortConfig.key === 'current_rank') {
        return sortConfig.direction === 'asc' 
          ? (a.current_rank || 0) - (b.current_rank || 0)
          : (b.current_rank || 0) - (a.current_rank || 0);
      } 
      
      // Sort by previous rank
      if (sortConfig.key === 'previous_rank') {
        // Handle null values
        if (a.previous_rank === null && b.previous_rank === null) return 0;
        if (a.previous_rank === null) return 1;
        if (b.previous_rank === null) return -1;
        
        return sortConfig.direction === 'asc' 
          ? (a.previous_rank || 0) - (b.previous_rank || 0)
          : (b.previous_rank || 0) - (a.previous_rank || 0);
      }
      
      // Sort by story ID
      if (sortConfig.key === 'story_id') {
        if (!a.story_id) return 1;
        if (!b.story_id) return -1;
        
        return sortConfig.direction === 'asc' 
          ? a.story_id.localeCompare(b.story_id)
          : b.story_id.localeCompare(a.story_id);
      }
      
      // Sort by name
      if (sortConfig.key === 'story_name') {
        if (!a.story_name) return 1;
        if (!b.story_name) return -1;
        
        return sortConfig.direction === 'asc' 
          ? a.story_name.localeCompare(b.story_name)
          : b.story_name.localeCompare(a.story_name);
      }
      
      // Sort by change
      if (sortConfig.key === 'change') {
        // Calculate changes
        const aChange = a.previous_rank !== null 
          ? Math.abs((a.current_rank || 0) - (a.previous_rank || 0))
          : -1;
        const bChange = b.previous_rank !== null 
          ? Math.abs((b.current_rank || 0) - (b.previous_rank || 0))
          : -1;
        
        // Handle new items (no previous rank)
        if (aChange === -1 && bChange === -1) return 0;
        if (aChange === -1) return 1;
        if (bChange === -1) return -1;
        
        return sortConfig.direction === 'asc' 
          ? aChange - bChange
          : bChange - aChange;
      }
      
      return 0;
    });
    
    return filteredItems;
  }, [rankings, sortConfig, searchQuery, changedOnly]);
  
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 inline-block ml-1" />
      : <ArrowDownIcon className="h-4 w-4 inline-block ml-1" />;
  };
  
  // Calculate statistics
  const stats = React.useMemo(() => {
    let newItems = 0;
    let changedItems = 0;
    let unchangedItems = 0;
    
    rankings.forEach(item => {
      if (item.previous_rank === null) {
        newItems++;
      } else if (item.current_rank !== item.previous_rank) {
        changedItems++;
      } else {
        unchangedItems++;
      }
    });
    
    return { newItems, changedItems, unchangedItems, total: rankings.length };
  }, [rankings]);
  
  // Direction badge helper 
  const getChangeBadge = (current: number | undefined, previous: number | null) => {
    if (current === undefined) return null;
    if (previous === null) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">New</span>;
    }
    
    if (current === previous) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">No Change</span>;
    }
    
    if (current < previous) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Up {previous - current} ↑</span>;
    }
    
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">Down {current - previous} ↓</span>;
  };
  
  return (
    <div>
      <div className="p-5">
        {/* Toast message */}
        {toastMessage && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-md shadow-md z-50 ${
            toastMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            toastMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {toastMessage.message}
          </div>
        )}
      
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ProductBoard Rankings</h1>
            {board && (
              <p className="text-md text-gray-600">
                {board.board_name} ({board.board_id})
              </p>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              onClick={extractRankings}
              disabled={isLoading}
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Extract Latest Rankings
            </button>
            
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={syncToAdo}
              disabled={isLoading || rankings.length === 0}
            >
              Sync to Azure DevOps
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="p-3 bg-gray-50 rounded-md shadow-sm">
            <p className="font-bold">Total Items</p>
            <p className="text-xl">{stats.total}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-md shadow-sm">
            <p className="font-bold">New Items</p>
            <p className="text-xl text-purple-500">{stats.newItems}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-md shadow-sm">
            <p className="font-bold">Changed Items</p>
            <p className="text-xl text-orange-500">{stats.changedItems}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md shadow-sm">
            <p className="font-bold">Unchanged Items</p>
            <p className="text-xl text-gray-500">{stats.unchangedItems}</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex mb-5 gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-64">
            <select 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={selectedSyncId || ''}
              onChange={(e) => setSelectedSyncId(e.target.value)}
            >
              <option value="">Select sync history</option>
              {syncHistory.map(sync => (
                <option key={sync.id} value={sync.id}>
                  {new Date(sync.created_at).toLocaleString()} ({sync.item_count} items)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <button 
              className={`px-4 py-2 border rounded-md text-sm font-medium ${
                changedOnly 
                  ? 'bg-orange-100 text-orange-800 border-orange-200' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setChangedOnly(!changedOnly)}
            >
              Changed Items Only
            </button>
          </div>
        </div>
        
        {/* Data Table */}
        {isLoading ? (
          <div className="flex justify-center p-10">
            <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('story_id')}
                  >
                    Story ID {getSortIcon('story_id')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('story_name')}
                  >
                    Name {getSortIcon('story_name')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('current_rank')}
                  >
                    Current Rank {getSortIcon('current_rank')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('previous_rank')}
                  >
                    Previous Rank {getSortIcon('previous_rank')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('change')}
                  >
                    Change {getSortIcon('change')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matching ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ADO Sync Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedRankings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No rankings found
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRankings.map(ranking => (
                    <tr key={ranking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {ranking.story_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={ranking.story_name}>
                        {ranking.story_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {ranking.current_rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {ranking.previous_rank ?? '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getChangeBadge(
                          ranking.current_rank || 0, 
                          ranking.previous_rank === undefined ? null : ranking.previous_rank
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {ranking.matching_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ranking.is_synced_to_ado ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not synced
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductBoardRankings;
