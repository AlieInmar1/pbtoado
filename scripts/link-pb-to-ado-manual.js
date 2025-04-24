#!/usr/bin/env node

/**
 * ProductBoard to Azure DevOps Link Automation Script
 * 
 * This script automates the process of linking a ProductBoard feature to an Azure DevOps work item.
 * It uses Puppeteer to launch a headless browser, navigate to the feature in ProductBoard,
 * and create a link to the specified ADO work item.
 * 
 * Usage:
 *   node link-pb-to-ado-manual.js <productboard_url> <ado_work_item_id> [ado_project]
 * 
 * Example:
 *   node link-pb-to-ado-manual.js https://your-company.productboard.com/feature-board/123456 12345 "Healthcare POC 1"
 * 
 * Environment variables:
 *   PB_SESSION_TOKEN - required for authentication with ProductBoard
 */

const puppeteer = require('puppeteer');

// Get command line arguments
const [, , pbFeatureUrl, adoWorkItemId, adoProject = 'Healthcare POC 1'] = process.argv;

// Validate required arguments
if (!pbFeatureUrl || !adoWorkItemId) {
  console.error('Error: Missing required arguments.');
  console.error('Usage: node link-pb-to-ado-manual.js <productboard_url> <ado_work_item_id> [ado_project]');
  process.exit(1);
}

// Validate environment variables
const pbSessionToken = process.env.PB_SESSION_TOKEN;
if (!pbSessionToken) {
  console.error('Error: PB_SESSION_TOKEN environment variable is required.');
  process.exit(1);
}

// Utility for logging with timestamps
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Main function
async function linkPbToAdo() {
  log(`Starting ProductBoard to ADO linking process`);
  log(`Feature URL: ${pbFeatureUrl}`);
  log(`ADO Work Item ID: ${adoWorkItemId}`);
  log(`ADO Project: ${adoProject}`);

  const browser = await puppeteer.launch({
    headless: false, // Set to true for production use
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Open a new page
    const page = await browser.newPage();
    
    // Set the session cookie for ProductBoard authentication
    await page.setCookie({
      name: 'session',
      value: pbSessionToken,
      domain: new URL(pbFeatureUrl).hostname,
      path: '/',
      httpOnly: true,
      secure: true,
    });

    // Navigate to the ProductBoard feature page
    log(`Navigating to ProductBoard feature page...`);
    await page.goto(pbFeatureUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for the page to fully load
    await page.waitForTimeout(3000);
    
    // Click on the Integrations section to expand it
    log(`Opening Integrations section...`);
    try {
      // Wait for the Integrations section to be available and click it
      await page.waitForXPath("//span[contains(text(), 'Integrations')]", { timeout: 10000 });
      const integrationsSection = await page.$x("//span[contains(text(), 'Integrations')]");
      
      if (integrationsSection.length > 0) {
        await integrationsSection[0].click();
        await page.waitForTimeout(1000);
      } else {
        throw new Error("Couldn't find Integrations section");
      }
      
      // Look for ADO Integration button/row
      log(`Looking for ADO Integration...`);
      await page.waitForXPath("//div[contains(text(), 'ADO Integration')]", { timeout: 5000 });
      const adoIntegration = await page.$x("//div[contains(text(), 'ADO Integration')]");
      
      if (adoIntegration.length > 0) {
        await adoIntegration[0].click();
        await page.waitForTimeout(1000);
      } else {
        throw new Error("Couldn't find ADO Integration button");
      }
      
      // Click on "Link to existing issue" tab
      log(`Clicking "Link to existing issue" tab...`);
      await page.waitForXPath("//div[contains(text(), 'Link to existing issue')]", { timeout: 5000 });
      const linkTab = await page.$x("//div[contains(text(), 'Link to existing issue')]");
      
      if (linkTab.length > 0) {
        await linkTab[0].click();
        await page.waitForTimeout(1000);
      } else {
        throw new Error("Couldn't find 'Link to existing issue' tab");
      }
      
      // Select the ADO project
      log(`Selecting Azure DevOps project: ${adoProject}...`);
      await page.waitForXPath("//div[contains(text(), 'Select a project')]", { timeout: 5000 });
      const projectSelector = await page.$x("//div[contains(text(), 'Select a project')]");
      
      if (projectSelector.length > 0) {
        await projectSelector[0].click();
        await page.waitForTimeout(1000);
        
        // Select the specified project
        const projectOption = await page.$x(`//div[text()='${adoProject}']`);
        if (projectOption.length > 0) {
          await projectOption[0].click();
          await page.waitForTimeout(1000);
        } else {
          throw new Error(`Project "${adoProject}" not found in dropdown`);
        }
      } else {
        throw new Error("Couldn't find project selector dropdown");
      }
      
      // Enter the ADO work item ID
      log(`Entering ADO work item ID: ${adoWorkItemId}...`);
      const workItemInput = await page.waitForXPath("//input[@placeholder='Just the number will do']", { timeout: 5000 });
      
      if (workItemInput) {
        await workItemInput.click();
        await workItemInput.type(adoWorkItemId.toString());
        await page.waitForTimeout(1000);
      } else {
        throw new Error("Couldn't find work item input field");
      }
      
      // Click the Link button
      log(`Clicking Link button...`);
      const linkButton = await page.$x("//button[contains(text(), 'Link')]");
      
      if (linkButton.length > 0) {
        await linkButton[0].click();
        // Wait for the link to be established
        await page.waitForTimeout(5000);
      } else {
        throw new Error("Couldn't find Link button");
      }
      
      log(`Link successfully created between PB feature and ADO work item ${adoWorkItemId}`);
    } catch (error) {
      log(`Error during automation: ${error.message}`);
      
      // Take a screenshot to help debug
      await page.screenshot({ path: 'error-screenshot.png' });
      console.error(`Error details: ${error.stack}`);
      throw error;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`Failed to complete the linking process: ${error.message}`);
    process.exit(1);
  }
  
  log('Process completed successfully');
}

// Run the main function
linkPbToAdo().catch(error => {
  console.error(`An unexpected error occurred: ${error.message}`);
  process.exit(1);
});
