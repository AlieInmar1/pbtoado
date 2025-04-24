/**
 * ProductBoard API client
 * Provides functions to interact with the ProductBoard API through the proxy server
 */

const PROXY_URL = 'http://localhost:3008';

/**
 * Sync ProductBoard data with Supabase
 * @param options - Sync options
 * @param options.workspaceId - ProductBoard workspace ID (optional, defaults to env var)
 * @param options.boardId - ProductBoard board ID (optional, defaults to '00000000-0000-0000-0000-000000000000')
 * @param options.reset - Whether to clear all tables before syncing (optional, defaults to false)
 * @param options.resetTables - Tables to clear before syncing (optional, defaults to [])
 * @returns Promise resolving to the sync result
 */
export async function syncProductBoardData(options: {
  workspaceId?: string;
  boardId?: string;
  reset?: boolean;
  resetTables?: string[];
} = {}) {
  try {
    const response = await fetch(`${PROXY_URL}/pb/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to sync ProductBoard data: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing ProductBoard data:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
