import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
import { corsHeaders } from '../_shared/cors.ts'; // Assuming shared CORS headers

// --- Configuration ---
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TIMEOUT = 60000; // 60 seconds timeout for Puppeteer operations

// --- Supabase Client Initialization ---
let supabaseAdmin: SupabaseClient;
try {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  console.log('Supabase admin client initialized.');
} catch (e) {
  console.error('FATAL: Failed to initialize Supabase client:', e);
  throw e; // Fail fast if Supabase client cannot be created
}

// --- Helper Function: Inject Local Storage ---
async function injectLocalStorage(page: puppeteer.Page, storage: Record<string, string> | null) {
    if (!storage || typeof storage !== 'object' || Object.keys(storage).length === 0) {
        console.warn('No valid local storage data provided to inject.');
        return;
    }
    console.log(`Injecting ${Object.keys(storage).length} local storage items...`);
    try {
        await page.evaluate((items) => {
            for (const key in items) {
                localStorage.setItem(key, items[key]);
            }
        }, storage);
        console.log('Local storage injected successfully.');
    } catch (error) {
        console.error('Error injecting local storage:', error);
    }
}


// --- Helper Function: Inject Cookies ---
async function injectCookies(page: puppeteer.Page, cookies: any[]) {
    if (!cookies || !Array.isArray(cookies)) {
        console.warn('No valid cookies provided to inject.');
        return;
    }
    console.log(`Injecting ${cookies.length} cookies...`);
    try {
        // Puppeteer's setCookie requires specific fields. Map the stored cookies.
        const puppeteerCookies = cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path || '/',
            expires: cookie.expires || cookie.expirationDate || -1,
            httpOnly: cookie.httpOnly || false,
            secure: cookie.secure || false,
            sameSite: cookie.sameSite || 'Lax', // Default to Lax if not specified
        }));
        await page.setCookie(...puppeteerCookies);
        console.log('Cookies injected successfully.');
    } catch (error) {
        console.error('Error injecting cookies:', error);
        // Decide if this is a fatal error or if we can continue
    }
}


