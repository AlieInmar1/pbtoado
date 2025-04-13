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
  custom_field_id: z.string().optional(),
  entity_id: z.string().optional(),
  entity_type: z.enum(['feature', 'initiative', 'component', 'product']).optional(),
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
    const { api_key, custom_field_id, entity_id, entity_type, params = {} } = RequestSchema.parse(body);

    try {
      let url = 'https://api.productboard.com/custom-fields';
      
      // If custom_field_id is provided, get a specific custom field
      if (custom_field_id) {
        url = `${url}/${custom_field_id}`;
      }

      // If entity_id and entity_type are provided, get custom field values for a specific entity
      if (entity_id && entity_type) {
        url = `https://api.productboard.com/${entity_type}s/${entity_id}/custom-field-values`;
      }

      // Log the API key (first few characters for debugging)
      console.log('Using API key starting with:', api_key.substring(0, 10));
      console.log('Making request to ProductBoard API:', url);
      console.log('Request params:', JSON.stringify(params));
      
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
        error: error.message || 'Failed to fetch ProductBoard custom fields',
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
