// ../pbtoado/proxy-server/pbAdoLinkerPlaywright.js
const { chromium } = require('playwright'); // Using Chromium

// Helper Function: Inject Local Storage (Playwright version)
async function injectLocalStorage(context, storage) {
    if (!storage || typeof storage !== 'object' || Object.keys(storage).length === 0) {
        console.warn('[PW Linker] No valid local storage data provided to inject.');
        return;
    }
    console.log(`[PW Linker] Injecting ${Object.keys(storage).length} local storage items...`);
    try {
        // Inject into the initial context before creating the page
        await context.addInitScript((storage) => {
            for (const key in storage) {
                window.localStorage.setItem(key, storage[key]);
            }
            console.log('[PW Linker Eval] Local storage injected via init script.');
        }, storage);
    } catch (error) {
        console.error('[PW Linker] Error setting up local storage injection:', error.message);
    }
}

// Helper Function: Inject Cookies (Playwright version)
async function injectCookies(context, cookies, targetDomain) {
    if (!cookies || !Array.isArray(cookies)) {
        console.warn('[PW Linker] No valid cookies provided to inject.');
        return;
    }
    console.log(`[PW Linker] Injecting ${cookies.length} cookies for domain ${targetDomain}...`);
    try {
        const playwrightCookies = cookies
            .filter(cookie => cookie.domain && cookie.domain.includes(targetDomain)) // Filter for the target domain
            .map(cookie => ({
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path || '/',
                expires: cookie.expires || cookie.expirationDate || -1,
                httpOnly: cookie.httpOnly || false,
                secure: cookie.secure || false,
                sameSite: cookie.sameSite || 'Lax', // Default to Lax
            }));

        if (playwrightCookies.length > 0) {
            await context.addCookies(playwrightCookies);
            console.log(`[PW Linker] ${playwrightCookies.length} cookies injected successfully.`);
        } else {
            console.warn('[PW Linker] No cookies matched the target domain for injection.');
        }
    } catch (error) {
        console.error('[PW Linker] Error injecting cookies:', error.message);
    }
}

