// ../pbtoado/proxy-server/pbAdoLinker.js
const puppeteer = require('puppeteer');

// Helper Function: Inject Local Storage (Adapted from Apify actor)
async function injectLocalStorage(page, storage) {
    if (!storage || typeof storage !== 'object' || Object.keys(storage).length === 0) {
        console.warn('[Linker] No valid local storage data provided to inject.');
        return;
    }
    console.log(`[Linker] Injecting ${Object.keys(storage).length} local storage items...`);
    try {
        await page.evaluate((items) => {
            for (const key in items) {
                localStorage.setItem(key, items[key]);
            }
        }, storage);
        console.log('[Linker] Local storage injected successfully.');
    } catch (error) {
        console.error('[Linker] Error injecting local storage:', error.message);
        // Don't necessarily throw, maybe just warn
    }
}

// Helper Function: Inject Cookies (Adapted from Apify actor)
async function injectCookies(page, cookies) {
    if (!cookies || !Array.isArray(cookies)) {
        console.warn('[Linker] No valid cookies provided to inject.');
        return;
    }
    console.log(`[Linker] Injecting ${cookies.length} cookies...`);
    try {
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
        console.log('[Linker] Cookies injected successfully.');
    } catch (error) {
        console.error('[Linker] Error injecting cookies:', error.message);
        // Don't necessarily throw, maybe just warn
    }
}