// --- Main Automation Logic ---
async function linkPbToAdoViaUi(
  pbStoryUrl: string,
  adoProjectName: string,
  adoStoryId: string
): Promise<{ success: boolean; message: string; screenshot?: string }> {
  console.log(`Starting UI automation for PB Story: ${pbStoryUrl}, ADO Project: ${adoProjectName}, ADO ID: ${adoStoryId}`);

  // 1. Retrieve PB Auth Cookies and Local Storage from productboard_auth_tokens
  let pbCookies: any[] = [];
  let pbLocalStorage: Record<string, string> | null = null;

  try {
    console.log('Retrieving latest valid auth data from productboard_auth_tokens...');
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('productboard_auth_tokens')
      .select('auth_cookies, local_storage') // Select both cookies and local storage
      .eq('is_valid', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError) {
      console.error('Error retrieving auth data from productboard_auth_tokens:', tokenError.message);
      throw new Error('Failed to retrieve ProductBoard authentication data.');
    }

    if (!tokenData) {
      console.error('No valid ProductBoard authentication data found in productboard_auth_tokens.');
      return { success: false, message: 'ProductBoard authentication data not found or expired. Please capture tokens again.' };
    }

    // Validate and assign cookies
    if (tokenData.auth_cookies && Array.isArray(tokenData.auth_cookies) && tokenData.auth_cookies.length > 0) {
      pbCookies = tokenData.auth_cookies;
      console.log(`Retrieved ${pbCookies.length} authentication cookies.`);
    } else {
      console.error('No valid cookies found in the retrieved authentication data.');
      return { success: false, message: 'Valid ProductBoard cookies not found. Please capture tokens again.' };
    }

    // Validate and assign local storage
    if (tokenData.local_storage && typeof tokenData.local_storage === 'object' && Object.keys(tokenData.local_storage).length > 0) {
      pbLocalStorage = tokenData.local_storage;
      // Add null check before accessing Object.keys
      console.log(`Retrieved ${pbLocalStorage ? Object.keys(pbLocalStorage).length : 0} items from local_storage.`);
    } else {
      console.log('No local_storage data found in the latest valid token entry.');
      // Continue without local storage if not found, but cookies are essential
    }

  } catch (dbError) {
    console.error('Exception retrieving auth data:', dbError);
    return { success: false, message: `Error accessing authentication data: ${dbError.message}` };
  }

  // 2. Launch Puppeteer
  let browser: puppeteer.Browser | null = null;
  let screenshotPath: string | undefined = undefined;
  try {
    console.log('Launching browser...');
    // Adopted options from scrape-productboard-rankings
    browser = await puppeteer.launch({
      headless: true, // Should be true for Supabase Edge Functions
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for Deno Deploy/Supabase
    });
    const page = await browser.newPage();
    console.log('Browser launched.');

    // Set viewport and user agent (adopted from scrape-productboard-rankings)
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 3. Inject Cookies and Local Storage
    await injectCookies(page, pbCookies);
    await injectLocalStorage(page, pbLocalStorage); // Inject local storage

    // 4. Navigate to PB Story URL
    console.log(`Navigating to ${pbStoryUrl}...`);
    await page.goto(pbStoryUrl, {
      waitUntil: 'networkidle2', // Wait until network is idle
      timeout: TIMEOUT
    });
    console.log('Navigation complete.');

    // Check if authentication was successful (adopted from scrape-productboard-rankings)
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl !== pbStoryUrl) {
      console.error(`Authentication failed. Redirected to ${currentUrl}`);
      throw new Error('Authentication failed. Session cookies may have expired.');
    }

    await page.waitForTimeout(5000); // Extra wait for dynamic content (matched scraper)

    // --- UI Automation Steps ---
    // These selectors are based on typical web patterns and the screenshots.
    // They WILL likely need adjustment based on ProductBoard's actual DOM.

    // 5. Click ADO Integration Button
    console.log('Looking for ADO Integration section/button...');
    // Selector might need refinement. Looking for a button near "ADO Integration".
    // Using text content might be more robust if IDs/classes change.
    const integrationButtonSelector = 'xpath/.//div[contains(., "ADO Integration")]//button[contains(., "Push") or contains(@aria-label, "Push") or contains(@aria-label, "Link")]';
    await page.waitForXPath(integrationButtonSelector, { timeout: TIMEOUT });
    const integrationButtons = await page.$x(integrationButtonSelector);
    if (integrationButtons.length === 0) throw new Error('Could not find ADO Integration button.');
    console.log('Clicking ADO Integration button...');
    await (integrationButtons[0] as puppeteer.ElementHandle<Element>).click();


    // 6. Wait for Modal and Click "Link to existing issue"
    console.log('Waiting for modal and "Link to existing issue" tab...');
    const linkTabSelector = 'button[role="tab"]:contains("Link to existing issue")'; // Adjust if needed
    // More robust: Wait for the modal container first, then the tab
    await page.waitForSelector('div[role="dialog"]', { timeout: TIMEOUT });
    await page.waitForSelector(linkTabSelector, { visible: true, timeout: TIMEOUT });
    console.log('Clicking "Link to existing issue" tab...');
    await page.click(linkTabSelector);

    // 7. Select ADO Project
    console.log(`Selecting ADO Project: ${adoProjectName}...`);
    // Assuming the project dropdown has a label or identifiable attribute
    const projectDropdownSelector = 'xpath/.//label[contains(., "AZURE DEVOPS PROJECT")]/following-sibling::button | //button[contains(@aria-label, "project")]'; // Example selectors
    await page.waitForSelector(projectDropdownSelector, { visible: true, timeout: TIMEOUT });
    await page.click(projectDropdownSelector);
    await page.waitForTimeout(500); // Wait for dropdown options to render

    // Find and click the project name in the dropdown list
    const projectOptionSelector = `xpath/.//div[contains(@role, "listbox")]//div[contains(text(), "${adoProjectName}")] | //div[contains(@role, "option") and contains(text(), "${adoProjectName}")]`; // Adjust based on actual dropdown structure
    await page.waitForXPath(projectOptionSelector, { visible: true, timeout: TIMEOUT });
    const projectOptions = await page.$x(projectOptionSelector);
    if (projectOptions.length === 0) throw new Error(`Could not find project option "${adoProjectName}".`);
    await (projectOptions[0] as puppeteer.ElementHandle<Element>).click();
    console.log('Project selected.');
    await page.waitForTimeout(500); // Wait after selection

    // 8. Enter ADO Story ID
    console.log(`Entering ADO Story ID: ${adoStoryId}...`);
    // Assuming the input has a label or identifiable attribute
    const workItemIdInputSelector = 'input[id*="work-item-id"], input[aria-label*="Work Item ID"], input[placeholder*="Work Item ID"]'; // Example selectors
    await page.waitForSelector(workItemIdInputSelector, { visible: true, timeout: TIMEOUT });
    await page.type(workItemIdInputSelector, adoStoryId, { delay: 50 }); // Add slight delay
    console.log('Story ID entered.');

    // 9. Click Link Button
    console.log('Looking for Link button...');
    // Selector for the final link button in the modal
    const linkButtonSelector = 'div[role="dialog"] button:contains("Link")'; // Adjust if needed
    await page.waitForSelector(linkButtonSelector, { visible: true, timeout: TIMEOUT });
    console.log('Clicking Link button...');
    await page.click(linkButtonSelector);

    // 10. Wait for Confirmation (e.g., modal closes)
    console.log('Waiting for confirmation (modal to close)...');
    await page.waitForSelector('div[role="dialog"]', { hidden: true, timeout: TIMEOUT });
    console.log('Modal closed, assuming success.');

    // --- End UI Automation ---

    return { success: true, message: 'Successfully linked PB story to ADO via UI automation.' };

  } catch (error) {
    console.error('Error during UI automation:', error);
    // Try to take a screenshot on error
    if (browser && browser.connected) {
        try {
            const page = (await browser.pages())[0]; // Get current page
            screenshotPath = `/tmp/pb_link_error_${Date.now()}.png`; // Deno Deploy supports /tmp
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved to ${screenshotPath}`);
        } catch (screenshotError) {
            console.error('Failed to take screenshot:', screenshotError);
        }
    }
    return {
        success: false,
        message: `UI automation failed: ${error.message}`,
        screenshot: screenshotPath ? `Screenshot saved at: ${screenshotPath}` : undefined
     };
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
      console.log('Browser closed.');
    }
  }
}

// --- API Handler ---
serve(async (req) => {
  console.log(`---> Received request: ${req.method} ${req.url}`);

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { pbStoryUrl, adoProjectName, adoStoryId } = body;

      if (!pbStoryUrl || !adoProjectName || !adoStoryId) {
        return new Response(JSON.stringify({ error: 'Missing required fields: pbStoryUrl, adoProjectName, adoStoryId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Perform the automation
      const result = await linkPbToAdoViaUi(pbStoryUrl, adoProjectName, adoStoryId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (error) {
      console.error('Error processing POST request:', error);
      return new Response(JSON.stringify({ error: 'Failed to parse request body or unexpected error', details: error.message }), {
        status: 400, // Bad Request or 500 Internal Server Error
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  // Fallback for other methods
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Allow': 'POST, OPTIONS' },
  });
});

console.log('pb-link-via-ui function started.');
