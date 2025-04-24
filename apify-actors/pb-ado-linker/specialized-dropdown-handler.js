// A dedicated module for handling the complex dropdown interaction in ProductBoard

/**
 * Attempts to interact with the project dropdown in a more reliable way
 * @param {Object} modal - The Playwright locator for the modal
 * @param {string} projectName - The name of the project to select
 * @param {Object} page - The Playwright page object
 * @param {Function} saveScreenshot - Function to save screenshots
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function handleProjectDropdown(modal, projectName, page, saveScreenshot) {
    const step = 'Specialized Dropdown Handler';
    console.log(`[${step}] Starting specialized dropdown handling...`);

    try {
        // PATCHED PROJECT DROPDOWN LOGIC
        console.log(`[${step}] Using patched project dropdown logic...`);
        const dropdownContainer = modal.locator('div[data-testid="Ado-PushDialog-project-value"]');
        await dropdownContainer.waitFor({ state: 'visible', timeout: 10000 });
        await dropdownContainer.click(); // open dropdown
        await saveScreenshot(page, 'dropdown_opened');

        // Try filling and navigating with keyboard
        try {
            const dropdownInput = dropdownContainer.locator('input[type="text"]');
            await dropdownInput.fill(projectName); // type to filter
            await page.keyboard.press('ArrowDown');   // highlight the match
            await page.keyboard.press('Enter');       // select
            console.log(`[${step}] Successfully selected project \"${projectName}\" using input and keyboard.`);
            await saveScreenshot(page, 'after_dropdown_filled');
            return true;
        } catch (keyboardError) {
            console.warn(`[${step}] Keyboard-based project selection failed: ${keyboardError.message}`);

            // Fallback: DOM injection if the above fails
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
                    }
                }, projectName);
                console.log(`[${step}] Fallback DOM injection succeeded.`);
                await saveScreenshot(page, 'after_dropdown_dom_injection');
                return true;
            } catch (fallbackError) {
                console.error(`[${step}] Fallback DOM injection failed: ${fallbackError.message}`);
                
                // If both methods fail, try the original approach as a last resort
                return await originalDropdownLogic(modal, projectName, page, saveScreenshot);
            }
        }
    } catch (error) {
        console.error(`[${step}] Error in specialized dropdown handler: ${error.message}`);
        await saveScreenshot(page, 'specialized_dropdown_error');
        
        // Try the original approach as a last resort
        console.log(`[${step}] Attempting original dropdown logic as last resort...`);
        return await originalDropdownLogic(modal, projectName, page, saveScreenshot);
    }
}

/**
 * Original dropdown logic to use as a fallback if new methods fail
 * @param {Object} modal - The Playwright locator for the modal
 * @param {string} projectName - The name of the project to select
 * @param {Object} page - The Playwright page object
 * @param {Function} saveScreenshot - Function to save screenshots
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function originalDropdownLogic(modal, projectName, page, saveScreenshot) {
    const step = 'Original Dropdown Logic';
    console.log(`[${step}] Using original dropdown logic as fallback...`);

    try {
        // First try to find the dropdown element with multiple selectors
        const dropdownSelectors = [
            'div[data-testid="Ado-PushDialog-project-value"]',
            'div[class*="select"][class*="container"]',
            'div[aria-haspopup="listbox"]',
            'input[placeholder="Select a project"]'
        ];

        // Try each selector
        let dropdown = null;
        let usedSelector = '';

        for (const selector of dropdownSelectors) {
            try {
                const locator = modal.locator(selector).first();
                if (await locator.isVisible({ timeout: 2000 })) {
                    dropdown = locator;
                    usedSelector = selector;
                    console.log(`[${step}] Found dropdown with selector: ${selector}`);
                    break;
                }
            } catch (err) {
                // Continue to next selector
            }
        }

        if (!dropdown) {
            console.log(`[${step}] Could not find dropdown with any selector`);
            return false;
        }

        // Save a screenshot of the found dropdown
        await saveScreenshot(page, 'original_dropdown_found');

        // Try multiple methods to open the dropdown
        console.log(`[${step}] Attempting to open dropdown...`);

        // Method 1: Click with delay
        try {
            await dropdown.click({ force: true, delay: 200, timeout: 5000 });
            console.log(`[${step}] Dropdown clicked with Method 1`);
            await page.waitForTimeout(1000);
            await saveScreenshot(page, 'original_dropdown_after_click1');
        } catch (clickError) {
            console.log(`[${step}] Method 1 click failed: ${clickError.message}`);
        }

        // Check if dropdown is open
        let isOpen = await isDropdownOpen(page);

        // Method 2: Focus + ArrowDown if not open yet
        if (!isOpen) {
            try {
                await dropdown.focus();
                await page.waitForTimeout(500);
                await page.keyboard.press('ArrowDown');
                console.log(`[${step}] Tried Method 2: Focus + ArrowDown`);
                await page.waitForTimeout(1000);
                await saveScreenshot(page, 'original_dropdown_after_method2');

                isOpen = await isDropdownOpen(page);
            } catch (method2Error) {
                console.log(`[${step}] Method 2 failed: ${method2Error.message}`);
            }
        }

        // Method 3: JavaScript click events
        if (!isOpen) {
            try {
                await page.evaluate((selector) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        // Try multiple event types
                        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
                            element.dispatchEvent(new MouseEvent(eventType, {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            }));
                        });
                        console.log('Dispatched JS events to open dropdown');
                    }
                }, usedSelector);

                console.log(`[${step}] Tried Method 3: JavaScript events`);
                await page.waitForTimeout(1000);
                await saveScreenshot(page, 'original_dropdown_after_method3');

                isOpen = await isDropdownOpen(page);
            } catch (method3Error) {
                console.log(`[${step}] Method 3 failed: ${method3Error.message}`);
            }
        }

        // If we couldn't open the dropdown, return false
        if (!isOpen) {
            console.log(`[${step}] Failed to open dropdown after multiple attempts`);
            return false;
        }

        // Now try to select the project from the dropdown
        console.log(`[${step}] Dropdown is open, attempting to select project: ${projectName}`);
        await saveScreenshot(page, 'original_dropdown_open');

        // Try multiple methods to select the project
        const result = await selectProject(page, projectName);

        // Take a screenshot after selection attempt
        await saveScreenshot(page, 'original_after_project_selection');

        return result;
    } catch (error) {
        console.error(`[${step}] Error in original dropdown handler: ${error.message}`);
        await saveScreenshot(page, 'original_dropdown_error');
        return false;
    }
}

/**
 * Check if the dropdown is open
 * @param {Object} page - The Playwright page object
 * @returns {Promise<boolean>} - True if dropdown is open
 */
