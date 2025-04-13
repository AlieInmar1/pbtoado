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
  feature_id: z.string().optional(),
  board_id: z.string().optional(),
  component_id: z.string().optional(),
  product_id: z.string().optional(),
  parent_id: z.string().optional(),
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
    const { api_key, feature_id, board_id, component_id, product_id, parent_id, params = {} } = RequestSchema.parse(body);

    try {
      let url = 'https://api.productboard.com/features';
      
      // If feature_id is provided, get a specific feature
      if (feature_id) {
        url = `${url}/${feature_id}`;
      }
      // If component_id is provided, get features for a specific component
      else if (component_id) {
        url = `https://api.productboard.com/components/${component_id}/features`;
      }
      // If product_id is provided, get features for a specific product
      else if (product_id) {
        url = `https://api.productboard.com/products/${product_id}/features`;
      }

      // Add board_id and parent_id to params if provided
      const requestParams = { ...params };
      if (board_id) {
        requestParams.board_id = board_id;
      }
      if (parent_id) {
        requestParams.parent_id = parent_id;
      }

      // Log the API key (first few characters for debugging)
      console.log('Using API key starting with:', api_key.substring(0, 10));
      console.log('Making request to ProductBoard API:', url);
      console.log('Request params:', JSON.stringify(requestParams));
      
      const response = await axios.get(url, {
        headers: {
          'X-Version': '1',
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        params: requestParams,
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
        error: error.message || 'Failed to fetch ProductBoard features',
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
