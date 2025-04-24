const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { ApifyClient } = require('apify-client'); // Re-enabled ApifyClient
const { createClient } = require('@supabase/supabase-js'); // Added Supabase client
// const { linkPbToAdo } = require('./pbAdoLinker'); // Puppeteer import remains removed
const { linkPbToAdoPlaywright } = require('./pbAdoLinkerPlaywright'); // Keep Playwright import for now, though unused in endpoint

// --- Load Environment Variables ---

// 1. Load from project root .env first (for SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY etc.)
const rootEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
  console.log('Loading root environment variables from:', rootEnvPath);
  dotenv.config({ path: rootEnvPath });
} else {
  console.warn('Root .env file not found at:', rootEnvPath);
  // Attempt default load (looks for .env in current dir: proxy-server/)
  dotenv.config();
}

// 2. Load (and potentially override) from pb-connect/.env (for PRODUCTBOARD_API_KEY)
const pbConnectEnvPath = path.resolve(__dirname, './lib/pb-connect/.env');
if (fs.existsSync(pbConnectEnvPath)) {
  console.log('Loading ProductBoard environment variables from:', pbConnectEnvPath);
  // Use override: false if you want root .env to take precedence if keys conflict
  dotenv.config({ path: pbConnectEnvPath, override: true });
} else {
  console.warn('ProductBoard .env file not found at:', pbConnectEnvPath);
}


// Import pb-connect module
const pbConnect = require('./lib/pb-connect');

// --- Initialize Clients ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Using anon key for read-only token access might be safer? Check table RLS.
const apifyToken = process.env.APIFY_API_TOKEN;

if (!supabaseUrl || !supabaseKey || !apifyToken) {
  console.error('FATAL: Missing required environment variables for Supabase/Apify client initialization (SUPABASE_URL, SUPABASE_KEY, APIFY_API_TOKEN).');
  process.exit(1); // Exit if essential config is missing
}

const supabase = createClient(supabaseUrl, supabaseKey);
const apifyClient = new ApifyClient({ token: apifyToken }); // Re-enabled ApifyClient initialization

console.log('Supabase and Apify clients initialized.'); // Updated log

const app = express();
// Use Render's PORT environment variable, falling back to 3008 for local dev
const PORT = process.env.PORT || 3008;

// Enable CORS for all routes
app.use(cors());

// Add JSON body parser for POST requests
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Proxy middleware for Azure DevOps API
app.use('/ado', createProxyMiddleware({
  target: 'https://dev.azure.com',
  changeOrigin: true,
  pathRewrite: {
    '^/ado': '', // Remove the '/ado' prefix when forwarding
  },
  // Forward the authorization header
  onProxyReq: (proxyReq, req) => {
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }

    // Log the proxied request
    console.log(`[${new Date().toISOString()}] Proxying to: ${proxyReq.path}`);
  },
  // Log the proxy response
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[${new Date().toISOString()}] Proxy response: ${proxyRes.statusCode}`);
  },
  // Handle errors
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] Proxy error:`, err);
    res.status(500).send('Proxy Error: ' + err.message);
  }
}));

// Proxy middleware for ProductBoard API
app.use('/pb-api', createProxyMiddleware({
  target: 'https://api.productboard.com',
  changeOrigin: true,
  pathRewrite: {
    '^/pb-api': '/v1', // Replace '/pb-api' with '/v1' to match ProductBoard's API structure
  },
  // Forward the authorization header
  onProxyReq: (proxyReq, req) => {
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }

    // Make sure the content type is set correctly
    if (req.method === 'POST' || req.method === 'PUT') {
      proxyReq.setHeader('Content-Type', 'application/json');
    }

    // Version header required by ProductBoard
    proxyReq.setHeader('X-Version', '1');

    // Log the proxied request
    console.log(`[${new Date().toISOString()}] Proxying ProductBoard request to: ${proxyReq.path}`);
  },
  // Log the proxy response
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[${new Date().toISOString()}] ProductBoard proxy response: ${proxyRes.statusCode}`);
  },
  // Handle errors
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] ProductBoard proxy error:`, err);
    res.status(500).send('Proxy Error: ' + err.message);
  }
}));

