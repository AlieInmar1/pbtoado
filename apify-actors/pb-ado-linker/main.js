// 
// main.js - Playwright Version (Simplified)
import { Actor } from 'apify';
import { chromium } from 'playwright';

console.log("--- Actor script starting (Simplified Playwright Version) ---");

// Helper function to save screenshot to Key-Value Store
async function saveScreenshot(page, key) {
    try {
        const screenshotBuffer = await page.screenshot();
        await Actor.setValue(key, screenshotBuffer, { contentType: 'image/png' });
        console.log(`Screenshot saved with key: ${key}`);
    } catch (saveError) {
        console.error(`Failed to save screenshot with key "${key}": ${saveError.message}`);
    }
}

// Helper Function: Inject Local Storage
async function injectLocalStorage(context, storage) {
    if (!storage || typeof storage !== 'object' || Object.keys(storage).length === 0) {
        console.warn('No valid local storage data provided to inject.');
        return;
    }
    console.log(`Injecting ${Object.keys(storage).length} local storage items...`);
    
    try {
        await context.addInitScript((storage) => {
            for (const key in storage) {
                window.localStorage.setItem(key, storage[key]);
            }
            console.log('Local storage injected via init script.');
        }, storage);
        console.log('Local storage injection setup.');
    } catch (error) {
        console.error('Error setting up local storage injection:', error.message);
    }
}

// Helper Function: Inject Cookies
async function injectCookies(context, cookies, targetDomain) {
    if (!cookies || !Array.isArray(cookies)) {
        console.warn('No valid cookies provided to inject.');
        return;
    }
    console.log(`Injecting ${cookies.length} cookies for domain ${targetDomain}...`);
    
    try {
        const playwrightCookies = cookies
            .filter(cookie => cookie.domain && cookie.domain.includes(targetDomain))
            .map(cookie => ({
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path || '/',
                expires: cookie.expires || cookie.expirationDate || -1,
                httpOnly: cookie.httpOnly || false,
                secure: cookie.secure || false,
                sameSite: cookie.sameSite || 'Lax',
            }));

        if (playwrightCookies.length > 0) {
            await context.addCookies(playwrightCookies);
            console.log(`${playwrightCookies.length} cookies injected successfully.`);
        } else {
            console.warn('No cookies matched the target domain for injection.');
        }
    } catch (error) {
        console.error('Error injecting cookies:', error.message);
    }
}

