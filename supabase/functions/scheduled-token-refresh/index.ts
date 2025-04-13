import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Constants
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * Scheduled function to refresh ProductBoard tokens across all tracked boards.
 * This function is designed to be run on a schedule (e.g., nightly) to ensure
 * we always have valid tokens for ProductBoard interactions.
 */
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: CORS_HEADERS 
    });
  }

  try {
    console.log('Starting scheduled ProductBoard token refresh...');
    
    // Get credentials from environment variables
    const username = Deno.env.get('PRODUCTBOARD_USERNAME');
    const password = Deno.env.get('PRODUCTBOARD_PASSWORD');
    const workspace = Deno.env.get('PRODUCTBOARD_WORKSPACE') || '';
    
    if (!username || !password) {
      throw new Error('ProductBoard credentials not configured. Set PRODUCTBOARD_USERNAME and PRODUCTBOARD_PASSWORD environment variables.');
    }
    
    console.log(`Using credentials for user: ${username}`);
    
    // Create Supabase client with admin privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Get boards that need token refresh
    // We prioritize:
    // 1. Boards with invalid tokens
    // 2. Boards with tokens that will expire soon
    // 3. Oldest updated tokens first
    const { data: boards, error: boardError } = await supabase
      .from('productboard_tracked_boards')
      .select('workspace_id, board_id, board_url, board_name, last_token_refresh')
      .eq('is_active', true)
      .order('has_valid_token', { ascending: true }) // Invalid tokens first
      .order('last_token_refresh', { ascending: true }); // Oldest refreshed first
    
    if (boardError) {
      throw new Error(`Failed to fetch boards: ${boardError.message}`);
    }
    
    if (!boards || boards.length === 0) {
      console.log('No active boards found to refresh tokens for');
      return new Response(
        JSON.stringify({ message: 'No active boards found' }),
        { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }
    
    console.log(`Found ${boards.length} boards to process`);
    
    // Process each board (up to a reasonable limit to avoid timeouts)
    const MAX_BOARDS_TO_PROCESS = 5; // Process 5 boards per run to avoid timeouts
    const boardsToProcess = boards.slice(0, MAX_BOARDS_TO_PROCESS);
    
    const results = [];
    for (const board of boardsToProcess) {
      try {
        console.log(`Processing board ${board.board_id} (${board.board_name || 'unnamed'})`);
        
        // Call the token capture endpoint with Apify extraction
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/capture-productboard-tokens`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              workspaceId: board.workspace_id,
              boardId: board.board_id,
              boardUrl: board.board_url,
              boardName: board.board_name || '',
              useApify: true, // Use Apify for token extraction
              credentials: {
                username,
                password,
                workspace
              }
            })
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Token capture failed: ${errorText}`);
        }
        
        const result = await response.json();
        
        // Update the last refresh time in the tracked boards table
        await supabase
          .from('productboard_tracked_boards')
          .update({
            last_token_refresh: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('workspace_id', board.workspace_id)
          .eq('board_id', board.board_id);
        
        results.push({
          board: `${board.workspace_id}/${board.board_id}`,
          name: board.board_name || 'unnamed',
          success: true,
          expiresAt: result.expiresAt
        });
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing board ${board.board_id}:`, error);
        results.push({
          board: `${board.workspace_id}/${board.board_id}`,
          name: board.board_name || 'unnamed',
          success: false,
          error: error.message
        });
      }
    }
    
    // Return results summary
    return new Response(
      JSON.stringify({
        processed: results.length,
        total: boards.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        } 
      }
    );
  } catch (error) {
    console.error('Error in scheduled-token-refresh function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
});
