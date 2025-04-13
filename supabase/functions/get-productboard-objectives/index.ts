import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { z } from 'npm:zod@3.22.4';
import axios from 'npm:axios@1.6.7';

// Dynamic CORS configuration
const handleCors = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
};

const RequestSchema = z.object({
  api_key: z.string().min(1),
  objective_id: z.string().optional(),
  timeframe: z.string().optional(),
  status: z.string().optional(),
  initiative_id: z.string().optional(),
  params: z.record(z.any()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: handleCors(req) 
    });
  }

  try {
    const body = await req.json();
    const { api_key, objective_id, timeframe, status, initiative_id, params = {} } = RequestSchema.parse(body);

    try {
      let url = 'https://api.productboard.com/objectives';
      
      // If objective_id is provided, get a specific objective
      if (objective_id) {
        url = `${url}/${objective_id}`;
      }

      // Build query parameters
      const queryParams = { ...params };
      if (timeframe) queryParams.timeframe = timeframe;
      if (status) queryParams.status = status;
      
      // If initiative_id is provided, get objectives for a specific initiative
      if (initiative_id) {
        url = `https://api.productboard.com/links/initiatives/${initiative_id}/objectives`;
        console.log('Using initiative_id endpoint:', url);
      }

      // Log the API key (first few characters for debugging)
      console.log('Using API key starting with:', api_key.substring(0, 10));
      console.log('Making request to ProductBoard API:', url);
      console.log('Request params:', JSON.stringify(queryParams));
      console.log('Full request details:', {
        method: 'GET',
        url,
        headers: {
          'X-Version': '1',
          'Authorization': `Bearer ${api_key.substring(0, 5)}...`,
          'Content-Type': 'application/json',
        },
        params: queryParams
      });
      
      const response = await axios.get(url, {
        headers: {
          'X-Version': '1',
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        params: queryParams,
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
            ...handleCors(req),
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
        error: error.message || 'Failed to fetch ProductBoard objectives',
        details: error.response?.data || null,
        status: error.response?.status || null
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(req),
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
          ...handleCors(req),
        },
      }
    );
  }
});
