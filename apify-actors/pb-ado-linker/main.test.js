import { Actor } from 'apify';
import { chromium } from 'playwright';
import { handleProjectDropdown } from './specialized-dropdown-handler.js';

// Main Actor function
async function main() {
    console.log('--- Actor script starting (Playwright Version) ---');
    console.log('INFO ', 'System info', {
        apifyVersion: process.env.APIFY_VERSION || 'unknown',
        apifyClientVersion: process.env.APIFY_CLIENT_VERSION || 'unknown',
        crawleeVersion: process.env.CRAWLEE_VERSION || 'unknown',
        osType: process.platform,
        nodeVersion: process.version
    });

    console.log('--- Entering main function (Playwright Version) ---');
    
    let browser = null;
    let page = null;
    
    try {
        // Get input
        console.log('--- Raw Actor Input Received ---');
        const input = await Actor.getInput();
        console.log(JSON.stringify(input, null, 2));
        console.log('--- Actor Input Received ---');
        
        // Validate and extract input
        const pbStoryUrl = input.pbStoryUrl;
        const adoProjectName = input.adoProjectName;
        const adoStoryId = input.adoStoryId;
        const pbCookies = input.pbCookies;
        const pbLocalStorage = input.pbLocalStorage;
        
        // Log essential input parameters
        console.log('PB Story URL:', pbStoryUrl);
        console.log('ADO Project Name:', adoProjectName);
        console.log('ADO Story ID:', adoStoryId);
        console.log('PB Cookies Type:', typeof pbCookies, 'Is Array:', Array.isArray(pbCookies), 'Length:', Array.isArray(pbCookies) ? pbCookies.length : 'N/A');
        console.log('PB Local Storage Type:', typeof pbLocalStorage);
        
        // Browser setup
        console.log('Launching browser using chromium.launch (expecting Dockerfile install)...');
        browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-web-security']
        });
        console.log('Browser launched.');
        
        // Create a browser context
        const context = await browser.newContext();
        console.log('Browser context created.');
        
        // Inject cookies for ProductBoard authentication
        if (Array.isArray(pbCookies) && pbCookies.length > 0) {
            console.log('[PW Actor] Injecting', pbCookies.length, 'cookies for domain inmar.productboard.com...');
            await context.addCookies(pbCookies);
            console.log('[PW Actor] ' + pbCookies.length + ' cookies injected successfully.');
        } else {
            console.log('[PW Actor] No valid cookies provided to inject.');
        }
        
        // Inject localStorage if provided
        if (pbLocalStorage && typeof pbLocalStorage === 'object' && Object.keys(pbLocalStorage).length > 0) {
            console.log('[PW Actor] Injecting localStorage items...');
            await context.addInitScript(storage => {
                for (const [key, value] of Object.entries(storage)) {
                    localStorage.setItem(key, value);
                }
            }, pbLocalStorage);
            console.log('[PW Actor] localStorage items injected successfully.');
        } else {
            console.log('[PW Actor] No valid local storage data provided to inject.');
        }
        
        console.log('Auth injection setup.');
        
        // Create new page
        page = await context.newPage();
        console.log('New page created.');
        
        // Navigate to ProductBoard URL
        console.log('Navigating to', pbStoryUrl, '...');
        await page.goto(pbStoryUrl, { waitUntil: 'networkidle', timeout: 60000 });
        console.log('Navigation complete.');
        
        // Quick auth check
        console.log('Verifying auth. Current URL:', page.url());
        if (page.url().includes('login')) {
            throw new Error('Navigation resulted in login page. Authentication failed.');
        } else {
            console.log('Authentication appears successful.');
        }
        
        // Give the page some time to fully load
        await page.waitForTimeout(5000);
        
        // Save screenshots for debugging
        async function saveScreenshot(page, name) {
            try {
                const screenshotBuffer = await page.screenshot();
                await Actor.setValue(name, screenshotBuffer, { contentType: 'image/png' });
                console.log(`[PW Actor] Screenshot saved to Key-Value Store with key: ${name}`);
            } catch (error) {
                console.error(`[PW Actor] Failed to save screenshot "${name}": ${error.message}`);
            }
        }
        
        // Click the Integrations section
        const step = 'Click Integrations Section';
        try {
            console.log(`[${step}] Waiting for Integrations section container...`);
            const integrationsContainer = await page.waitForSelector('#integrations', { timeout: 10000 });
            console.log(`[${step}] Integrations section container is visible.`);
            await saveScreenshot(page, 'before_integrations_chevron_click');
            
            console.log(`[${step}] Clicking Integrations section chevron...`);
            const integrationsChevron = await page.locator('#integrations svg').first();
            await integrationsChevron.click({ timeout: 5000 });
            console.log(`[${step}] Clicked Integrations chevron.`);
            
            // Wait for integrations content to be visible
            await page.waitForTimeout(2000);
        } catch (error) {
            console.error(`[${step}] Error clicking integrations section: ${error.message}`);
            await saveScreenshot(page, 'error_integrations_section');
            throw new Error(`Failed to click Integrations section: ${error.message}`);
        }
        
        // Hover over arrows to reveal Push button
        const step2 = 'Hover Arrows and Click ADO Push Button';
        try {
            console.log(`[${step2}] Locating ADO row and hovering arrows to reveal Push button...`);
            await saveScreenshot(page, 'before_ado_row_hover');
            
            console.log(`[${step2}] Locating ADO integration row within #integrations...`);
            const adoRow = await page.locator('#integrations').locator('div:has-text("Azure DevOps")').first();
            console.log(`[${step2}] Found integration row within #integrations.`);
            
            // Find and hover over the arrows element
            const arrowsElement = await adoRow.locator('div[role="button"]').first();
            console.log(`[${step2}] Located potential 'arrows' element.`);
            
            console.log(`[${step2}] Hovering over arrows element...`);
            await arrowsElement.hover();
            console.log(`[${step2}] Hovered over arrows element.`);
            
            await saveScreenshot(page, 'after_arrows_hover');
            
            // Locate and click the Push button
            const pushButton = await adoRow.locator('button:has-text("Push")').first();
            console.log(`[${step2}] Located potential 'Push' button locator within integration row.`);
            
            // Check if button is visible
            if (await pushButton.isVisible()) {
                console.log(`[${step2}] 'Push' button is visible.`);
                await pushButton.click();
                console.log(`[${step2}] Clicked ADO 'Push' button.`);
            } else {
                throw new Error("'Push' button is not visible even after hovering over arrows");
            }
            
            await saveScreenshot(page, 'after_push_button_click');
        } catch (error) {
            console.error(`[${step2}] Error in hover/click process: ${error.message}`);
            await saveScreenshot(page, 'error_hover_click_push');
            throw new Error(`Failed to hover over arrows and click Push button: ${error.message}`);
        }
        
        // Wait for modal to appear
        const step3 = 'Wait for Modal Content';
        try {
            console.log(`[${step3}] Waiting for modal content (header or link tab)...`);
            await page.waitForSelector('div[role="dialog"], div[aria-modal="true"]', { timeout: 10000 });
            console.log(`[${step3}] Modal content detected.`);
            await saveScreenshot(page, 'modal_content_detected');
        } catch (error) {
            console.error(`[${step3}] Error waiting for modal content: ${error.message}`);
            await saveScreenshot(page, 'error_modal_content');
            throw new Error(`Failed to wait for modal content: ${error.message}`);
        }
        
        // Locate the modal container
        const step4 = 'Locate Modal Container';
        let modal;
        try {
            console.log(`[${step4}] Locating the main modal container...`);
            
            // Try different strategies to find the modal
            try {
                modal = await page.locator('div[role="dialog"] h1:has-text("Push"), div[aria-modal="true"] h1:has-text("Push")').first().locator('xpath=ancestor::div[contains(@class, "sc-") and @role="dialog"]');
                if (await modal.count() === 0) {
                    throw new Error('Dialog with header not found quickly');
                }
            } catch (headerError) {
                console.log(`[${step4}] Dialog with header not found quickly, trying general dialog/aria-modal...`);
                modal = await page.locator('div[role="dialog"], div[aria-modal="true"]').first();
            }
            
            console.log(`[${step4}] Modal container located.`);
            await saveScreenshot(page, 'modal_container_located');
        } catch (error) {
            console.error(`[${step4}] Error locating modal container: ${error.message}`);
            await saveScreenshot(page, 'error_modal_container');
            throw new Error(`Failed to locate modal container: ${error.message}`);
        }
        
        // Click the "Link to existing issue" tab
        const step5 = 'Click "Link to existing issue" Tab';
        try {
            console.log(`[${step5}] Locating 'Link to existing issue' tab within modal...`);
            
            await saveScreenshot(page, 'modal_before_tab_click');
            
            // Locate and click the second tab (Link to existing issue)
            const tabButtons = await modal.locator('button[role="tab"]');
            const secondTab = await tabButtons.nth(1);
            
            if (await secondTab.isVisible()) {
                console.log(`[${step5}] Second tab button is visible, clicking now...`);
                await secondTab.click({ timeout: 5000 });
                console.log(`[${step5}] Clicked "Link to existing issue" tab using nth(1) selector.`);
            } else {
                throw new Error('Second tab button not visible');
            }
            
            await saveScreenshot(page, 'after_link_tab_click_attempt');
            
            // Wait for UI to stabilize after tab click
            console.log(`[${step5}] Waiting 5 seconds for UI to stabilize after tab click...`);
            await page.waitForTimeout(5000);
            
            await saveScreenshot(page, 'after_waiting_5s');
        } catch (error) {
            console.error(`[${step5}] Error clicking "Link to existing issue" tab: ${error.message}`);
            await saveScreenshot(page, 'error_link_tab_click');
            throw new Error(`Failed to click "Link to existing issue" tab: ${error.message}`);
        }
        
        // Wait for Link Tab Content and Interact with Dropdown
        const step6 = 'Wait for Link Tab Content and Click Dropdown';
        try {
            console.log(`[${step6}] Verifying second tab content and locating dropdown button...`);
            
            // Use the improved dropdown handling function from the imported module
            const dropdownResult = await handleProjectDropdown(modal, adoProjectName, page, saveScreenshot);
            
            if (!dropdownResult) {
                throw new Error('Failed to interact with project dropdown');
            }
            
            console.log(`[${step6}] Successfully selected project "${adoProjectName}" from dropdown`);
            await saveScreenshot(page, 'after_project_selection');
        } catch (error) {
            console.error(`[${step6}] Failed to verify tab content or click dropdown: ${error.message}`);
            
            // Log the state of the modal's HTML for debugging
            try {
                const modalHtml = await modal.innerHTML();
                console.log(`[${step6}] Modal HTML snippet on failure: ${modalHtml.substring(0, 500)}...`); // Log first 500 chars
            } catch (htmlError) {
                console.log(`[${step6}] Could not get modal HTML: ${htmlError.message}`);
            }
            
            await saveScreenshot(page, 'link_tab_or_dropdown_fail');
            throw new Error(`Failed to interact with project dropdown: ${error.message}`);
        }
        
        // Enter Work Item ID
        const step7 = 'Enter Azure DevOps Work Item ID';
        try {
            console.log(`[${step7}] Entering Work Item ID "${adoStoryId}" into input field...`);
            
            const idInput = await modal.locator('input[placeholder*="Work Item ID"]');
            await idInput.fill(adoStoryId);
            console.log(`[${step7}] Entered Work Item ID: "${adoStoryId}"`);
            
            await saveScreenshot(page, 'after_entering_story_id');
        } catch (error) {
            console.error(`[${step7}] Error entering Work Item ID: ${error.message}`);
            await saveScreenshot(page, 'error_entering_story_id');
            throw new Error(`Failed to enter Work Item ID: ${error.message}`);
        }
        
        // Click the Link Button
        const step8 = 'Click Link Button';
        try {
            console.log(`[${step8}] Locating and clicking Link button...`);
            
            // Find and click the Link button
            const linkButton = await modal.locator('button:has-text("Link"), button:has-text("Save")').first();
            
            if (await linkButton.isVisible()) {
                console.log(`[${step8}] Found Link/Save button, clicking...`);
                await linkButton.click({ timeout: 5000 });
                console.log(`[${step8}] Clicked Link/Save button.`);
            } else {
                throw new Error('Link/Save button not visible');
            }
            
            await saveScreenshot(page, 'after_clicking_link_button');
            
            // Wait for confirmation of successful linking
            console.log(`[${step8}] Waiting for confirmation of successful linking...`);
            await page.waitForTimeout(3000);
            
            await saveScreenshot(page, 'final_state_after_link');
        } catch (error) {
            console.error(`[${step8}] Error clicking Link button: ${error.message}`);
            await saveScreenshot(page, 'error_clicking_link');
            throw new Error(`Failed to click Link button: ${error.message}`);
        }
        
        // Set successful result
        await Actor.setValue('OUTPUT', {
            status: 'success',
            message: `Successfully linked ProductBoard story to Azure DevOps item #${adoStoryId} in project "${adoProjectName}"`,
            storyUrl: pbStoryUrl,
            adoItemId: adoStoryId
        });
        
        console.log('PB-ADO linking completed successfully.');
    } catch (error) {
        console.error('ERROR', error.message);
        
        // Try to take a screenshot of the error state
        if (page) {
            const errorStep = error.message.split(':')[0] || 'unknown_step';
            const safeStepName = errorStep.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
            await saveScreenshot(page, `error_screenshot_${safeStepName}`);
        }
        
        // Set error result
        try {
            console.log('Attempting to set OUTPUT for failed run (Step: ' + (error.message.split(':')[0] || 'unknown') + ')...');
            await Actor.setValue('OUTPUT', {
                status: 'error',
                errorMessage: error.message,
                step: error.message.split(':')[0] || 'unknown'
            });
            console.log('OUTPUT key-value store record set for failed run.');
        } catch (outputError) {
            console.error('Failed to set output:', outputError);
        }
        
        // Exit with error
        throw error;
    } finally {
        // Close browser if it exists
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
            console.log('Browser closed.');
        }
    }
}

// Call Actor.main and pass the async function
Actor.main(main);