// Proxy middleware for Supabase Functions
const SUPABASE_URL = process.env.SUPABASE_URL || ''; // Ensure SUPABASE_URL is loaded
if (!SUPABASE_URL) {
  console.error('Error: SUPABASE_URL environment variable is not set. Cannot proxy functions.');
} else {
  const functionsTarget = `${new URL(SUPABASE_URL).origin}`; // Get the base origin (e.g., https://xyz.supabase.co)
  console.log(`Proxying /functions/v1 requests to: ${functionsTarget}`);

  app.use('/functions/v1', createProxyMiddleware({
    target: functionsTarget,
    changeOrigin: true,
    proxyTimeout: 150000, // 150 seconds timeout
    // Inject Service Role Key for auth bypass (TEMPORARY/INSECURE)
    onProxyReq: (proxyReq, req) => {
      // REMOVED: Don't forward user auth header from incoming request
      // if (req.headers.authorization) {
      //   proxyReq.setHeader('Authorization', req.headers.authorization);
      // }

      // ADD: Inject the Service Role Key as the Authorization token
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        proxyReq.setHeader('Authorization', `Bearer ${serviceKey}`);
        console.log(`[${new Date().toISOString()}] Injected Service Role Key into Authorization header.`);
      } else {
        console.error(`[${new Date().toISOString()}] Error: SUPABASE_SERVICE_ROLE_KEY is not set. Cannot inject auth header.`);
      }

      // Forward Supabase Anon Key (still required)
      if (req.headers.apikey) {
         proxyReq.setHeader('apikey', req.headers.apikey);
      }
      console.log(`[${new Date().toISOString()}] Proxying Supabase Function request to: ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[${new Date().toISOString()}] Supabase Function proxy response: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`[${new Date().toISOString()}] Supabase Function proxy error:`, err);
      res.status(500).send('Proxy Error: ' + err.message);
    }
  }));
}


// Add ProductBoard sync endpoint
app.post('/pb/sync', async (req, res) => {
  try {
    // Validate that required environment variables are set
    const requiredVars = [
      'PRODUCTBOARD_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_KEY'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      return res.status(500).json({
        success: false,
        message: `Missing required environment variables: ${missing.join(', ')}`
      });
    }

    // Extract options from request body
    const { workspaceId, boardId = '00000000-0000-0000-0000-000000000000', reset = false, resetTables = [] } = req.body;

    console.log(`Starting ProductBoard sync with options:`, {
      workspaceId: workspaceId || process.env.PRODUCTBOARD_WORKSPACE_ID,
      boardId,
      reset,
      resetTables
    });

    // Call the syncProductBoardData function directly
    const result = await pbConnect.syncProductBoardData(
      workspaceId || process.env.PRODUCTBOARD_WORKSPACE_ID,
      boardId,
      { reset, resetTables }
    );

    // Return the result
    res.json(result);
  } catch (error) {
    console.error('Error syncing ProductBoard data:', error);
    res.status(500).json({
      success: false,
      message: `Error: ${error.message}`
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Proxy server is running');
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Use http://localhost:${PORT}/ado/[organization]/[project]/... to access Azure DevOps API`);
  console.log(`Use http://localhost:${PORT}/pb/sync to sync ProductBoard data`);
  console.log(`Use http://localhost:${PORT}/apify/run-pb-linker to trigger Apify actor`);
  console.log(`Use http://localhost:${PORT}/apify/get-status to check latest Apify actor run status`);
});

// Add endpoint to check status of latest Apify actor runs
app.get('/apify/get-status', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Retrieving latest Apify actor run status`);
    
    // Get the actor name
    const actorName = 'alexandra.cohen/pb-ado-linker';
    
    // Get the list of latest runs
    const { items: runs } = await apifyClient.actor(actorName).runs().list({
      limit: 5, // Get the 5 most recent runs
      desc: true // Descending order (newest first)
    });
    
    if (!runs || runs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No Apify actor runs found'
      });
    }
    
    // Format the response with essential information for each run
    const formattedRuns = runs.map(run => ({
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      buildId: run.buildId,
      exitCode: run.exitCode,
      errorMessage: run.errorMessage,
      defaultKeyValueStoreId: run.defaultKeyValueStoreId,
      durationSecs: run.finishedAt 
        ? Math.round((new Date(run.finishedAt) - new Date(run.startedAt)) / 1000)
        : (run.status === 'RUNNING' 
            ? Math.round((new Date() - new Date(run.startedAt)) / 1000) 
            : null)
    }));
    
    // Extract detailed information for the latest run
    const latestRun = formattedRuns[0];
    let outputData = null;
    
    if (latestRun && latestRun.defaultKeyValueStoreId) {
      try {
        // Attempt to get the OUTPUT record from the key-value store
        const outputRecord = await apifyClient.keyValueStore(latestRun.defaultKeyValueStoreId).getRecord('OUTPUT');
        if (outputRecord && outputRecord.value) {
          outputData = outputRecord.value;
        }
      } catch (outputError) {
        console.warn(`Could not retrieve OUTPUT for run ${latestRun.id}:`, outputError.message);
      }
    }
    
    return res.status(200).json({
      success: true,
      latestRun: {
        ...latestRun,
        output: outputData
      },
      recentRuns: formattedRuns.slice(1) // All runs except the latest
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error retrieving Apify actor run status:`, error);
    return res.status(500).json({
      success: false,
      message: `Error retrieving Apify actor run status: ${error.message}`
    });
  }
});


