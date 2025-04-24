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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, X-Requested-With, Accept, apikey',
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
  workspace?: string; // Optional workspace for Apify token extraction
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
    } else if (body.useApify) {
      // Use Apify for token extraction
      console.log('Using Apify for token extraction for board:', body.boardId);

      // Check for Apify configuration
      const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN');
      const APIFY_TOKEN_EXTRACTOR_ACTOR_ID = Deno.env.get('APIFY_TOKEN_EXTRACTOR_ACTOR_ID');
      const PRODUCTBOARD_USERNAME = Deno.env.get('PRODUCTBOARD_USERNAME');
      const PRODUCTBOARD_PASSWORD = Deno.env.get('PRODUCTBOARD_PASSWORD');

      if (!APIFY_API_TOKEN || !APIFY_TOKEN_EXTRACTOR_ACTOR_ID || !PRODUCTBOARD_USERNAME || !PRODUCTBOARD_PASSWORD) {
        console.error('Missing Apify or ProductBoard configuration:', {
          hasApiToken: !!APIFY_API_TOKEN,
          hasActorId: !!APIFY_TOKEN_EXTRACTOR_ACTOR_ID,
          hasUsername: !!PRODUCTBOARD_USERNAME,
          hasPassword: !!PRODUCTBOARD_PASSWORD
        });

        return new Response(
          JSON.stringify({
            error: 'Apify token extraction is not properly configured',
            details: 'The server is missing required configuration. Please contact the administrator to set up the token extraction service.',
            missingEnv: {
              APIFY_API_TOKEN: !APIFY_API_TOKEN,
              APIFY_TOKEN_EXTRACTOR_ACTOR_ID: !APIFY_TOKEN_EXTRACTOR_ACTOR_ID,
              PRODUCTBOARD_USERNAME: !PRODUCTBOARD_USERNAME,
              PRODUCTBOARD_PASSWORD: !PRODUCTBOARD_PASSWORD
            }
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      try {
        // Call the Apify token extractor with credentials from environment variables
        authData = await captureTokensWithApify(
          PRODUCTBOARD_USERNAME,
          PRODUCTBOARD_PASSWORD,
          body.boardUrl,
          body.workspace || undefined
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
      // *** ADDED LOGGING ***
      console.log('[Apify] authData returned:', JSON.stringify(authData)); // Log data returned by Apify function
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
    // *** ADDED LOGGING ***
    console.log('[Main Handler] authData received:', JSON.stringify(authData)); // Log data received in main handler

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
    // *** ADDED LOGGING ***
    console.log('[Main Handler] Preparing tokenData for DB:', JSON.stringify(tokenData)); // Log data before DB save

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
      console.log(`[Main Handler] Attempting to update existing token ID: ${existingToken.id}`);
      try { // Wrap update operation
        // Update existing token
        const { error: updateError } = await supabaseAdmin
          .from('productboard_auth_tokens')
          .update(tokenData)
          .eq('id', existingToken.id);

        if (updateError) {
          // *** ADDED ERROR LOGGING ***
          console.error('[Main Handler] Supabase update error:', updateError);
          console.error('[Main Handler] Failed tokenData for update:', JSON.stringify(tokenData)); // Log the data that failed
          return new Response(
            JSON.stringify({ error: 'Failed to update token', details: updateError }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        // *** ADDED SUCCESS LOG ***
        console.log(`[Main Handler] Successfully updated token ID: ${existingToken.id}`);
      } catch (dbError) { // Catch specific update error
        console.error('[Main Handler] Synchronous DB update error:', dbError);
        console.error('[Main Handler] Failed tokenData during DB update exception:', JSON.stringify(tokenData));
        return new Response(
          JSON.stringify({ error: 'Failed to update token due to DB exception', details: dbError.message }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    } else {
      console.log('[Main Handler] Attempting to insert new token...');
      try { // Wrap insert operation
        // Insert new token
        const { error: insertError } = await supabaseAdmin
          .from('productboard_auth_tokens')
          .insert(tokenData);

        if (insertError) {
          // *** ADDED ERROR LOGGING ***
          console.error('[Main Handler] Supabase insert error:', insertError);
          console.error('[Main Handler] Failed tokenData for insert:', JSON.stringify(tokenData)); // Log the data that failed
          return new Response(
            JSON.stringify({ error: 'Failed to save token', details: insertError }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        // *** ADDED SUCCESS LOG ***
        console.log('[Main Handler] Successfully inserted new token.');
      } catch (dbError) { // Catch specific insert error
        console.error('[Main Handler] Synchronous DB insert error:', dbError);
        console.error('[Main Handler] Failed tokenData during DB insert exception:', JSON.stringify(tokenData));
        return new Response(
          JSON.stringify({ error: 'Failed to insert token due to DB exception', details: dbError.message }),
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

    // Extract sessionToken value from cookies for use in pb-link-updater
    let sessionToken = '';
    // *** DETAILED LOGGING ADDED ***
    console.log('[Cookie Search] Received authData.cookies:', JSON.stringify(authData.cookies));
    console.log(`[Cookie Search] Type of authData.cookies: ${typeof authData.cookies}, Is Array: ${Array.isArray(authData.cookies)}`);

    if (authData.cookies && Array.isArray(authData.cookies)) {
      console.log(`[Cookie Search] Processing ${authData.cookies.length} cookies...`);
      authData.cookies.forEach((cookie, index) => {
        console.log(`[Cookie Search] Cookie ${index}: Name=${cookie.name}, Value Length=${cookie.value?.length || 0}, Domain=${cookie.domain}, Path=${cookie.path}`);
      });

      // Try specific ProductBoard authentication cookies first
      const pbdCookie = authData.cookies.find(cookie => cookie.name === '_pbd');
      if (pbdCookie) {
        sessionToken = pbdCookie.value;
        console.log('Found _pbd authentication cookie');
      } else {
        // Fallback to other ProductBoard-specific cookies or generic auth names
        const possibleAuthCookies = authData.cookies.filter(cookie => {
          const name = cookie.name.toLowerCase();
          return name.startsWith('_pb') || // ProductBoard specific prefixes
                 name.includes('productboard') ||
                 name.includes('token') ||
                 name.includes('auth') ||
                 name.includes('session') ||
                 name.includes('login') ||
                 name.includes('user');
        });

        if (possibleAuthCookies.length > 0) {
          // Use the longest cookie value as it's likely the auth token
          const longestCookie = possibleAuthCookies.reduce((longest, current) => {
            const currentLength = current.value ? current.value.length : 0;
            const longestLength = longest.value ? longest.value.length : 0; // Safely access length
            return currentLength > longestLength ? current : longest;
          }, possibleAuthCookies[0]); // Initialize with the first possible cookie

          sessionToken = longestCookie.value;
          console.log(`Using ${longestCookie.name} as auth cookie with length ${sessionToken ? sessionToken.length : 0}`);
        } else {
          console.warn('[Cookie Search] No suitable ProductBoard auth cookie found after checking _pbd and fallbacks.'); // More specific warning
        }
      }
    } else {
      console.warn(`[Cookie Search] authData.cookies is missing, not an array, or empty. Type: ${typeof authData.cookies}, Is Array: ${Array.isArray(authData.cookies)}`); // More detailed warning
    }

    // Also save the session token to system_config table for use by pb-link-updater
    if (sessionToken) {
      try {
        const { error: configError } = await supabaseAdmin
          .from('system_config')
          .upsert(
            {
              key: 'pb_session_token',
              value: sessionToken,
              description: 'ProductBoard session token for UI automation',
              updated_at: new Date().toISOString()
            },
            { onConflict: 'key' }
          );

        if (configError) {
          console.error('Error updating system_config with sessionToken:', configError);
          // Continue anyway, as the main token data was saved successfully
        } else {
          console.log('Successfully updated system_config with sessionToken');
        }
      } catch (configUpdateError) {
        console.error('Exception updating system_config with sessionToken:', configUpdateError);
        // Continue anyway, as the main token data was saved successfully
      }
    } else {
      console.warn('No sessionToken found to save to system_config');
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'ProductBoard tokens captured and saved successfully',
        expiresAt: expiresAt.toISOString(),
        sessionTokenSaved: !!sessionToken
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
      try {
        // Wait for navigation AFTER login, potentially to a dashboard or the original board URL
        console.log('Waiting for navigation after login (up to 5 minutes)...');
        await page.waitForNavigation({ timeout: 300000, waitUntil: 'networkidle2' }); // Wait longer and for network idle
        console.log('Navigation detected after login.');
      } catch (navError) {
        console.error('Timeout or error waiting for navigation after login:', navError);
        // Check if we are already on the target board URL, maybe login redirected directly
        if (!page.url().includes(boardUrl.split('?')[0])) { // Check base URL match
          console.log(`Current URL ${page.url()} does not match target ${boardUrl}. Throwing error.`);
          await page.screenshot({ path: `/tmp/login_nav_error_${Date.now()}.png` }); // Screenshot on error
          throw new Error('Login process did not complete successfully within the time limit.');
        }
        console.log('Already on a relevant page or navigation failed, proceeding cautiously...');
      }
    } else {
      // Headless mode still not supported for interactive login
      console.error('Headless mode requires pre-stored credentials, which is not implemented');
      throw new Error('Interactive login required but not available in headless mode');
    }

    // Ensure we are on the board page or navigate if needed
    if (!page.url().includes(boardUrl.split('?')[0])) {
      console.log(`Not on board URL, navigating to: ${boardUrl}`);
      await page.goto(boardUrl, {
        timeout: TIMEOUT,
        waitUntil: 'networkidle2' // Wait for network idle
      });
      console.log('Navigation to board URL complete.');
    } else {
      console.log('Already on board URL.');
    }

    // Wait for a known element on the board page to ensure it's loaded
    // Example: wait for a common header element or main content area
    // THIS SELECTOR IS A GUESS AND NEEDS TO BE VERIFIED/ADJUSTED
    const boardPageSelector = 'header, #main-content, [data-testid="board-view"], [class*="PageLayout__pageHeader"]'; // Added common layout class
    console.log(`Waiting for board page element (${boardPageSelector}) to load...`);
    try {
      await page.waitForSelector(boardPageSelector, { timeout: 30000 }); // 30 second wait
      console.log('Board page element found.');
    } catch (loadError) {
      console.error('Board page did not seem to load correctly:', loadError);
      // Optionally take screenshot here
      await page.screenshot({ path: `/tmp/board_load_error_${Date.now()}.png` });
      throw new Error('Failed to confirm board page loaded successfully.');
    }


    // Extract all cookies
    console.log('Extracting authentication cookies...');
    const cookies = await page.cookies();

    // *** ADDED CHECK ***
    if (!cookies || cookies.length === 0) {
      console.error('No cookies were extracted after login and navigation.');
      await page.screenshot({ path: `/tmp/no_cookies_error_${Date.now()}.png` });
      throw new Error('Failed to extract authentication cookies. Login might have failed or page did not load correctly.');
    }
    console.log(`Successfully extracted ${cookies.length} cookies.`);

    // Extract user information if possible
    console.log('Attempting to extract user information...');
    let userId = null;
    let userEmail = null;

    try {
      // Try to extract user information from the page
      const userInfo = await page.evaluate(() => {
        // Check localStorage for user info
        let id: string | null = null; // Allow string type
        let email: string | null = null; // Allow string type

        // Common patterns for user info storage in ProductBoard
        const userKeyPatterns = ['user', 'currentUser', 'pb_user', 'account'];

        // Look through localStorage for user info
        if (typeof localStorage !== 'undefined' && localStorage !== null) { // Check if localStorage exists
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
    let localStorageData = {}; // Renamed variable
    try {
      localStorageData = await page.evaluate(() => {
        const items = {};
        if (typeof localStorage !== 'undefined' && localStorage !== null) { // Check if localStorage exists
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) { // Check if key is not null
              items[key] = localStorage.getItem(key);
            }
          }
        }
        return items;
      });
    } catch (e) {
      console.warn('Could not extract localStorage:', e);
    }

    // Extract sessionStorage items if possible
    let sessionStorageData = {}; // Renamed variable
    try {
      sessionStorageData = await page.evaluate(() => {
        const items = {};
        if (typeof sessionStorage !== 'undefined' && sessionStorage !== null) { // Check if sessionStorage exists
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) { // Check if key is not null
              items[key] = sessionStorage.getItem(key);
            }
          }
        }
        return items;
      });
    } catch (e) {
      console.warn('Could not extract sessionStorage:', e);
    }

    // Combine all authentication data
    const authData = {
      cookies,
      localStorage: localStorageData, // Use renamed variable
      sessionStorage: sessionStorageData, // Use renamed variable
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

    // Clone the response so we can log it and still parse it as JSON
    const runResponseClone = runResponse.clone();

    // Log the full raw response for debugging
    const rawResponseText = await runResponseClone.text();
    console.log('======= FULL APIFY RUN RESPONSE =======');
    console.log(rawResponseText);
    console.log('=======================================');

    // Parse the run response to get run info
    let runInfo;
    try {
      runInfo = await runResponse.json();
      // Check if the response data is nested inside a 'data' property
      console.log(`Run info keys: ${Object.keys(runInfo || {}).join(', ')}`);

      // If the response has a nested 'data' field, log its ID
      if (runInfo?.data) {
        console.log(`Run started with ID: ${runInfo.data.id}`);
        console.log(`Data property keys: ${Object.keys(runInfo.data || {}).join(', ')}`);
      } else {
        console.log(`Run started with ID: ${runInfo?.id}`);
      }

      console.log(`Full run info: ${JSON.stringify(runInfo)}`);
    } catch (parseError) {
      console.error(`Error parsing Apify run response: ${parseError.message}`);
      console.error(`Response was: ${rawResponseText}`);
      throw new Error(`Failed to parse Apify run response: ${parseError.message}`);
    }

    // Extract the default key-value store ID from the run info
    // Check if we need to access the nested 'data' property
    const keyValueStoreId = runInfo?.data?.defaultKeyValueStoreId || runInfo?.defaultKeyValueStoreId;
    if (!keyValueStoreId) {
      console.error('No default key-value store ID found in run response');
      console.error(`Available properties: ${Object.keys(runInfo || {}).join(', ')}`);
      if (runInfo?.data) {
        console.error(`Nested data properties: ${Object.keys(runInfo.data || {}).join(', ')}`);
      }
      throw new Error('Failed to get key-value store ID from run response');
    }

    console.log(`Found key-value store ID: ${keyValueStoreId}`);

    // Get run ID from the appropriate location in the response
    const runId = runInfo?.data?.id || runInfo?.id;
    console.log(`Using run ID for monitoring: ${runId || 'unknown'}`);

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
    // *** ADDED LOGGING ***
    console.log(`[Apify] Received OUTPUT value (length: ${outputText.length}): ${outputText.substring(0, 500)}...`); // Log raw output

    try {
      // *** HANDLE DOUBLE STRINGIFICATION ***
      let finalParsedOutput: any;
      try {
        // First parse attempt
        let firstParseResult = JSON.parse(outputText);

        // Check if the result of the first parse is a string (indicating double stringification)
        if (typeof firstParseResult === 'string') {
          console.log('[Apify] Detected double stringification. Parsing inner string...');
          // Second parse attempt
          finalParsedOutput = JSON.parse(firstParseResult);
          console.log('[Apify] Successfully parsed inner string.');
        } else {
          // If the first parse resulted in an object, use it directly
          console.log('[Apify] Single stringification detected. Using first parse result.');
          finalParsedOutput = firstParseResult;
        }
      } catch (initialParseError) {
         console.error(`[Apify] Error during initial JSON parsing: ${initialParseError.message}`);
         console.error(`[Apify] Raw outputText was: ${outputText}`);
         throw new Error(`Failed to parse Apify OUTPUT: ${initialParseError.message}`);
      }

      // *** ADDED LOGGING ***
      console.log('[Apify] Successfully obtained final parsed OUTPUT JSON:', JSON.stringify(finalParsedOutput)); // Log final parsed data

      // *** USE finalParsedOutput FOR TRANSFORMATION ***
      let cookiesArray: any[] = [];
      // Use finalParsedOutput here
      const actualCookiesObject = finalParsedOutput.cookies || {};
      const domain = finalParsedOutput.domain || '.productboard.com'; // Use domain from final output

      // Check if actualCookiesObject is a non-null object and has keys
      if (typeof actualCookiesObject === 'object' && actualCookiesObject !== null && Object.keys(actualCookiesObject).length > 0) {
          console.log(`[Apify] Transforming ${Object.keys(actualCookiesObject).length} cookies from object format...`);
          cookiesArray = Object.entries(actualCookiesObject).map(([name, value]) => {
            // Ensure value is a string, as expected by the cookie structure
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value); // Keep this conversion
            console.log(`[Apify] Mapping cookie: Name=${name}, Value Length=${stringValue?.length || 0}`);
            return {
              name: name,
              value: stringValue, // Ensure value is a string
              domain: domain, // Add domain info from Apify output or default
              path: '/', // Default path, adjust if Apify provides it
              expires: -1, // Default, adjust if Apify provides it
              httpOnly: false, // Default, adjust if Apify provides it
              secure: true, // Assume secure, adjust if Apify provides it
              sameSite: 'Lax' // Default, adjust if Apify provides it
            };
          });
          console.log(`[Apify] Successfully transformed cookies object into array with ${cookiesArray.length} items.`);
      } else {
          // *** FIXED TYPO HERE ***
          console.warn(`[Apify] actualCookiesObject is not a valid object or is empty. Type: ${typeof actualCookiesObject}, Keys: ${Object.keys(actualCookiesObject || {}).length}`);
      }

      // Return the token data in the expected format
      // Ensure the keys match what the main handler expects (cookies, localStorage, userId, userEmail)
      const returnData = {
        cookies: cookiesArray, // Use the transformed array
        localStorage: finalParsedOutput.localStorage || {}, // Use finalParsedOutput
        sessionStorage: null, // Apify doesn't extract session storage
        userId: finalParsedOutput.userId || null, // Use finalParsedOutput
        userEmail: finalParsedOutput.userEmail || null, // Use finalParsedOutput
        timestamp: finalParsedOutput.timestamp || new Date().toISOString() // Use finalParsedOutput
      };
       // *** ADDED LOGGING ***
      console.log('[Apify] Returning structured data:', JSON.stringify(returnData));
      return returnData;
    } catch (parseError) {
      console.error(`[Apify] Error parsing OUTPUT response as JSON: ${parseError.message}`);
      // Log more of the output text on error
      console.log(`[Apify] Full OUTPUT response on parse error: ${outputText}`);
      
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
