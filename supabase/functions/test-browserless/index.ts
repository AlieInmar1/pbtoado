import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
};

// Main handler for the Supabase function
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { api_key } = await req.json();
    
    if (!api_key) {
      return new Response(
        JSON.stringify({ error: 'api_key is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Test the Browserless API key using BrowserQL
    console.log('Testing Browserless API key with BrowserQL...');
    const response = await fetch('https://chrome.browserless.io/browserql', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify({
        query: `query { browser { version } }`
      })
    });
    
    // Log detailed response information for debugging
    console.log(`Browserless response status: ${response.status}`);
    
    // Get the response text regardless of status code
    const responseText = await response.text();
    console.log(`Browserless response body: ${responseText}`);
    
    if (!response.ok) {
      console.error(`Browserless API error response: ${responseText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Browserless API error: ${response.status} ${responseText}` 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Try to parse the response as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response as JSON:', e);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid response from Browserless: ${responseText}` 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Check if there are any errors in the GraphQL response
    if (responseData.errors) {
      console.error('GraphQL errors:', responseData.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `GraphQL errors: ${JSON.stringify(responseData.errors)}` 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // If we get here, the API key is valid
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Browserless API key is valid',
        data: responseData.data
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error testing Browserless API key:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
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