// --- New Endpoint for Direct Apify Call ---
app.post('/apify/run-pb-linker', async (req, res) => {
  console.log(`[${new Date().toISOString()}] Received request for /apify/run-pb-linker`);
  const { pbStoryUrl, adoProjectName, adoStoryId } = req.body;

  if (!pbStoryUrl || !adoProjectName || !adoStoryId) {
    return res.status(400).json({ success: false, message: 'Missing required fields: pbStoryUrl, adoProjectName, adoStoryId' });
  }

  try {
    // 1. Fetch PB Tokens from Supabase
    console.log('Fetching ProductBoard tokens from Supabase...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('productboard_auth_tokens')
      .select('auth_cookies, local_storage')
      .eq('is_valid', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError) {
      console.error('Supabase error fetching tokens:', tokenError.message);
      throw new Error(`Failed to retrieve ProductBoard authentication data: ${tokenError.message}`);
    }

    if (!tokenData || !tokenData.auth_cookies || tokenData.auth_cookies.length === 0) {
      console.error('No valid ProductBoard authentication data found in Supabase.');
      return res.status(400).json({ success: false, message: 'ProductBoard authentication data not found or expired. Please capture tokens again.' });
    }
    console.log(`Retrieved ${tokenData.auth_cookies.length} cookies and ${tokenData.local_storage ? Object.keys(tokenData.local_storage).length : 0} local storage items.`);

    // 2. Prepare Apify Actor Input
    console.log('Preparing Apify actor input...');
    const actorInput = {
      pbStoryUrl, // Correct
      // pbStoryUrl, // *** REMOVED duplicate line ***
      adoProjectName,
      adoStoryId,
      // *** REVERTED: Don't send empty data ***
      // pbCookies: [], // Send empty array
      // pbLocalStorage: {}, // Send empty object
      pbCookies: tokenData.auth_cookies,
      pbLocalStorage: tokenData.local_storage || {}, // Pass empty object if null
    };
    // console.log('*** TESTING: Sending EMPTY pbCookies and pbLocalStorage ***'); // Remove test log

    // *** REVERTED: Remove cookie filtering, send all cookies again ***
    // const essentialCookieNames = ['session', 'token', 'auth', 'csrf', 'user']; // Add other potential names if known
    // const filteredCookies = actorInput.pbCookies.filter(cookie =>
    //     essentialCookieNames.some(namePart => cookie.name.toLowerCase().includes(namePart))
    // );
    // console.log(`Filtered ${actorInput.pbCookies.length} cookies down to ${filteredCookies.length} potentially essential cookies.`);
    // if (filteredCookies.length === 0 && actorInput.pbCookies.length > 0) {
    //     console.warn("Warning: Filtering removed all cookies. Sending the first cookie to satisfy 'minItems: 1'. This might fail authentication.");
    //     // Send just the first cookie if filtering removed all, to satisfy the schema
    //     actorInput.pbCookies = [actorInput.pbCookies[0]];
    // } else {
    //     actorInput.pbCookies = filteredCookies; // Use the filtered list
    // }
    // *** END REVERTED FILTER ***


    // Log the input structure being sent to Apify for debugging
    console.log('--- Sending Input to Apify Actor ---');
    console.log(`Input Keys: ${Object.keys(actorInput).join(', ')}`);
    console.log(`pbCookies Type: ${typeof actorInput.pbCookies}, Is Array: ${Array.isArray(actorInput.pbCookies)}, Length: ${Array.isArray(actorInput.pbCookies) ? actorInput.pbCookies.length : 'N/A'}`);
    console.log(`pbLocalStorage Type: ${typeof actorInput.pbLocalStorage}, Keys: ${actorInput.pbLocalStorage ? Object.keys(actorInput.pbLocalStorage).length : 'N/A'}`);
    // console.log('Full Input (excluding potentially large auth data):', JSON.stringify({ ...actorInput, pbCookies: `[${actorInput.pbCookies.length} items]`, pbLocalStorage: `[${actorInput.pbLocalStorage ? Object.keys(actorInput.pbLocalStorage).length : 0} items]` }, null, 2));

    // *** END ADDED LOG *** // Keep this log for input structure

    // 3. Call Apify Actor
    const actorName = 'alexandra.cohen/pb-ado-linker'; // Actor name provided by user
    console.log(`Calling Apify actor: ${actorName}...`);
    const actorRun = await apifyClient.actor(actorName).call(actorInput, {
        // Optional: Set memory, timeout, build etc. if needed
        // memory: 4096,
        timeout: 180, // 3 minutes timeout for the actor run
    });

    // 4. Wait for Actor Run to Finish and Get Output
    console.log(`Apify actor run started with ID: ${actorRun.id}. Waiting for completion...`);
    const { status, output } = await apifyClient.run(actorRun.id).waitForFinish();

    console.log(`Apify actor run ${actorRun.id} finished with status: ${status}`);

    // 5. Handle Result from Apify Actor
    if (status === 'SUCCEEDED') {
        // Attempt to get the output from the default key-value store record "OUTPUT"
        const runOutput = await apifyClient.keyValueStore(actorRun.defaultKeyValueStoreId).getRecord('OUTPUT');

        if (runOutput && runOutput.value) {
            console.log('Apify actor succeeded. Output:', runOutput.value);
            // Assuming the actor output follows the { success: boolean, message: string, ... } structure
            return res.status(200).json(runOutput.value);
        } else {
            console.warn('Apify actor succeeded, but no OUTPUT record found or it was empty.');
            // Return a generic success if no specific output was set
            return res.status(200).json({ success: true, message: 'Apify actor run succeeded, but no output data was returned.' });
        }
    } else {
        // Handle failed/timed-out/aborted runs
        console.error(`Apify actor run ${actorRun.id} failed with status: ${status}.`);
        // Attempt to get failure output if the actor set it
        let failureMessage = `Apify actor run failed with status: ${status}. Check Apify console for logs. Run ID: ${actorRun.id}`;
        let stepFailed = 'Unknown';
        try {
            const failureOutput = await apifyClient.keyValueStore(actorRun.defaultKeyValueStoreId).getRecord('OUTPUT');
            if (failureOutput && failureOutput.value && failureOutput.value.message) {
                failureMessage = failureOutput.value.message;
                stepFailed = failureOutput.value.stepFailed || 'Unknown';
                console.error(`Failure details from actor output: Step="${stepFailed}", Message="${failureMessage}"`);
            }
        } catch (outputError) {
            console.error('Could not retrieve failure output from actor key-value store:', outputError.message);
        }

        return res.status(500).json({
            success: false,
            message: failureMessage,
            stepFailed: stepFailed,
            apifyRunId: actorRun.id // Include run ID for easier debugging in Apify console
        });
    }

  } catch (error) {
    // Catch errors originating from *this* endpoint handler (e.g., Supabase fetch error)
    console.error(`[${new Date().toISOString()}] Critical error in /apify/run-pb-linker endpoint handler:`, error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});