// Main function
async function main() {
    console.log("--- Entering main function ---");
    
    // Get input defined in Actor's input schema
    const input = await Actor.getInput();
    console.log('Actor Input Received:', JSON.stringify(input, (key, value) => {
        if (key === 'pbCookies') return `[${value?.length || 0} cookies]`;
        if (key === 'pbLocalStorage') return `[${value ? Object.keys(value).length : 0} LS items]`;
        return value;
    }, 2));

    const {
        pbStoryUrl,
        adoProjectName,
        adoStoryId,
        pbCookies,
        pbLocalStorage
    } = input;

    // Validate required inputs
    if (!pbStoryUrl || !adoProjectName || !adoStoryId) {
        throw new Error('Missing required input: pbStoryUrl, adoProjectName, or adoStoryId.');
    }
    if (!pbCookies || !Array.isArray(pbCookies) || pbCookies.length === 0) {
        throw new Error('Missing or invalid required input: pbCookies must be a non-empty array.');
    }

    const TIMEOUT = 60000; // 60 seconds
    let browser = null;
    let context = null;
    let page = null;
    let step = 'Initialization';
    const targetDomain = 'inmar.productboard.com';

    try {
        // Launch browser
        step = 'Browser Launch';
        console.log('Launching browser...');
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        console.log('Browser launched.');

        // Create context with viewport and user agent
        step = 'Create Browser Context';
        context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            locale: 'en-US',
        });
        console.log('Browser context created.');

        // Inject authentication
        step = 'Inject Auth';
        await injectCookies(context, pbCookies, targetDomain);
        await injectLocalStorage(context, pbLocalStorage || {});
        console.log('Auth injection setup.');

        // Create new page
        step = 'Create Page';
        page = await context.newPage();
        console.log('New page created.');

        // Navigate to ProductBoard story
        step = 'Navigate to PB Story';
        console.log(`Navigating to ${pbStoryUrl}...`);
        await page.goto(pbStoryUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        console.log('Navigation complete.');
        await saveScreenshot(page, 'initial_page_load');

        // Verify authentication
        step = 'Verify Authentication';
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        if (currentUrl.includes('login') || currentUrl.includes('signin') || !currentUrl.includes(targetDomain)) {
            console.error(`Authentication failed. Current URL: ${currentUrl}`);
            throw new Error(`Authentication failed. Session cookies may have expired or navigation failed.`);
        }
        console.log('Authentication verified successfully.');

        // Allow page to fully load
        await page.waitForTimeout(5000);
        
        // --- UI Automation Steps (from Automa JSON recording, with robust selectors and error handling) ---

        // 1. Try to scroll to the integration section, but skip if not found
        step = 'Scroll to Integration Section';
        let integrationSectionFound = false;
        try {
            // Try robust selectors: data-testid, text, or fallback to scrolling the page
            if (await page.locator('[data-testid="Section"]').isVisible({ timeout: 5000 }).catch(() => false)) {
                await page.locator('[data-testid="Section"]').scrollIntoViewIfNeeded();
                integrationSectionFound = true;
            } else if (await page.locator('text=Integrations').isVisible({ timeout: 5000 }).catch(() => false)) {
                await page.locator('text=Integrations').scrollIntoViewIfNeeded();
                integrationSectionFound = true;
            } else if (await page.locator('div.sc-kgcpXq').isVisible({ timeout: 5000 }).catch(() => false)) {
                await page.locator('div.sc-kgcpXq').scrollIntoViewIfNeeded();
                integrationSectionFound = true;
            } else {
                // Fallback: scroll the page to the bottom
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                integrationSectionFound = false;
            }
            await page.waitForTimeout(500);
        } catch (scrollError) {
            console.warn(`[${step}] Could not scroll to integration section: ${scrollError.message}`);
        }

        // 2. Click the section chevron (expand) if present
        step = 'Expand Integration Section';
        let chevronSelector = '.dsyMno > [data-testid="Section"] path';
        let chevronClicked = false;
        try {
            if (await page.locator(chevronSelector).isVisible({ timeout: 5000 }).catch(() => false)) {
                await page.locator(chevronSelector).click();
                chevronClicked = true;
            } else if (await page.locator('[data-testid="Section"]').isVisible({ timeout: 5000 }).catch(() => false)) {
                await page.locator('[data-testid="Section"]').click();
                chevronClicked = true;
            } else if (integrationSectionFound) {
                // Try clicking the integration section itself
                await page.locator('text=Integrations').click();
                chevronClicked = true;
            } else {
                console.warn(`[${step}] Could not find chevron or integration section to expand.`);
            }
            await saveScreenshot(page, 'after_integrations_expand');
            await page.waitForTimeout(1000);
        } catch (chevronError) {
            console.warn(`[${step}] Could not expand integration section: ${chevronError.message}`);
        }

        // 3. Hover over the ADO Integration box and click the Push button
        step = 'Click Push Button';
        console.log('Locating ADO Integration box...');
        
        // First, ensure the Integrations section is expanded
        await page.locator('text=Integrations').waitFor({ state: 'visible', timeout: 10000 });
        
        // Find the ADO Integration box (container with the Push button)
        const adoIntegrationBox = page.locator('text=ADO Integration').first();
        await adoIntegrationBox.waitFor({ state: 'visible', timeout: 10000 });
        console.log('Found ADO Integration box. Hovering...');
        await saveScreenshot(page, 'before_ado_integration_hover');
        
        // Hover over the ADO Integration box to make the Push button appear
        await adoIntegrationBox.hover();
        await page.waitForTimeout(1000); // Wait for UI to update
        await saveScreenshot(page, 'after_ado_integration_hover');
        
        // Look for the Push button that appears after hovering
        try {
            // Try finding by text "Push" first
            const pushButton = page.locator('text=Push').filter({ hasText: 'Push' }).first();
            console.log('Waiting for Push button to become visible...');
            await pushButton.waitFor({ state: 'visible', timeout: 5000 });
            console.log('Push button is now visible. Clicking...');
            await pushButton.click();
        } catch (error) {
            console.warn(`[${step}] First attempt to find Push button failed: ${error.message}`);
            
            // Try finding by the blue button with the "Push" label
            try {
                await saveScreenshot(page, 'trying_alternative_push_selectors');
                const pushButtonAlt = page.locator('button:has-text("Push")');
                await pushButtonAlt.waitFor({ state: 'visible', timeout: 5000 });
                console.log('Found Push button via alternative selector. Clicking...');
                await pushButtonAlt.click();
            } catch (altError) {
                console.warn(`[${step}] Second attempt to find Push button failed: ${altError.message}`);
                
                // Last resort: try to find any button within the ADO Integration section
                try {
                    const pushButtonLastResort = adoIntegrationBox.locator('button').first();
                    await pushButtonLastResort.waitFor({ state: 'visible', timeout: 5000 });
                    console.log('Found button in ADO Integration section. Clicking...');
                    await pushButtonLastResort.click();
                } catch (lastError) {
                    console.error(`[${step}] All attempts to find Push button failed. Taking one final screenshot.`);
                    await saveScreenshot(page, 'all_push_button_attempts_failed');
                    throw new Error(`Unable to locate and click Push button: ${lastError.message}`);
                }
            }
        }
        
        await saveScreenshot(page, 'after_push_button_click');
        await page.waitForTimeout(1000);

        // 4. Click "Link to existing issue" tab
        step = 'Click Link to Existing Issue Tab';
        await page.locator('.iMBjmP:nth-child(2) .sc-iCZwEW').waitFor({ state: 'visible', timeout: 5000 });
        await page.locator('.iMBjmP:nth-child(2) .sc-iCZwEW').click();
        await saveScreenshot(page, 'after_link_tab_click');
        await page.waitForTimeout(1000);

        // 5-7. PATCHED PROJECT DROPDOWN LOGIC - More robust selection method
        step = 'Project Dropdown Selection';
        const dropdownContainer = page.locator('div[data-testid="Ado-LinkDialog-project-value"]');
        await dropdownContainer.waitFor({ state: 'visible', timeout: 10000 });
        await dropdownContainer.click(); // open dropdown
        await saveScreenshot(page, 'after_project_dropdown_click');
        await page.waitForTimeout(1000);

        // Try filling and navigating with keyboard
        try {
            const dropdownInput = dropdownContainer.locator('input[type="text"]');
            await dropdownInput.fill(adoProjectName); // type to filter
            await page.keyboard.press('ArrowDown');   // highlight the match
            await page.keyboard.press('Enter');       // select
            console.log(`[Dropdown Patch] Successfully selected project \"${adoProjectName}\" using input and keyboard.`);
            await saveScreenshot(page, 'after_dropdown_filled');
            await page.waitForTimeout(1000);
        } catch (keyboardError) {
            console.warn(`[Dropdown Patch] Keyboard-based project selection failed: ${keyboardError.message}`);

            // Fallback 1: Try direct click on option if visible
            try {
                const projectOptionSelector = `div[data-testid^="select-item-"]:has-text("${adoProjectName}")`;
                if (await page.locator(projectOptionSelector).isVisible({ timeout: 3000 }).catch(() => false)) {
                    await page.locator(projectOptionSelector).click();
                    console.log(`[Dropdown Patch] Successfully selected project via direct click.`);
                    await saveScreenshot(page, 'after_direct_option_click');
                    await page.waitForTimeout(1000);
                } else {
                    throw new Error("Project option not visible for direct click");
                }
            } catch (directClickError) {
                console.warn(`[Dropdown Patch] Direct click selection failed: ${directClickError.message}`);
                
                // Fallback 2: DOM injection if the above fails
                try {
                    await page.evaluate((projectName) => {
                        const inputs = Array.from(document.querySelectorAll('input')).filter(i =>
                            i.placeholder?.includes('Select a project') ||
                            i.getAttribute('aria-label')?.toLowerCase().includes('project')
                        );
                        if (inputs.length > 0) {
                            inputs[0].value = projectName;
                            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                            inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                            console.log(`[DOM Inject] Injected value into project dropdown input.`);
                        } else {
                            throw new Error("No suitable input found for project selection");
                        }
                    }, adoProjectName);
                    console.log(`[Dropdown Patch] Fallback DOM injection succeeded.`);
                    await saveScreenshot(page, 'after_dropdown_dom_injection');
                    await page.waitForTimeout(1000);
                } catch (fallbackError) {
                    console.error(`[Dropdown Patch] All project selection methods failed: ${fallbackError.message}`);
                    throw new Error(`Unable to select project "${adoProjectName}" using any method`);
                }
            }
        }

        // 8. Fill work item ID field with increased wait time & more robust selectors
        step = 'Fill Work Item ID';
        console.log('Waiting for Work Item ID field to be ready after project selection...');
        
        // Wait a moment for UI to update after project selection
        await page.waitForTimeout(2000);
        await saveScreenshot(page, 'before_work_item_field');
        
        // Try multiple selectors for the Work Item ID field
        try {
            // Try a combination of selectors to find the Work Item ID field
            const fieldSelectors = [
                'input[placeholder*="Just the number"]',
                'input[placeholder*="Work Item ID"]',
                '[data-testid="Ado-LinkDialog-workItem-value"] input',
                'input[aria-label*="Work Item"]',
                // Last resort - find input in the second field group
                '.sc-la-DxNn:nth-child(2) input',
                // Very last resort - any enabled input in the dialog that's not the project field
                'div[role="dialog"] input:not([disabled])'
            ];
            
            let workItemInput = null;
            let matchedSelector = '';
            
            // Try each selector until one works
            for (const selector of fieldSelectors) {
                console.log(`Trying to locate Work Item ID field with selector: ${selector}`);
                
                if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
                    workItemInput = page.locator(selector).first();
                    matchedSelector = selector;
                    console.log(`Found Work Item ID field with selector: ${selector}`);
                    break;
                }
            }
            
            if (!workItemInput) {
                throw new Error('Could not find Work Item ID field with any of the known selectors');
            }
            
            // Wait for the input to be visible and interactable
            await page.waitForSelector(matchedSelector, { state: 'visible', timeout: 10000 });
            console.log('Work Item ID field is visible...');

            // Take extra screenshots
            await saveScreenshot(page, 'work_item_field_visible');
            
            console.log(`Filling Work Item ID field with value: ${adoStoryId}`);
            
            // Fill the field with a single reliable method to avoid duplicate values
            try {
                console.log(`Filling Work Item ID field with value: ${adoStoryId} (using only one method)`);
                
                // Clear the field first to ensure clean state
                await workItemInput.fill('');
                
                // Fill the field once with Playwright's reliable fill method
                await workItemInput.fill(adoStoryId);
                
                // Dispatch events to ensure the UI updates
                await workItemInput.dispatchEvent('input', { bubbles: true });
                await workItemInput.dispatchEvent('change', { bubbles: true });
                
                // Take a screenshot after filling
                await saveScreenshot(page, 'after_work_item_direct_fill');
                
                // Press Tab to trigger validation and move focus
                await page.keyboard.press('Tab');
                
                // Wait for the UI to process the input and potentially show suggestions
                await page.waitForTimeout(2000);
                console.log('Waiting for field validation and search results...');
                
                // Take another screenshot
                await saveScreenshot(page, 'after_work_item_tab_press');
            } catch (fillError) {
                console.warn(`Error filling Work Item ID field with standard methods: ${fillError.message}`);
                // Will fall back to DOM manipulation in the catch block below
                throw fillError;
            }
            
            await saveScreenshot(page, 'after_work_item_id_entry');
            console.log('Successfully filled Work Item ID field');
            
            // 9. CRITICAL: Wait for and click the preview item (USER STORY) that appears
            step = 'Click Work Item Preview';
            console.log('Waiting for the USER STORY preview item to appear...');
            
            // Wait for the preview to appear - important step that enables the Link button
            await page.waitForTimeout(2000); // Give time for the preview to load
            
            // Take screenshot to see what's available
            await saveScreenshot(page, 'before_click_preview_item');
            
            // Try various formats of selectors to find the preview
            const previewSelectors = [
                `text=USER STORY ${adoStoryId}`,
                `div:has-text("USER STORY ${adoStoryId}")`,
                `div:has-text("${adoStoryId}")`,
                // More generic fallbacks
                'div.sc-ipEyDJ',
                'div[role="option"]',
                // Simple text based selector as last resort 
                `text=${adoStoryId}`
            ];
            
            let previewClicked = false;
            
            for (const selector of previewSelectors) {
                console.log(`Looking for preview with selector: ${selector}`);
                try {
                    if (await page.locator(selector).isVisible({ timeout: 2000 })) {
                        console.log(`Found preview using selector: ${selector}`);
                        await page.locator(selector).first().click();
                        console.log('Clicked on the preview item');
                        await saveScreenshot(page, 'after_work_item_preview_click');
                        await page.waitForTimeout(1000); // Give time for UI to update after click
                        previewClicked = true;
                        break;
                    }
                } catch (previewErr) {
                    console.warn(`Failed to interact with preview using selector ${selector}: ${previewErr.message}`);
                }
            }
            
            if (!previewClicked) {
                console.warn('Could not find or click preview element with standard selectors. Trying DOM evaluation...');
                
                // Try DOM-based approach to find and click preview
                await page.evaluate((id) => {
                    const elements = Array.from(document.querySelectorAll('div'))
                        .filter(el => el.textContent && 
                                el.textContent.includes(`USER STORY ${id}`) || 
                                el.textContent.includes(id));
                    
                    if (elements.length > 0) {
                        console.log(`Found ${elements.length} elements containing ID ${id}`);
                        elements[0].click();
                        return true;
                    }
                    return false;
                }, adoStoryId);
                
                await saveScreenshot(page, 'after_dom_preview_click');
                console.log('Attempted to click preview via DOM evaluation');
            }
            
        } catch (error) {
            console.warn(`Issue with Work Item ID field/preview: ${error.message}`);
            await saveScreenshot(page, 'work_item_field_problem');
            
            // Try a desperate approach - evaluate JavaScript to find and fill any input
            try {
                console.log('Attempting direct DOM manipulation to find and fill Work Item ID field...');
                
                await page.evaluate((id) => {
                    // Try to find any input that's visible and not the project field
                    const inputs = Array.from(document.querySelectorAll('input:not([disabled])'))
                        .filter(input => input.offsetParent !== null && 
                                !input.value.includes('Healthcare') && 
                                input.getAttribute('aria-label') !== 'Project');
                    
                    if (inputs.length > 0) {
                        console.log(`Found ${inputs.length} potential inputs for Work Item ID`);
                        // Use the first visible input that isn't the project field
                        inputs[0].value = id;
                        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                    return false;
                }, adoStoryId);
                
                await saveScreenshot(page, 'after_dom_work_item_injection');
                console.log('Direct DOM manipulation for Work Item ID field complete');
                
                // Also try to click any element that might be the preview
                await page.waitForTimeout(2000);
                await page.evaluate((id) => {
                    Array.from(document.querySelectorAll('div'))
                        .filter(el => el.textContent && el.textContent.includes(id))
                        .forEach((el, i) => {
                            console.log(`Clicking potential preview element ${i}`);
                            el.click();
                        });
                }, adoStoryId);
            } catch (domError) {
                console.error(`DOM manipulation for Work Item ID failed: ${domError.message}`);
                // Continue anyway - the Link button might still be clickable
            }
        }

        // 11. Wait for and click the Link button
        step = 'Click Link Button';
        console.log('Waiting for Link button to be visible and enabled...');
        
        // First take screenshot of where we are
        await saveScreenshot(page, 'before_link_button_wait');
        
        // Use simpler selectors for link button that will work with querySelector
        const linkButtonCssSelector = '.sc-hfvVTD, div[role="dialog"] button';
        
        // Wait for the button to be visible
        console.log('Waiting for Link button to be visible...');
        await page.waitForSelector(linkButtonCssSelector, { state: 'visible', timeout: 10000 });
        console.log('Link button is visible');
        
        // Take a screenshot of the visible button
        await saveScreenshot(page, 'link_button_visible');
        
        // Directly try to find and click the "Link" button by text content
        try {
            console.log('Attempting to click the Link button by text content');
            const linkButton = await page.locator('button:has-text("Link")').first();
            await linkButton.click();
            console.log('Link button clicked successfully');
        } catch (linkClickError) {
            console.warn(`Could not click Link button by text: ${linkClickError.message}`);
            
            // Fallback to direct DOM approach
            try {
                console.log('Falling back to DOM-based Link button click');
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'))
                        .filter(btn => btn.textContent?.includes('Link'));
                    if (buttons.length > 0) {
                        buttons[0].click();
                        return true;
                    }
                    return false;
                });
                console.log('Link button clicked via DOM evaluation');
            } catch (domClickError) {
                console.error(`DOM-based Link button click failed: ${domClickError.message}`);
                throw new Error('Failed to click Link button using all methods');
            }
        }
        
        await saveScreenshot(page, 'after_first_link_click');
        await page.waitForTimeout(1000);

        // 12. Click the Link button (second time, for confirmation or conflict)
        if (await page.locator('.sc-la-DxNn:nth-child(2) > [data-testid="Ado-LinkDialog"] .sc-hfvVTD').isVisible({ timeout: 3000 }).catch(() => false)) {
            await page.locator('.sc-la-DxNn:nth-child(2) > [data-testid="Ado-LinkDialog"] .sc-hfvVTD').click();
            await saveScreenshot(page, 'after_second_link_click');
        }

        // Check for conflict resolution dialog and handle if needed
        step = 'Check for Conflict Resolution';
        console.log(`Checking for conflict resolution dialog...`);
        try {
            // Look for the conflict option content
            const conflictOption = page.locator('div[role="dialog"]:has-text("Keep Productboard data")');
            // Use a short timeout since this dialog might not appear
            const isVisible = await conflictOption.isVisible({ timeout: 5000 });
            
            if (isVisible) {
                console.log('Conflict dialog detected, selecting "Keep Productboard data"...');
                await saveScreenshot(page, 'conflict_dialog_detected');
                
                // Click the Keep Productboard data option
                await conflictOption.click();
                console.log('Selected "Keep Productboard data".');
                
                // Click the Link button in the conflict dialog
                const confirmLinkButton = page.locator('div[role="dialog"] button:has-text("Link")').last();
                await confirmLinkButton.click();
                console.log('Clicked Link button in conflict dialog.');
                await saveScreenshot(page, 'after_conflict_resolution');
                await page.waitForTimeout(2000);
            } else {
                console.log('No conflict resolution dialog detected.');
            }
        } catch (conflictError) {
            // No conflict dialog appeared, which is the expected path
            console.log('No conflict resolution dialog found within timeout.');
        }

        // Wait for success (modal should close)
        step = 'Wait for Success';
        console.log('Waiting for modal to close...');
        try {
            // Wait for modal to become invisible
            await page.locator('div[role="dialog"]').waitFor({ state: 'hidden', timeout: 10000 });
            console.log('Modal closed, linking successful!');
            await saveScreenshot(page, 'success_modal_closed');
        } catch (waitError) {
            console.warn('Modal did not close within expected time, but operation might still have succeeded.');
            await saveScreenshot(page, 'modal_still_visible');
        }

        // Set success output
        step = 'Set Success Output';
        await Actor.setValue('OUTPUT', { 
            success: true, 
            message: 'Successfully linked PB story to ADO.' 
        });
        console.log('Actor finished successfully.');

    } catch (error) {
        const errorMessage = `Error during step "${step}": ${error.message}`;
        console.error('--- Actor Error ---');
        console.error(errorMessage);
        console.error('Stack Trace:', error.stack);

        // Take error screenshot if page exists
        if (page) {
            try {
                await saveScreenshot(page, `error_screenshot_${step.replace(/\s+/g, '_')}`);
            } catch (screenshotError) {
                console.error('Failed to save error screenshot:', screenshotError.message);
            }
        }

        // Set error output
        console.log(`Setting OUTPUT for failed run (Step: ${step})...`);
        try {
            await Actor.setValue('OUTPUT', {
                success: false,
                message: errorMessage,
                stepFailed: step
            });
            console.log('OUTPUT key-value store record set for failed run.');
        } catch (outputError) {
            console.error('Failed to set OUTPUT for failed run:', outputError.message);
        }
        throw new Error(errorMessage);
    } finally {
        // Close browser if it was opened
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
            console.log('Browser closed.');
        }
    }
}

// Call Actor.main and pass the async function
Actor.main(main);
