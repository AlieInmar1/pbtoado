import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info'
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
    const { api_key, service = 'apify' } = await req.json();
    
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
    
    if (service === 'apify') {
      return await testApifyApiKey(api_key);
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Unsupported scraping service: ${service}` 
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
  } catch (error) {
    console.error('Error testing API key:', error);
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

// Function to test an Apify API key
async function testApifyApiKey(apiKey: string) {
  try {
    console.log('Testing Apify API key...');
    
    // Call the Apify API to create a test actor run
    const response = await fetch('https://api.apify.com/v2/acts/apify~hello-world/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        message: 'Testing API key'
      })
    });
    
    // Log detailed response information for debugging
    console.log(`Apify response status: ${response.status}`);
    
    // Get the response text regardless of status code
    const responseText = await response.text();
    console.log(`Apify response body: ${responseText}`);
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Apify API error: ${response.status} ${responseText}` 
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
          error: `Invalid response from Apify: ${responseText}` 
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
        message: 'Apify API key is valid',
        data: {
          runId: responseData.data?.id
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error testing Apify API key:', error);
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
}
