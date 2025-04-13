import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Complete CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, X-Requested-With, Accept',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
};

interface RequestBody {
  workspaceId: string;
  boardId: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Parse the request body
    const body: RequestBody = await req.json();

    // Validate required fields
    if (!body.workspaceId || !body.boardId) {
      return new Response(
        JSON.stringify({ error: 'workspaceId and boardId are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log(`Checking token validity for board: ${body.boardId}`);

    // Query by fields without URL encoding issues
    const { data, error } = await supabaseAdmin
      .from('productboard_auth_tokens')
      .select('is_valid, expires_at, last_used_at, id')
      .eq('workspace_id', body.workspaceId)
      .eq('board_id', body.boardId)
      .maybeSingle();

    if (error) {
      console.error('Error checking token status:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to check token status', details: error }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!data) {
      // No token found for this board
      return new Response(
        JSON.stringify({ 
          found: false,
          message: 'No token found for this board ID' 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    const isExpired = expiresAt < now;

    // Combine validity from database and expiration check
    const isValid = data.is_valid && !isExpired;

    return new Response(
      JSON.stringify({
        isValid,
        expiresAt: data.expires_at,
        lastUsedAt: data.last_used_at,
        tokenId: data.id,
        found: true
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error in check-token-validity function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