async function isDropdownOpen(page) {
    const listboxSelectors = [
        'div[role="listbox"]',
        'ul[role="listbox"]',
        'div.select__menu',
        'ul.select__menu-list',
        'div[class*="dropdown-menu"]'
    ];

    for (const selector of listboxSelectors) {
        try {
            const isVisible = await page.locator(selector).first().isVisible({ timeout: 1000 });
            if (isVisible) {
                console.log(`Dropdown is open (detected with selector: ${selector})`);
                return true;
            }
        } catch (err) {
            // Continue to next selector
        }
    }

    return false;
}

/**
 * Attempts to select the project from the dropdown
 * @param {Object} page - The Playwright page object
 * @param {string} projectName - The name of the project to select
 * @returns {Promise<boolean>} - True if successful
 */
async function selectProject(page, projectName) {
    // Multiple selectors to try for finding the project option
    const optionSelectors = [
        `div[role="option"]:has-text("${projectName}")`,
        `div[data-testid^="select-item-"]:has-text("${projectName}")`,
        `li:has-text("${projectName}")`,
        `div.sc-eYPJPk:has-text("${projectName}")`,
        `div:has-text("${projectName}")`
    ];

    // Try each selector
    for (const selector of optionSelectors) {
        try {
            const option = page.locator(selector).first();
            if (await option.isVisible({ timeout: 3000 })) {
                await option.click({ force: true, timeout: 5000 });
                console.log(`Selected project using selector: ${selector}`);
                await page.waitForTimeout(1000);

                // Check if selection was successful by looking for indicators
                const workItemInputEnabled = await page.locator('input[placeholder*="Work Item ID"]:not([disabled])').isVisible({ timeout: 2000 }).catch(() => false);

                if (workItemInputEnabled) {
                    console.log('Project selection confirmed - Work Item ID field is enabled');
                    return true;
                }

                console.log('Clicked project option but selection not confirmed yet');
            }
        } catch (err) {
            console.log(`Failed to select with selector ${selector}: ${err.message}`);
            // Continue to next selector
        }
    }

    // If we couldn't select with any selector, try JavaScript method
    try {
        const result = await page.evaluate((projectName) => {
            // Find any element containing the project name
            const elements = Array.from(document.querySelectorAll('*'))
                .filter(el => el.textContent && el.textContent.includes(projectName));

            if (elements.length > 0) {
                console.log(`Found ${elements.length} elements with project name text`);
                // Try to click elements that look like they could be options
                for (const el of elements) {
                    if (el.getAttribute('role') === 'option' ||
                        el.classList.contains('option') ||
                        el.parentElement?.getAttribute('role') === 'option') {
                        el.click();
                        console.log('Clicked element that looks like an option');
                        return true;
                    }
                }

                // If no good candidates, click the first element
                elements[0].click();
                console.log('Clicked first element with project name');
                return true;
            }

            return false;
        }, projectName);

        if (result) {
            await page.waitForTimeout(1000);
            return true;
        }
    } catch (jsError) {
        console.log(`JavaScript selection failed: ${jsError.message}`);
    }

    return false;
}
