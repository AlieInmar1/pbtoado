/**
 * Test script for pushing to Azure DevOps directly
 * 
 * This script creates a work item in Azure DevOps using the same field mappings
 * that will be used in the webhook handler.
 * 
 * Usage:
 * node scripts/test-ado-push.js
 * 
 * Required environment variables:
 * - ADO_ORG: Your Azure DevOps organization
 * - ADO_PROJECT: Your Azure DevOps project
 * - ADO_PAT: Your Azure DevOps Personal Access Token
 */
import 'dotenv/config';
import fetch from 'node-fetch';

// Verify environment variables
const adoOrg = process.env.ADO_ORG;
const adoProject = process.env.ADO_PROJECT;
const adoPat = process.env.ADO_PAT;

if (!adoOrg || !adoProject || !adoPat) {
  console.error('Error: Required environment variables are missing.');
  console.error('Please ensure ADO_ORG, ADO_PROJECT, and ADO_PAT are set.');
  process.exit(1);
}

// Create a simulated ProductBoard item
const simulatedPbItem = {
  id: 'pb-test-' + Date.now(),
  name: 'Test Feature from ProductBoard',
  description: 'This is a test feature created via direct API call',
  status: { name: 'With Engineering' },
  component: { id: 'comp-123', name: 'Frontend' },
  product: { id: 'prod-456', name: 'Healthcare App' },
  parent: { id: 'init-789', name: 'Q2 Initiative' },
  notes: {
    acceptance_criteria: 'Acceptance Criteria:\n- Criterion 1\n- Criterion 2\n- Criterion 3',
    customer_need: 'As a user, I want to be able to view my health data in a dashboard',
    technical_notes: 'Technical implementation details:\n- Use React for frontend\n- Connect to Health API'
  },
  custom_fields: {
    effort: 5,
    timeframe: '2025-06-30',
    investment_category: 'Growth',
    growth_driver: true,
    tentpole: false,
    owner: 'john.doe@example.com'
  }
};

/**
 * Create a work item in Azure DevOps
 */
async function createAdoWorkItem() {
  try {
    // Work item type - using User Story for test
    const workItemType = 'User Story';
    
    // Use Healthcare POC 1 as project name for testing
    const projectName = "Healthcare POC 1";
    
    // Format ADO API URL
    const adoApiUrl = `https://dev.azure.com/${encodeURIComponent(adoOrg)}/${encodeURIComponent(projectName)}/_apis/wit/workitems/$${encodeURIComponent(workItemType)}?api-version=6.0`;
    
    // Create token for basic auth
    const token = Buffer.from(`:${adoPat}`).toString('base64');
    
    // Prepare ADO payload with proper field mappings
    const adoPayload = [
      // Basic fields
      { "op": "add", "path": "/fields/System.Title", "value": simulatedPbItem.name },
      { "op": "add", "path": "/fields/System.AreaPath", "value": projectName }, // Use project name directly for POC
      
      // Description - combine ProductBoard description and notes with enhanced formatting
      { "op": "add", "path": "/fields/System.Description", "value": `
        <div>${simulatedPbItem.description || ''}</div>
        ${simulatedPbItem.notes.customer_need ? `<div><h3>Customer Need:</h3>${simulatedPbItem.notes.customer_need}</div>` : ''}
        ${simulatedPbItem.notes.technical_notes ? `<div><h3>Technical Notes:</h3>${simulatedPbItem.notes.technical_notes}</div>` : ''}
        <div><h3>ProductBoard Link:</h3><a href="https://productboard.com/feature/${simulatedPbItem.id}">ProductBoard Feature ${simulatedPbItem.id}</a></div>
      `.trim() },
      
      // Acceptance criteria as a dedicated field
      { "op": "add", "path": "/fields/Microsoft.VSTS.Common.AcceptanceCriteria", "value": simulatedPbItem.notes.acceptance_criteria || '' },

      // State mapping to "New" by default
      { "op": "add", "path": "/fields/System.State", "value": "New" },
      
      // Add story points if available
      { "op": "add", "path": "/fields/Microsoft.VSTS.Scheduling.StoryPoints", "value": simulatedPbItem.custom_fields.effort || 0 },
      
      // Add target date if available
      { "op": "add", "path": "/fields/Microsoft.VSTS.Scheduling.TargetDate", "value": simulatedPbItem.custom_fields.timeframe || null },
      
      // Business Value - set to high for items from ProductBoard
      { "op": "add", "path": "/fields/Microsoft.VSTS.Common.BusinessValue", "value": 2 },
      
      // Add ProductBoard metadata as tags
      { "op": "add", "path": "/fields/System.Tags", "value": [
        `ProductBoard:${simulatedPbItem.id}`,
        `PB-Component:${simulatedPbItem.component.id || "none"}`,
        `PB-Product:${simulatedPbItem.product.id || "none"}`,
        simulatedPbItem.custom_fields.growth_driver ? "GrowthDriver" : "",
        simulatedPbItem.custom_fields.tentpole ? "Tentpole" : "",
        simulatedPbItem.custom_fields.investment_category ? `Investment:${simulatedPbItem.custom_fields.investment_category}` : ""
      ].filter(Boolean).join("; ") }
    ];
    
    console.log('Sending work item creation request to ADO...');
    console.log(`API URL: ${adoApiUrl}`);
    console.log('Payload:');
    console.log(JSON.stringify(adoPayload, null, 2));
    
    // Make the API call
    const response = await fetch(adoApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': `Basic ${token}`
      },
      body: JSON.stringify(adoPayload)
    });
    
    // Get the response
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('ADO API Error:', response.status, response.statusText);
      console.error('Error details:', JSON.stringify(responseData, null, 2));
      return;
    }
    
    // Success!
    console.log('Work item created successfully!');
    console.log('Work Item ID:', responseData.id);
    console.log('Work Item URL:', responseData._links?.html?.href);
    console.log('Full Response:');
    console.log(JSON.stringify(responseData, null, 2));
    
    return responseData;
  } catch (error) {
    console.error('Error creating work item:', error);
  }
}

// Run the test
createAdoWorkItem()
  .then(() => {
    console.log('Test completed.');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
