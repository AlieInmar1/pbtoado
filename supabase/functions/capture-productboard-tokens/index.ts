import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

// Constants
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TIMEOUT = 120000; // 2 minutes timeout

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
  boardUrl: string;
  boardName?: string;
  returnUrl?: string; // URL to redirect to after capture
  authData?: any; // Used for client-side captured tokens
  isClientCapture?: boolean; // Set to true when tokens are captured by the client
  useApify?: boolean; // Set to true to use Apify for token extraction
  credentials?: { // Used when useApify is true
    username: string;
    password: string;
    workspace?: string;
  };
}

/**
 * Main handler for the Supabase function
 */
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, // Use 204 No Content for OPTIONS responses
      headers: corsHeaders 
    });
  }

  try {
    // Parse the request body
    const body: RequestBody = await req.json();

    // Validate required fields
    if (!body.workspaceId || !body.boardId || !body.boardUrl) {
      return new Response(
        JSON.stringify({ error: 'workspaceId, boardId, and boardUrl are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create a Supabase client
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

    // Check if we already have a token for this board
    const { data: existingToken, error: tokenError } = await supabaseAdmin
      .from('productboard_auth_tokens')
      .select('*')
      .eq('workspace_id', body.workspaceId)
      .eq('board_id', body.boardId)
      .maybeSingle();

    if (tokenError) {
      console.error('Error checking for existing token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to check for existing token', details: tokenError }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Determine which token capture method to use
    let authData;
    
    if (body.isClientCapture && body.authData) {
      // Use client-provided auth data
      console.log('Using client-captured tokens for board:', body.boardId);
      authData = body.authData;
    } else if (body.useApify && body.credentials) {
      // Use Apify for token extraction
      console.log('Using Apify for token extraction for board:', body.boardId);
      
      // Check for Apify configuration
      const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN');
      const APIFY_TOKEN_EXTRACTOR_ACTOR_ID = Deno.env.get('APIFY_TOKEN_EXTRACTOR_ACTOR_ID');
      
      if (!APIFY_API_TOKEN || !APIFY_TOKEN_EXTRACTOR_ACTOR_ID) {
        console.error('Missing Apify configuration:', {
          hasApiToken: !!APIFY_API_TOKEN,
          hasActorId: !!APIFY_TOKEN_EXTRACTOR_ACTOR_ID
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'Apify token extraction is not properly configured', 
            details: 'The server is missing required Apify configuration. Please contact the administrator to set up the token extraction service.',
            missingEnv: {
              APIFY_API_TOKEN: !APIFY_API_TOKEN,
              APIFY_TOKEN_EXTRACTOR_ACTOR_ID: !APIFY_TOKEN_EXTRACTOR_ACTOR_ID
            }
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      try {
        // Call the Apify token extractor
        authData = await captureTokensWithApify(
          body.credentials.username,
          body.credentials.password,
          body.boardUrl,
          body.credentials.workspace
        );
      } catch (error) {
        console.error('Error using Apify token extractor:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to capture ProductBoard tokens with Apify', 
            details: error.message
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    } else {
      // Launch Puppeteer for token capture
      console.log('Launching Puppeteer token capture for board:', body.boardId);
      
      // Check if this is a serverless environment or has proper display
      // If running in a serverless environment, we may need different browser launch options
      const isHeadless = Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined;
      
      try {
        authData = await captureProductBoardTokens(
          body.boardUrl,
          body.returnUrl,
          isHeadless
        );
      } catch (error) {
        console.error('Error capturing tokens with Puppeteer:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to capture ProductBoard tokens with Puppeteer', 
            details: error.message,
            isHeadless
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }

    // Calculate expiry date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Extract user information if available
    const userId = authData.userId;
    const userEmail = authData.userEmail;
    const isSharedToken = !!userId; // If we have a user ID, this can be a shared token
    
    console.log(`User information: ${userId ? `ID: ${userId}, Email: ${userEmail}` : 'Not available'}`);
    
    // Prepare the token data
    const tokenData = {
      workspace_id: body.workspaceId,
      board_id: body.boardId,
      board_name: body.boardName || '',
      board_url: body.boardUrl,
      auth_cookies: authData.cookies,
      local_storage: authData.localStorage || null,
      session_storage: authData.sessionStorage || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      last_used_at: new Date().toISOString(),
      is_valid: true,
      user_id: userId || null,
      user_email: userEmail || null,
      shared_token: isSharedToken
    };
    
    // If this is a user-level token, store the board access information
    if (userId) {
      // Record that this user has access to this board
      await supabaseAdmin
        .from('productboard_user_board_access')
        .upsert({
          workspace_id: body.workspaceId,
          user_id: userId,
          board_id: body.boardId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'workspace_id,user_id,board_id'
        });
    }

    // Store the token in the database
    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabaseAdmin
        .from('productboard_auth_tokens')
        .update(tokenData)
        .eq('id', existingToken.id);

      if (updateError) {
        console.error('Error updating token:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update token', details: updateError }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    } else {
      // Insert new token
      const { error: insertError } = await supabaseAdmin
        .from('productboard_auth_tokens')
        .insert(tokenData);

      if (insertError) {
        console.error('Error inserting token:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save token', details: insertError }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }

    // Update the board's has_valid_token flag
    const { error: boardUpdateError } = await supabaseAdmin
      .from('productboard_tracked_boards')
      .update({
        has_valid_token: true,
        updated_at: new Date().toISOString()
      })
      .eq('workspace_id', body.workspaceId)
      .eq('board_id', body.boardId);

    if (boardUpdateError) {
      console.error('Error updating board token status:', boardUpdateError);
      // Continue anyway, as the token was saved successfully
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'ProductBoard tokens captured and saved successfully',
        expiresAt: expiresAt.toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error in capture-productboard-tokens function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * Capture ProductBoard tokens using Puppeteer
 */
async function captureProductBoardTokens(boardUrl: string, returnUrl?: string, isHeadless = true) {
  // Extract the base URL (we need to navigate to login first)
  const productboardUrl = 'https://app.productboard.com/login';
  
  console.log(`Starting token capture for ${boardUrl}`);
  
  // Launch Puppeteer with appropriate options
  const browser = await puppeteer.launch({
    headless: isHeadless,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Set a realistic viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // Navigate to ProductBoard login
    console.log(`Navigating to ${productboardUrl}`);
    await page.goto(productboardUrl, { 
      timeout: TIMEOUT,
      waitUntil: 'domcontentloaded' // Just wait for DOM to be ready
    });
    
    // Wait for login page to appear
    console.log('Waiting for login form...');
    
    try {
      await page.waitForSelector('input[type="email"], input[type="text"], form, .login-form', { 
        timeout: 30000 
      });
      console.log('Login form detected');
    } catch (e) {
      console.log('Login form not detected, but continuing anyway');
    }
    
    if (!isHeadless) {
      // This is running in a browser where the user can interact
      console.log('Please log in to ProductBoard in the browser...');
      
      // TODO: Add code to display instructions to the user
      // Since this would run in the context of a browser extension or desktop app,
      // you would need to implement UI for this part
      
      // For now, we'll just wait a long time to allow manual login
      await page.waitForNavigation({ timeout: 300000 }); // 5 minutes
    } else {
      // In headless mode in the serverless environment, we can't do interactive login
      // We would need pre-stored credentials or another approach
      console.error('Headless mode requires pre-stored credentials, which is not implemented');
      throw new Error('Interactive login required but not available in headless mode');
    }
    
    // Once logged in, navigate to the specific board
    console.log(`Navigating to board: ${boardUrl}`);
    await page.goto(boardUrl, { 
      timeout: TIMEOUT,
      waitUntil: 'domcontentloaded' 
    });
    
    // Wait for the page to load (this depends on ProductBoard's structure)
    await page.waitForTimeout(5000);
    
    // Extract all cookies
    console.log('Extracting authentication cookies...');
    const cookies = await page.cookies();
    
    // Extract user information if possible
    console.log('Attempting to extract user information...');
    let userId = null;
    let userEmail = null;
    
    try {
      // Try to extract user information from the page
      const userInfo = await page.evaluate(() => {
        // Check localStorage for user info
        let id = null;
        let email = null;
        
        // Common patterns for user info storage in ProductBoard
        const userKeyPatterns = ['user', 'currentUser', 'pb_user', 'account'];
        
        // Look through localStorage for user info
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          
          // Check if this key might contain user info
          const keyLower = key.toLowerCase();
          if (userKeyPatterns.some(pattern => keyLower.includes(pattern))) {
            try {
              const value = localStorage.getItem(key);
              if (!value) continue;
              
              const parsed = JSON.parse(value);
              
              // Look for common user ID and email fields
              if (parsed) {
                if (parsed.id && !id) id = parsed.id;
                if (parsed.userId && !id) id = parsed.userId;
                if (parsed.user_id && !id) id = parsed.user_id;
                
                if (parsed.email && !email) email = parsed.email;
                if (parsed.userEmail && !email) email = parsed.userEmail;
                if (parsed.user_email && !email) email = parsed.user_email;
                
                // Handle nested structures
                if (parsed.user) {
                  if (parsed.user.id && !id) id = parsed.user.id;
                  if (parsed.user.email && !email) email = parsed.user.email;
                }
                
                if (parsed.account) {
                  if (parsed.account.id && !id) id = parsed.account.id;
                  if (parsed.account.email && !email) email = parsed.account.email;
                }
              }
            } catch (err) {
              // Ignore JSON parse errors
              console.log(`Couldn't parse ${key}`);
            }
          }
        }
        
        // If we couldn't find in localStorage, try from DOM
        if (!id || !email) {
          // Look for user info in meta tags or dataset attributes
          const userElements = document.querySelectorAll('[data-user-id], [data-user-email], [data-current-user]');
          userElements.forEach(el => {
            const dataset = (el as HTMLElement).dataset;
            if (dataset.userId && !id) id = dataset.userId;
            if (dataset.userEmail && !email) email = dataset.userEmail;
            if (dataset.currentUser) {
              try {
                const user = JSON.parse(dataset.currentUser);
                if (user.id && !id) id = user.id;
                if (user.email && !email) email = user.email;
              } catch (e) {
                // Ignore JSON parse errors
              }
            }
          });
        }
        
        return { id, email };
      });
      
      userId = userInfo.id;
      userEmail = userInfo.email;
      
      console.log(`Extracted user information: ${userId ? `ID: ${userId}` : 'No ID'}, ${userEmail ? `Email: ${userEmail}` : 'No email'}`);
    } catch (e) {
      console.warn('Could not extract user information:', e);
    }
    
    // Extract localStorage items if possible
    let localStorage = {};
    try {
      localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });
    } catch (e) {
      console.warn('Could not extract localStorage:', e);
    }
    
    // Extract sessionStorage items if possible
    let sessionStorage = {};
    try {
      sessionStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          items[key] = sessionStorage.getItem(key);
        }
        return items;
      });
    } catch (e) {
      console.warn('Could not extract sessionStorage:', e);
    }
    
    // Combine all authentication data
    const authData = {
      cookies,
      localStorage,
      sessionStorage,
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    };
    
    // If a return URL is provided, navigate there
    if (returnUrl) {
      await page.goto(returnUrl, { waitUntil: 'domcontentloaded' });
    }
    
    return authData;
  } finally {
    // Close the browser
    await browser.close();
  }
}

/**
 * Use Apify to capture ProductBoard tokens using a two-step approach:
 * 1. Start the actor run and get the key-value store ID
 * 2. Wait 70 seconds for the run to complete
 * 3. Get the OUTPUT value from the key-value store
 */
async function captureTokensWithApify(
  username: string, 
  password: string, 
  boardUrl: string,
  workspace?: string
) {
  // Get Apify API token from environment
  const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN');
  
  if (!APIFY_API_TOKEN) {
    console.error('APIFY_API_TOKEN environment variable is missing');
    throw new Error('APIFY_API_TOKEN environment variable is required');
  } else {
    console.log(`Found APIFY_API_TOKEN with length: ${APIFY_API_TOKEN.length}`);
  }
  
  console.log(`Running Apify token extractor for ${boardUrl}`);
  
  // Set up actor run parameters
  const actorInput = {
    username,
    password,
    boardUrl,
    workspace: workspace || '',
    saveScreenshots: true
  };
  
  // Determine which actor to use
  const actorId = Deno.env.get('APIFY_TOKEN_EXTRACTOR_ACTOR_ID');
  
  if (!actorId) {
    console.error('Missing APIFY_TOKEN_EXTRACTOR_ACTOR_ID environment variable');
    throw new Error('Apify configuration is incomplete. Contact your administrator to set up the token extraction service.');
  } else {
    console.log(`Using Apify actor: ${actorId}`);
  }
  
  // Convert actor ID format from 'username/actor-name' to 'username~actor-name'
  // This is required by the Apify API URL structure
  const formattedActorId = actorId.replace('/', '~');
  
  // STEP 1: Start the actor run (not synchronous)
  const runUrl = `https://api.apify.com/v2/acts/${formattedActorId}/runs?token=${APIFY_API_TOKEN}`;
  console.log(`Starting actor run with endpoint: ${runUrl.replace(APIFY_API_TOKEN, '***')}`);
  
  console.log(`With actor input: ${JSON.stringify(actorInput)}`);
  console.log(`With boardUrl: ${boardUrl}`);
  console.log(`Workspace specified: ${workspace || 'none'}`);
  
  try {
    console.log(`Making API call to start Apify actor run: ${formattedActorId}`);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // First API call: Start the actor run
    const runResponse = await fetch(
      runUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(actorInput),
      }
    );
    
    console.log(`Apify run API response status: ${runResponse.status}`);
    
    if (!runResponse.ok) {
      let errorText = await runResponse.text();
      console.error(`Error response from Apify run: ${errorText}`);
      throw new Error(`Failed to start Apify actor: ${errorText}`);
    }
    
    // Parse the run response to get run info
    const runInfo = await runResponse.json();
    console.log(`Run started with ID: ${runInfo.id}`);
    console.log(`Run info: ${JSON.stringify(runInfo)}`);
    
    // Extract the default key-value store ID from the run info
    const keyValueStoreId = runInfo.defaultKeyValueStoreId;
    if (!keyValueStoreId) {
      console.error('No default key-value store ID found in run response');
      throw new Error('Failed to get key-value store ID from run response');
    }
    
    console.log(`Default key-value store ID: ${keyValueStoreId}`);
    
    // STEP 2: Wait 70 seconds for the actor to complete
    console.log('Waiting 70 seconds for the actor to complete...');
    await new Promise(resolve => setTimeout(resolve, 70000));
    
    // STEP 3: Get the OUTPUT value from the key-value store
    const outputUrl = `https://api.apify.com/v2/key-value-stores/${keyValueStoreId}/records/OUTPUT?token=${APIFY_API_TOKEN}`;
    console.log(`Getting OUTPUT from key-value store: ${outputUrl.replace(APIFY_API_TOKEN, '***')}`);
    
    const outputResponse = await fetch(outputUrl);
    
    if (!outputResponse.ok) {
      console.error(`Error getting OUTPUT: ${outputResponse.status} ${outputResponse.statusText}`);
      throw new Error(`Failed to get OUTPUT from key-value store: ${outputResponse.status} ${outputResponse.statusText}`);
    }
    
    // Parse the OUTPUT value
    const outputText = await outputResponse.text();
    console.log(`Received OUTPUT value of length: ${outputText.length}`);
    
    try {
      // The OUTPUT value is expected to be a stringified JSON object
      const tokenData = JSON.parse(outputText);
      console.log('Successfully parsed OUTPUT JSON');
      
      // Return the token data in the expected format
      return {
        cookies: tokenData.cookies || {},
        localStorage: tokenData.localStorage || {},
        sessionStorage: null, // Apify doesn't extract session storage
        userId: tokenData.userId || null,
        userEmail: tokenData.userEmail || null,
        timestamp: tokenData.timestamp || new Date().toISOString()
      };
    } catch (parseError) {
      console.error(`Error parsing OUTPUT response as JSON: ${parseError.message}`);
      console.log(`OUTPUT response preview: ${outputText.substring(0, 200)}...`);
      
      // Return a placeholder object since we couldn't parse the response
      return {
        cookies: {}, // Placeholder for cookies
        localStorage: {}, // Placeholder for localStorage
        sessionStorage: null,
        userId: null,
        userEmail: null,
        timestamp: new Date().toISOString(),
        _error: `Could not parse OUTPUT response: ${parseError.message}`
      };
    }
  } catch (error) {
    console.error(`Error with Apify API calls: ${error.message}`);
    throw error;
  }
}
