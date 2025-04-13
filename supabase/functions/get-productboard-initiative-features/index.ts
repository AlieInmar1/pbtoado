import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { z } from 'npm:zod@3.22.4';
import axios from 'npm:axios@1.6.7';

// Simple CORS headers with wildcard origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const RequestSchema = z.object({
  api_key: z.string().min(1),
  initiative_id: z.string().min(1),
  params: z.record(z.any()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.json();
    const { api_key, initiative_id, params = {} } = RequestSchema.parse(body);

    try {
      // Endpoint for getting features linked to an initiative
      const url = `https://api.productboard.com/links/initiatives/${initiative_id}/features`;
      
      // Log the API key (first few characters for debugging)
      console.log('Using API key starting with:', api_key.substring(0, 10));
      console.log('Making request to ProductBoard API:', url);
      console.log('Request params:', JSON.stringify(params));
      console.log('Full request details:', {
        method: 'GET',
        url,
        headers: {
          'X-Version': '1',
          'Authorization': `Bearer ${api_key.substring(0, 5)}...`,
          'Content-Type': 'application/json',
        },
        params
      });
      
      const response = await axios.get(url, {
        headers: {
          'X-Version': '1',
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        params,
      });
      
      console.log('ProductBoard API response status:', response.status);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: response.data
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error('ProductBoard API error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data));
      }
      
      // Return a more detailed error response
      const errorResponse = {
        success: false,
        error: error.message || 'Failed to fetch features linked to initiative',
        details: error.response?.data || null,
        status: error.response?.status || null
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
