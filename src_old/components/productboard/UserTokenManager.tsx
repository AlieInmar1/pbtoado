import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { 
  UserIcon, 
  KeyIcon, 
  ArrowPathIcon, 
  TrashIcon, 
  ClockIcon, 
  ChevronDownIcon, 
  ChevronUpIcon 
} from '@heroicons/react/24/outline';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TokenStatusBadge, TokenStatus } from './TokenStatusBadge';
import { TokenCaptureModal } from './TokenCaptureModal';
import type { ProductBoardTrackedBoard } from '../../types/database';

interface UserToken {
  id: string;
  user_id: string;
  user_email: string;
  workspace_id: string;
  board_id: string | null;
  board_name: string | null;
  expires_at: string;
  last_used_at: string | null;
  is_valid: boolean;
  shared_token: boolean;
  created_at: string;
  status?: TokenStatus;
  hours_until_expiry?: number | null;
}

interface BoardAccess {
  id: string;
  board_id: string;
  board_name: string;
  access_verified_at: string | null;
  use_shared_tokens: boolean;
}

export function UserTokenManager() {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [boards, setBoards] = useState<ProductBoardTrackedBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [tokenCaptureModalOpen, setTokenCaptureModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<ProductBoardTrackedBoard | null>(null);
  // Hardcoded workspace ID
  const workspaceId = '6f171cbd-8b15-4779-b4fc-4092649e70d1';

  useEffect(() => {
    loadUserTokens();
    loadBoards();
  }, []);

  const loadUserTokens = async () => {
    setLoading(true);
    try {
      // First load all tokens with user_id (shared tokens)
      const { data: userTokens, error: userTokensError } = await (supabase as SupabaseClient)
        .from('productboard_auth_tokens')
        .select('*')
        .eq('workspace_id', workspaceId)
        .not('user_id', 'is', null)
        .order('user_email', { ascending: true });
      
      if (userTokensError) {
        throw userTokensError;
      }

      // Process tokens to add status
      const processedTokens = userTokens.map(token => {
        const now = new Date();
        const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
        
        let status: TokenStatus = 'valid';
        let hoursUntilExpiry: number | null = null;
        
        if (expiresAt) {
          const diffMs = expiresAt.getTime() - now.getTime();
          hoursUntilExpiry = diffMs / (1000 * 60 * 60);
          
          if (!token.is_valid) {
            status = 'invalid';
          } else if (hoursUntilExpiry <= 0) {
            status = 'expired';
          } else if (hoursUntilExpiry < 4) {
            status = 'expiring_soon';
          }
        } else {
          status = token.is_valid ? 'valid' : 'invalid';
        }
        
        return {
          ...token,
          status,
          hours_until_expiry: hoursUntilExpiry
        };
      });
      
      setTokens(processedTokens);
    } catch (error: any) {
      console.error('Error loading user tokens:', error);
      toast.error(`Failed to load user tokens: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBoards = async () => {
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
    }
  };

  const getBoardsForUser = async (userId: string) => {
    try {
      // Get boards this user has access to
      const { data: boardAccess, error: accessError } = await (supabase as SupabaseClient)
        .from('productboard_user_board_access')
        .select(`
          id,
          board_id,
          verified_at,
          productboard_tracked_boards (
            id,
            board_name,
            use_shared_tokens
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);
      
      if (accessError) {
        throw accessError;
      }
      
      // Format the results
      return boardAccess.map((access: any) => ({
        id: access.id,
        board_id: access.board_id,
        board_name: access.productboard_tracked_boards?.board_name || 'Unknown Board',
        access_verified_at: access.verified_at,
        use_shared_tokens: access.productboard_tracked_boards?.use_shared_tokens || false
      }));
    } catch (error: any) {
      console.error('Error loading boards for user:', error);
      toast.error(`Failed to load user boards: ${error.message}`);
      return [];
    }
  };

  const refreshUserToken = async (token: UserToken) => {
    // Set the refreshing state for this token
    setRefreshing(prev => ({ ...prev, [token.id]: true }));
    
    try {
      // Use the generate-refresh-link function to create a refresh URL
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-refresh-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            board_id: token.board_id,
            return_url: window.location.href
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate refresh link');
      }
      
      const data = await response.json();
      
      // Open the refresh URL in a new window/tab
      window.open(data.refresh_url, '_blank');
      
      toast.success('Refresh link generated. Please complete the process in the new tab.');
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      toast.error(`Failed to refresh token: ${error.message}`);
    } finally {
      // Clear the refreshing state for this token
      setRefreshing(prev => ({ ...prev, [token.id]: false }));
    }
  };

  const revokeToken = async (token: UserToken) => {
    if (!confirm(`Are you sure you want to revoke the token for ${token.user_email || 'this user'}?`)) {
      return;
    }
    
    try {
      // Mark the token as invalid
      const { error } = await (supabase as SupabaseClient)
        .from('productboard_auth_tokens')
        .update({
          is_valid: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', token.id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Token revoked successfully');
      
      // Refresh the tokens list
      loadUserTokens();
    } catch (error: any) {
      console.error('Error revoking token:', error);
      toast.error(`Failed to revoke token: ${error.message}`);
    }
  };

  const toggleSharedTokenForBoard = async (boardId: string, useSharedTokens: boolean) => {
    try {
      const { error } = await (supabase as SupabaseClient)
        .from('productboard_tracked_boards')
        .update({
          use_shared_tokens: useSharedTokens,
          updated_at: new Date().toISOString()
        })
        .eq('board_id', boardId)
        .eq('workspace_id', workspaceId);
      
      if (error) {
        throw error;
      }
      
      // Update local boards state
      setBoards(boards.map(board => 
        board.board_id === boardId ? 
          { ...board, use_shared_tokens: useSharedTokens } : 
          board
      ));
      
      toast.success(`Board ${useSharedTokens ? 'now uses' : 'no longer uses'} shared tokens`);
      
      // Reload boards for expanded users
      loadUserTokens();
    } catch (error: any) {
      console.error('Error toggling shared token for board:', error);
      toast.error(`Failed to update board: ${error.message}`);
    }
  };

  const toggleExpandUser = async (userId: string) => {
    // Toggle the expanded state for this user
    setExpandedUsers(prev => ({ 
      ...prev, 
      [userId]: !prev[userId] 
    }));
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">User-Level Token Management</h2>
        <Button
          onClick={() => {
            // For a new user token, we'll use any valid board
            const firstBoard = boards.length > 0 ? boards[0] : null;
            setSelectedBoard(firstBoard);
            setTokenCaptureModalOpen(true);
          }}
          disabled={boards.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center"
        >
          <UserIcon className="h-4 w-4 mr-1" />
          Capture New User Token
        </Button>
      </div>
      
      <p className="text-gray-600 mb-4">
        Manage user-level tokens that can be shared across multiple ProductBoard boards. 
        When a user has a valid token, it can be used for any board they have access to.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>User-level tokens</strong> allow you to use a single token for multiple boards. 
              When enabled, the system will first look for a valid token from any user who has access 
              to the board before using board-specific tokens.
            </p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : tokens.length > 0 ? (
        <div className="space-y-4">
          {tokens.map(token => (
            <div 
              key={token.id} 
              className="border rounded-md overflow-hidden"
            >
              {/* User token header */}
              <div className="bg-gray-50 p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="font-medium">{token.user_email || 'Unknown User'}</h3>
                    <p className="text-sm text-gray-500">ID: {token.user_id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <TokenStatusBadge 
                    status={token.status || 'valid'} 
                    hoursUntilExpiry={token.hours_until_expiry}
                  />
                  
                  <Button
                    onClick={() => refreshUserToken(token)}
                    disabled={refreshing[token.id]}
                    variant="secondary"
                    size="sm"
                    className="inline-flex items-center"
                  >
                    {refreshing[token.id] ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Refresh
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => revokeToken(token)}
                    variant="danger"
                    size="sm"
                    className="inline-flex items-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                  
                  <Button
                    onClick={() => toggleExpandUser(token.user_id)}
                    variant="secondary"
                    size="sm"
                    className="inline-flex items-center"
                  >
                    {expandedUsers[token.user_id] ? (
                      <ChevronUpIcon className="h-5 w-5" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Token details */}
              <div className="p-4 bg-white">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created: </span>
                    {new Date(token.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Expires: </span>
                    {token.expires_at ? new Date(token.expires_at).toLocaleString() : 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Last Used: </span>
                    {token.last_used_at ? new Date(token.last_used_at).toLocaleString() : 'Never'}
                  </div>
                </div>
              </div>
              
              {/* Board access section (expanded) */}
              {expandedUsers[token.user_id] && (
                <div className="border-t p-4">
                  <h4 className="font-medium mb-3">Board Access</h4>
                  <BoardAccessList 
                    userId={token.user_id} 
                    onToggleSharedToken={toggleSharedTokenForBoard}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No user tokens found. Click "Capture New User Token" to add one.
        </div>
      )}
      
      {/* Token capture modal */}
      <TokenCaptureModal
        isOpen={tokenCaptureModalOpen}
        onClose={() => setTokenCaptureModalOpen(false)}
        board={selectedBoard}
        workspaceId={workspaceId}
      />
    </Card>
  );
}

// BoardAccessList is a nested component to display boards a user has access to
function BoardAccessList({ 
  userId, 
  onToggleSharedToken 
}: { 
  userId: string, 
  onToggleSharedToken: (boardId: string, useSharedTokens: boolean) => void 
}) {
  const [loading, setLoading] = useState(true);
  const [boardAccess, setBoardAccess] = useState<BoardAccess[]>([]);
  
  useEffect(() => {
    loadBoardAccess();
  }, [userId]);
  
  const loadBoardAccess = async () => {
    setLoading(true);
    try {
      // Query the productboard_user_board_access table to find boards this user has access to
      const { data, error } = await (supabase as SupabaseClient)
        .from('productboard_user_board_access')
        .select(`
          id,
          board_id,
          verified_at,
          productboard_tracked_boards!inner (
            id,
            board_name,
            use_shared_tokens
          )
        `)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      // Format the data for display
      const formattedAccess = data.map((item: any) => ({
        id: item.id,
        board_id: item.board_id,
        board_name: item.productboard_tracked_boards.board_name,
        access_verified_at: item.verified_at,
        use_shared_tokens: item.productboard_tracked_boards.use_shared_tokens
      }));
      
      setBoardAccess(formattedAccess);
    } catch (error: any) {
      console.error('Error loading board access:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin inline-block rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-500">Loading boards...</span>
      </div>
    );
  }
  
  if (boardAccess.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        No board access records found for this user.
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Board
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Access Verified
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Use Shared Token
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {boardAccess.map(board => (
            <tr key={board.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {board.board_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {board.access_verified_at ? new Date(board.access_verified_at).toLocaleString() : 'Not verified'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Switch
                  checked={board.use_shared_tokens}
                  onChange={() => onToggleSharedToken(board.board_id, !board.use_shared_tokens)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
