import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';
import { encodeBase64Url } from 'https://deno.land/std@0.177.0/encoding/base64url.ts';

// Constants
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const LINK_EXPIRY_HOURS = 24; // Links expire after 24 hours

// Complete CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, X-Requested-With, Accept',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
};

interface RequestBody {
  workspace_id: string;
  board_id: string;
  return_url?: string; // Where to redirect after token capture
  callback_url?: string; // Webhook to call when token is captured
}

// Main handler for the function
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, // Use 204 No Content for OPTIONS responses
      headers: corsHeaders 
    });
  }

  try {
    // Parse request body
    const { workspace_id, board_id, return_url, callback_url } = await req.json() as RequestBody;
    
    if (!workspace_id || !board_id) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'workspace_id and board_id are required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Initialize Supabase client with service role for admin privileges
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Verify board exists
    const { data: board, error: boardError } = await supabaseAdmin
      .from('productboard_tracked_boards')
      .select('board_name, board_url')
      .eq('workspace_id', workspace_id)
      .eq('board_id', board_id)
      .single();
    
    if (boardError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Board not found: ${boardError.message}`
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Generate a secure token for this refresh request
    const tokenBytes = new Uint8Array(32); // 256 bits of randomness
    crypto.getRandomValues(tokenBytes);
    const refreshToken = encodeBase64Url(tokenBytes);
    
    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + LINK_EXPIRY_HOURS);
    
    // Store the refresh token in the database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('token_refresh_requests')
      .upsert({
        workspace_id,
        board_id,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
        return_url: return_url || null,
        callback_url: callback_url || null,
        created_at: new Date().toISOString(),
        status: 'pending'
      }, {
        onConflict: 'workspace_id,board_id' // If a request already exists for this board, update it
      })
      .select('id')
      .single();
    
    if (tokenError) {
      throw new Error(`Failed to create refresh token: ${tokenError.message}`);
    }
    
    // Construct the refresh URL
    // In a real implementation, this would be a link to your frontend app
    // with a route that handles token refresh
    const appHost = Deno.env.get('APP_HOST') || 'https://app.example.com';
    const refreshUrl = `${appHost}/refresh-token?token=${refreshToken}&workspace=${workspace_id}&board=${board_id}`;
    
    // Return the refresh URL and token data
    return new Response(
      JSON.stringify({
        success: true,
        refresh_url: refreshUrl,
        board_name: board.board_name,
        board_url: board.board_url,
        expires_at: expiresAt.toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-refresh-link function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred while generating refresh link'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
