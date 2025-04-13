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
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: handleCors(req) });
  }

  try {
    const body = await req.json();
    const { api_key } = RequestSchema.parse(body);

    // Test connection to ProductBoard
    try {
      // Log the API key (first few characters for debugging)
      console.log('Using API key starting with:', api_key.substring(0, 10));
      console.log('Making request to ProductBoard API...');
      
      // Use "Bearer" prefix in Authorization header and features endpoint
      const response = await axios.get('https://api.productboard.com/features', {
        headers: {
          'X-Version': '1',
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('ProductBoard API response status:', response.status);

      // If we get here, the API key is valid
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Successfully connected to ProductBoard',
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
      console.error('ProductBoard connection error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data));
      }
      
      // Return a more detailed error response
      const errorResponse = {
        success: false,
        error: error.message || 'Failed to connect to ProductBoard',
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
    return new Response(
      JSON.stringify({ error: error.message }),
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