// Main function to perform the linking via UI automation
async function linkPbToAdo(input) {
    const {
        pbStoryUrl,
        adoProjectName,
        adoStoryId,
        pbCookies,
        pbLocalStorage
    } = input;

    console.log('[Linker] --- Starting PB to ADO Link Process ---');
    console.log(`[Linker] PB Story URL: ${pbStoryUrl}`);
    console.log(`[Linker] ADO Project Name: ${adoProjectName}`);
    console.log(`[Linker] ADO Story ID: ${adoStoryId}`);
    console.log(`[Linker] Received ${pbCookies?.length || 0} cookies and ${pbLocalStorage ? Object.keys(pbLocalStorage).length : 0} LS items.`);

    // Basic Input Validation
    if (!pbStoryUrl || !adoProjectName || !adoStoryId) {
        return { success: false, message: '[Linker] Missing required input: pbStoryUrl, adoProjectName, or adoStoryId.', stepFailed: 'Input Validation' };
    }
    if (!pbCookies || !Array.isArray(pbCookies) || pbCookies.length === 0) {
        return { success: false, message: '[Linker] Missing or invalid required input: pbCookies must be a non-empty array.', stepFailed: 'Input Validation' };
    }

    const TIMEOUT = 60000; // 60 seconds timeout for operations
    let browser = null;
    let page = null;
    let step = 'Initialization';

    try {
        step = 'Browser Launch';
        console.log('[Linker] Launching Puppeteer browser in HEADLESS mode with enhanced diagnostics...');
        // Add options for running in potentially limited environments (like servers)
        // and arguments to bypass detection
        browser = await puppeteer.launch({
            headless: true, // *** REVERTED TO TRUE ***
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox', // Re-enable for headless
                '--disable-dev-shm-usage', // Crucial for Docker/CI environments
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                // '--single-process', // Use with caution, might destabilize
                '--disable-gpu',
                // Anti-detection arguments:
                '--disable-blink-features=AutomationControlled', // Common detection flag
                '--disable-infobars', // Don't show "Chrome is being controlled..."
                '--window-size=2560,1440', // *** INCREASED WINDOW SIZE ***
                '--lang=en-US,en', // Set language
                '--disable-extensions', // Disable extensions
                // '--proxy-server="direct://"', // Force direct connection
                // '--proxy-bypass-list=*',
            ],
            ignoreDefaultArgs: ['--enable-automation'], // Remove the default automation flag
            // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // Optional: Use a real Chrome install if available
        });
        page = await browser.newPage();
        console.log('[Linker] Browser launched successfully.');

        // Set a more convincing User-Agent
        const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'; // Use a recent Chrome version
        await page.setUserAgent(userAgent);
        console.log(`[Linker] Set User-Agent to: ${userAgent}`);

        // Standard viewport, matches window size arg
        await page.setViewport({ width: 2560, height: 1440 }); // *** INCREASED VIEWPORT ***

        // Override properties that reveal headless state
        await page.evaluateOnNewDocument(() => {
            // Pass webdriver check
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
            // Pass Chrome check
            window.navigator.chrome = {
                runtime: {},
                // Add other properties if needed
            };
            // Pass plugins check
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3], // Simulate some plugins
            });
            // Pass languages check
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            // Pass permissions check
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
            );
        });
        console.log('[Linker] Applied anti-detection overrides.');

        // *** REMOVED: Listener for recording clicks ***
        // await page.exposeFunction(...)
        // await page.evaluateOnNewDocument(...)
        // console.log('[Linker] Removed click listener for recording.');
        // *** END REMOVED LISTENER ***

        step = 'Inject Auth';
        console.log('[Linker] Injecting authentication data...');
        await injectCookies(page, pbCookies);
        await injectLocalStorage(page, pbLocalStorage || {});
        console.log('[Linker] Authentication data injection attempted.');

        step = 'Navigate to PB Story';
        console.log(`[Linker] Navigating to ${pbStoryUrl}...`);
        await page.goto(pbStoryUrl, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        console.log('[Linker] Navigation complete.');

        step = 'Verify Authentication';
        const currentUrl = page.url();
        const expectedDomain = 'inmar.productboard.com'; // Use the correct subdomain
        console.log(`[Linker] Verifying authentication. Current URL: ${currentUrl}, Expected domain: ${expectedDomain}`);
        // Check if redirected to login OR if not on the expected domain
        if (currentUrl.includes('login') || currentUrl.includes('signin') || !currentUrl.includes(expectedDomain)) {
            console.error(`[Linker] Authentication failed. Current URL (${currentUrl}) does not match expected domain (${expectedDomain}) or indicates a login page.`);
            throw new Error(`Authentication failed. Session cookies may have expired, navigation failed, or landed on wrong domain. Current URL: ${currentUrl}`);
        }
        console.log('[Linker] Authentication appears successful.');

        step = 'Wait for Dynamic Content';
        console.log('[Linker] Waiting briefly for dynamic content to load...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds wait

        // --- UI Automation Steps (Using Precise Selectors with Diagnostics) ---

        step = 'Find and Click Integrations Section Chevron/Container'; // Updated step name
        console.log('[Linker] Looking for "Integrations" section container and its chevron...');
        // Selector for the container
        const integrationsContainerSelector = 'div[data-testid="Section"]:has(h3.sc-flUsNl.dCHtPe[data-nc="true"])';
        // Selector for the SVG chevron *within* that container
        const chevronSelector = `${integrationsContainerSelector} svg[aria-label="ChevronDownIcon"]`;

        // *** ADDED: Screenshot BEFORE finding container ***
        const screenshot0Path = `screenshot_0_before_integrations_${Date.now()}.png`;
        await page.screenshot({ path: screenshot0Path, fullPage: true });
        console.log(`[Linker] Screenshot before Integrations find saved to ${screenshot0Path}`);

        const integrationsContainer = await page.waitForSelector(integrationsContainerSelector, { visible: true, timeout: TIMEOUT });
        if (!integrationsContainer) throw new Error('Could not find "Integrations" section container (div[data-testid="Section"])');
        console.log('[Linker] Found "Integrations" section container.');

        // Try clicking the chevron first
        let clickTarget = null;
        try {
            clickTarget = await page.waitForSelector(chevronSelector, { visible: true, timeout: 5000 }); // Shorter timeout for chevron
            console.log('[Linker] Found chevron icon. Clicking it to expand...');
            await clickTarget.click();
        } catch (chevronError) {
            console.warn('[Linker] Chevron icon not found or clickable, falling back to clicking the container div...');
            clickTarget = integrationsContainer; // Fallback to container
            await clickTarget.click();
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait longer for expansion animation
        // *** Screenshot 1 (After Integrations click) ***
        const screenshot1Path = `screenshot_1_after_integrations_click_${Date.now()}.png`;
        await page.screenshot({ path: screenshot1Path, fullPage: true });
        console.log(`[Linker] Screenshot after Integrations click saved to ${screenshot1Path}`);

        step = 'Find and Click ADO Integration Option';
        console.log('[Linker] Looking for precise "ADO Integration" option...');
        const adoOptionSelector = 'div.sc-bSlUec.kDqwGd'; // Precise selector for the div containing the text

        // *** ADDED: Screenshot BEFORE finding ADO option ***
        const screenshot1bPath = `screenshot_1b_before_ado_option_${Date.now()}.png`;
        await page.screenshot({ path: screenshot1bPath, fullPage: true });
        console.log(`[Linker] Screenshot before ADO Option find saved to ${screenshot1bPath}`);

        const adoOptionDiv = await page.waitForSelector(adoOptionSelector, { visible: true, timeout: TIMEOUT });
        if (!adoOptionDiv) throw new Error('Could not find precise "ADO Integration" option div');
        console.log('[Linker] Found ADO option div. Clicking...');
        // Assuming the div itself or its immediate parent is clickable. If not, this might need adjustment.
        await adoOptionDiv.click();
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait a bit longer
        // *** Screenshot 2 (After ADO Option click) ***
        const screenshot2Path = `screenshot_2_after_ado_option_click_${Date.now()}.png`;
        await page.screenshot({ path: screenshot2Path, fullPage: true });
        console.log(`[Linker] Screenshot after ADO Option click saved to ${screenshot2Path}`);

        step = 'Find and Click Push Button (in ADO Section)'; // Renamed step
        console.log('[Linker] Looking for precise "Push" button within the ADO integration view...');
        const pushButtonSelector = 'button.sc-epPVmt.gdtExp[data-nc="true"]'; // Precise selector

        // *** ADDED: Screenshot BEFORE finding Push button ***
        const screenshot2bPath = `screenshot_2b_before_push_button_${Date.now()}.png`;
        await page.screenshot({ path: screenshot2bPath, fullPage: true });
        console.log(`[Linker] Screenshot before Push button find saved to ${screenshot2bPath}`);

        const pushButton = await page.waitForSelector(pushButtonSelector, { visible: true, timeout: TIMEOUT });
        if (!pushButton) throw new Error('Could not find precise "Push" button within the ADO integration view');
        console.log('[Linker] Found "Push" button. Clicking...');
        await pushButton.click();
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for modal to potentially open
        // *** Screenshot 3 (After Push button click) ***
        const screenshot3Path = `screenshot_3_after_push_button_click_${Date.now()}.png`;
        await page.screenshot({ path: screenshot3Path, fullPage: true });
        console.log(`[Linker] Screenshot after Push button click saved to ${screenshot3Path}`);

        // The rest of the flow (modal interaction) should be the same
        step = 'Wait for Modal & Link Tab';
        // We might need to adjust the next step based on what happens here.
        // await adoOption.click(); // REMOVED duplicate click
        // await new Promise(resolve => setTimeout(resolve, 1000)); // Wait after click // REMOVED duplicate wait

        step = 'Find and Click Link Button (in ADO Section)'; // This step name seems wrong, should be inside modal
        console.log('[Linker] Looking for "Link to existing issue" tab inside modal...');
        // NOTE: The previous step was finding the "Push" button, which likely opens the modal.
        // The selectors below are for elements *inside* the modal.
        // console.log('[Linker] Waiting for modal and "Link to existing issue" tab...'); // Redundant log
        const modalSelector = 'div[role="dialog"]'; // General modal selector
        await page.waitForSelector(modalSelector, { timeout: TIMEOUT });
        console.log('[Linker] Modal detected.');
        // More specific selector for the tab
        const linkTabSelector = `${modalSelector} button:is([role="tab"], [data-role="tab"]):has-text("Link to existing issue")`;
        const linkTab = await page.waitForSelector(linkTabSelector, { visible: true, timeout: TIMEOUT });
        if (!linkTab) throw new Error('Could not find "Link to existing issue" tab');
        console.log('[Linker] Found "Link to existing issue" tab.');

        step = 'Click Link Tab';
        console.log('[Linker] Clicking "Link to existing issue" tab...');
        await linkTab.click();
        await new Promise(resolve => setTimeout(resolve, 500)); // Short wait after click

        step = 'Select ADO Project Dropdown';
        console.log(`[Linker] Selecting ADO Project: ${adoProjectName}...`);
        // Find the dropdown - might need adjustment based on actual HTML structure
        const projectDropdownSelector = `${modalSelector} xpath/.//label[contains(., "AZURE DEVOPS PROJECT")]/following-sibling::button | ${modalSelector} //button[contains(@aria-label, "project")]`;
        const projectDropdown = await page.waitForSelector(projectDropdownSelector, { visible: true, timeout: TIMEOUT });
        if (!projectDropdown) throw new Error('Could not find project dropdown');
        await projectDropdown.click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for dropdown options to render

        step = 'Select ADO Project Option';
        // Find the option within the dropdown listbox
        const projectOptionSelector = `xpath/.//div[contains(@role, "listbox")]//div[contains(text(), "${adoProjectName}")] | //div[contains(@role, "option") and contains(text(), "${adoProjectName}")]`;
        const projectOption = await page.waitForSelector(projectOptionSelector, { visible: true, timeout: TIMEOUT });
        if (!projectOption) throw new Error(`Could not find project option "${adoProjectName}"`);
        await projectOption.click();
        console.log('[Linker] Project selected.');
        await new Promise(resolve => setTimeout(resolve, 500)); // Short wait after selection

        step = 'Enter ADO Story ID';
        console.log(`[Linker] Entering ADO Story ID: ${adoStoryId}...`);
        // Find the input field
        const workItemIdInputSelector = `${modalSelector} input[id*="work-item-id"], ${modalSelector} input[aria-label*="Work Item ID"], ${modalSelector} input[placeholder*="Work Item ID"]`;
        const workItemIdInput = await page.waitForSelector(workItemIdInputSelector, { visible: true, timeout: TIMEOUT });
        if (!workItemIdInput) throw new Error('Could not find work item ID input');
        await workItemIdInput.type(adoStoryId, { delay: 100 }); // Add slight delay
        console.log('[Linker] Story ID entered.');

        step = 'Find Final Link Button';
        console.log('[Linker] Looking for final Link button...');
        // Find the link button within the modal
        const linkButtonSelector = `${modalSelector} button:has-text("Link"):not([disabled])`; // Ensure button is not disabled
        const linkButton = await page.waitForSelector(linkButtonSelector, { visible: true, timeout: TIMEOUT });
        if (!linkButton) throw new Error('Could not find final link button or it was disabled');
        console.log('[Linker] Found final Link button.');

        step = 'Click Final Link Button';
        console.log('[Linker] Clicking final Link button...');
        await linkButton.click();

        step = 'Wait for Modal Close';
        console.log('[Linker] Waiting for confirmation (modal to close)...');
        await page.waitForSelector(modalSelector, { hidden: true, timeout: TIMEOUT });
        console.log('[Linker] Modal closed, assuming success.');

        step = 'Finished';
        console.log('[Linker] --- PB to ADO Link Process Successful ---');
        return { success: true, message: 'Successfully linked PB story to ADO via Puppeteer.' };

    } catch (error) {
        const errorMessage = `[Linker] Error during step "${step}": ${error.message}`;
        console.error('--- Puppeteer Linker Error ---');
        console.error(errorMessage);
        console.error('Stack Trace:', error.stack);

        // Attempt to take a screenshot on error
        if (page) {
            try {
                const screenshotPath = `error_screenshot_${Date.now()}.png`;
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`[Linker] Error screenshot saved to ${screenshotPath}`);
            } catch (screenshotError) {
                console.error('[Linker] Failed to save error screenshot:', screenshotError.message);
            }
        }

        return {
            success: false,
            message: errorMessage,
            stepFailed: step
        };
    } finally {
        if (browser) {
            console.log('[Linker] Closing browser...');
            try {
                await browser.close();
                console.log('[Linker] Browser closed.');
            } catch (closeError) {
                console.error('[Linker] Error closing browser:', closeError.message);
            }
        }
        console.log('[Linker] --- PB to ADO Link Process Ended ---');
    }
}

module.exports = { linkPbToAdo };