// Main function using Playwright
async function linkPbToAdoPlaywright(input) {
    const {
        pbStoryUrl,
        adoProjectName,
        adoStoryId,
        pbCookies,
        pbLocalStorage
    } = input;

    console.log('[PW Linker] --- Starting PB to ADO Link Process (Playwright/Chromium) ---');
    console.log(`[PW Linker] PB Story URL: ${pbStoryUrl}`);
    console.log(`[PW Linker] ADO Project Name: ${adoProjectName}`);
    console.log(`[PW Linker] ADO Story ID: ${adoStoryId}`);
    console.log(`[PW Linker] Received ${pbCookies?.length || 0} cookies and ${pbLocalStorage ? Object.keys(pbLocalStorage).length : 0} LS items.`);

    // Basic Input Validation
    if (!pbStoryUrl || !adoProjectName || !adoStoryId) {
        return { success: false, message: '[PW Linker] Missing required input: pbStoryUrl, adoProjectName, or adoStoryId.', stepFailed: 'Input Validation' };
    }
    if (!pbCookies || !Array.isArray(pbCookies) || pbCookies.length === 0) {
        return { success: false, message: '[PW Linker] Missing or invalid required input: pbCookies must be a non-empty array.', stepFailed: 'Input Validation' };
    }

    const TIMEOUT = 60000; // 60 seconds timeout for operations
    let browser = null;
    let context = null;
    let page = null;
    let step = 'Initialization';
    const targetDomain = 'inmar.productboard.com'; // Extract domain for cookie injection

    try {
        step = 'Browser Launch';
        console.log('[PW Linker] Launching Playwright browser (Chromium)...');
        browser = await chromium.launch({
            headless: true, // Keep headless for server
            args: [ // Similar args as Puppeteer for stability
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--window-size=2560,1440', // Keep wide size
            ]
        });

        step = 'Create Browser Context';
        // Create a new context with anti-detection measures
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', // Recent UA
            viewport: { width: 2560, height: 1440 },
            locale: 'en-US',
            timezoneId: 'America/New_York',
            javaScriptEnabled: true,
            ignoreHTTPSErrors: true, // Can sometimes help
            bypassCSP: true, // Try bypassing Content Security Policy
        });
        console.log('[PW Linker] Browser context created.');

        step = 'Inject Auth';
        console.log('[PW Linker] Injecting authentication data...');
        await injectCookies(context, pbCookies, targetDomain); // Inject cookies into context
        await injectLocalStorage(context, pbLocalStorage || {}); // Inject LS via init script
        console.log('[PW Linker] Authentication data injection setup.');

        step = 'Create Page';
        page = await context.newPage();
        console.log('[PW Linker] New page created.');

        // Additional anti-detection (similar to Puppeteer)
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.navigator.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });
        console.log('[PW Linker] Applied Playwright anti-detection overrides.');

        step = 'Navigate to PB Story';
        console.log(`[PW Linker] Navigating to ${pbStoryUrl}...`);
        await page.goto(pbStoryUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT }); // Use 'domcontentloaded' or 'load'
        console.log('[PW Linker] Navigation complete.');

        step = 'Verify Authentication';
        const currentUrl = page.url();
        console.log(`[PW Linker] Verifying authentication. Current URL: ${currentUrl}, Expected domain: ${targetDomain}`);
        if (currentUrl.includes('login') || currentUrl.includes('signin') || !currentUrl.includes(targetDomain)) {
            console.error(`[PW Linker] Authentication failed. Current URL (${currentUrl}) does not match expected domain (${targetDomain}) or indicates a login page.`);
            throw new Error(`Authentication failed. Session cookies may have expired, navigation failed, or landed on wrong domain. Current URL: ${currentUrl}`);
        }
        console.log('[PW Linker] Authentication appears successful.');

        step = 'Wait for Dynamic Content';
        console.log('[PW Linker] Waiting briefly for dynamic content to load...');
        await page.waitForTimeout(5000); // Playwright's wait

        // --- UI Automation Steps (Using Precise Selectors & Playwright Locators) ---

        step = 'Find and Click Integrations Section Container';
        console.log('[PW Linker] Looking for specific "Integrations" section container...');
        // Filter the containers with data-testid="Section" to find the one containing the specific h3 text
        const integrationsContainerLocator = page.locator('div[data-testid="Section"]')
                                                  .filter({ has: page.locator('h3:has-text("Integrations")') });
        await integrationsContainerLocator.waitFor({ state: 'visible', timeout: TIMEOUT });
        console.log('[PW Linker] Found specific "Integrations" section container. Clicking it to expand...');
        await integrationsContainerLocator.click(); // Click the specific container
        await page.waitForTimeout(2000); // Wait for expansion

        // Screenshot 1
        const screenshot1Path = `pw_screenshot_1_after_integrations_click_${Date.now()}.png`;
        await page.screenshot({ path: screenshot1Path, fullPage: true });
        console.log(`[PW Linker] Screenshot after Integrations click saved to ${screenshot1Path}`);

        step = 'Hover Over ADO Integration Option';
        console.log('[PW Linker] Looking for precise "ADO Integration" option...');
        const adoOptionLocator = page.locator('div.sc-bSlUec.kDqwGd:has-text("ADO Integration")'); // Use has-text for safety
        await adoOptionLocator.waitFor({ state: 'visible', timeout: TIMEOUT });
        console.log('[PW Linker] Found ADO option div. Hovering over it...');
        await adoOptionLocator.hover(); // Hover instead of click to reveal button
        await page.waitForTimeout(1000); // Wait briefly for hover effect

        // Screenshot 2
        const screenshot2Path = `pw_screenshot_2_after_ado_option_hover_${Date.now()}.png`;
        await page.screenshot({ path: screenshot2Path, fullPage: true });
        console.log(`[PW Linker] Screenshot after ADO Option hover saved to ${screenshot2Path}`);
        
        step = 'Find and Click Push Button (while maintaining hover)';
        console.log('[PW Linker] Looking for precise "Push" button while maintaining hover...');
        const pushButtonLocator = page.locator('button.sc-epPVmt.gdtExp[data-nc="true"]:has-text("Push")');
        await pushButtonLocator.waitFor({ state: 'visible', timeout: TIMEOUT });
        console.log('[PW Linker] Found "Push" button. Moving to it and clicking...');
        
        // Move to the push button while maintaining the hover state on parent element
        await pushButtonLocator.hover();
        await page.waitForTimeout(500); // Brief pause after moving to button
        await pushButtonLocator.click();
        await page.waitForTimeout(1500); // Wait for modal

        // Screenshot 3
        const screenshot3Path = `pw_screenshot_3_after_push_button_click_${Date.now()}.png`;
        await page.screenshot({ path: screenshot3Path, fullPage: true });
        console.log(`[PW Linker] Screenshot after Push button click saved to ${screenshot3Path}`);

        // --- Modal Interaction ---
        step = 'Wait for Modal and Find Link Tab'; // Renamed step
        // RE-ADD wait for modalLocator
        const modalLocator = page.locator('div[role="dialog"]');
        console.log('[PW Linker] Waiting for modal dialog to appear...');
        await modalLocator.waitFor({ state: 'visible', timeout: TIMEOUT });
        console.log('[PW Linker] Modal detected.');

        // *** ADDED: Screenshot BEFORE finding tab inside modal ***
        const screenshot3bPath = `screenshot_3b_before_link_tab_${Date.now()}.png`;
        await page.screenshot({ path: screenshot3bPath, fullPage: true });
        console.log(`[PW Linker] Screenshot before Link Tab find saved to ${screenshot3bPath}`);

        // Look for the "Link to existing issue" tab/button *within* the modal using getByRole
        console.log('[PW Linker] Looking for "Link to existing issue" tab inside modal using getByRole...');
        // Try finding by role 'tab' and the exact name
        const linkTabLocator = modalLocator.getByRole('tab', { name: 'Link to existing issue' });
        await linkTabLocator.waitFor({ state: 'visible', timeout: TIMEOUT }); // Wait for the tab itself
        console.log('[PW Linker] Found "Link to existing issue" tab inside modal.');

        step = 'Click Link Tab';
        await linkTabLocator.click();
        await page.waitForTimeout(500);

        step = 'Select ADO Project Dropdown';
        console.log(`[PW Linker] Selecting ADO Project: ${adoProjectName}...`);
        // Scope subsequent searches within the modal
        const projectDropdownLocator = modalLocator.locator('xpath=//label[contains(., "AZURE DEVOPS PROJECT")]/following-sibling::button | //button[contains(@aria-label, "project")]');
        await projectDropdownLocator.waitFor({ state: 'visible', timeout: TIMEOUT });
        await projectDropdownLocator.click();
        await page.waitForTimeout(1000);

        step = 'Select ADO Project Option';
        // Listbox should appear globally, but let's keep page locator for now
        const projectOptionLocator = page.locator(`div[role="listbox"] div:has-text("${adoProjectName}"), div[role="option"]:has-text("${adoProjectName}")`).first();
        await projectOptionLocator.waitFor({ state: 'visible', timeout: TIMEOUT });
        await projectOptionLocator.click();
        console.log('[PW Linker] Project selected.');
        await page.waitForTimeout(500);

        step = 'Enter ADO Story ID';
        console.log(`[PW Linker] Entering ADO Story ID: ${adoStoryId}...`);
        // Scope input field search within the modal
        const workItemIdInputLocator = modalLocator.locator('input[id*="work-item-id"], input[aria-label*="Work Item ID"], input[placeholder*="Work Item ID"]');
        await workItemIdInputLocator.waitFor({ state: 'visible', timeout: TIMEOUT });
        await workItemIdInputLocator.fill(adoStoryId);
        console.log('[PW Linker] Story ID entered.');

        step = 'Find Final Link Button';
        // Scope button search within the modal
        const linkButtonLocator = modalLocator.locator('button:has-text("Link"):not([disabled])');
        await linkButtonLocator.waitFor({ state: 'visible', timeout: TIMEOUT });
        console.log('[PW Linker] Found final Link button.');

        step = 'Click Final Link Button';
        await linkButtonLocator.click();

        step = 'Wait for Confirmation / Modal Close';
        // Wait for the modal itself to become hidden
        await modalLocator.waitFor({ state: 'hidden', timeout: TIMEOUT });
        console.log('[PW Linker] Modal closed, assuming success.');

        step = 'Finished';
        console.log('[PW Linker] --- PB to ADO Link Process Successful (Playwright) ---');
        return { success: true, message: 'Successfully linked PB story to ADO via Playwright.' };

    } catch (error) {
        const errorMessage = `[PW Linker] Error during step "${step}": ${error.message}`;
        console.error('--- Playwright Linker Error ---');
        console.error(errorMessage);
        console.error('Stack Trace:', error.stack);

        if (page) {
            try {
                const screenshotPath = `pw_error_screenshot_${Date.now()}.png`;
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`[PW Linker] Error screenshot saved to ${screenshotPath}`);
            } catch (screenshotError) {
                console.error('[PW Linker] Failed to save error screenshot:', screenshotError.message);
            }
        }

        return {
            success: false,
            message: errorMessage,
            stepFailed: step
        };
    } finally {
        if (browser) {
            console.log('[PW Linker] Closing browser...');
            try {
                await browser.close();
                console.log('[PW Linker] Browser closed.');
            } catch (closeError) {
                console.error('[PW Linker] Error closing browser:', closeError.message);
            }
        }
        console.log('[PW Linker] --- PB to ADO Link Process Ended (Playwright) ---');
    }
}

module.exports = { linkPbToAdoPlaywright };
