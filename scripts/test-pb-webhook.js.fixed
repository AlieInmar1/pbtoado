/**
 * Test script for simulating a ProductBoard webhook event
 * 
 * This script sends a simulated ProductBoard webhook event to your
 * Supabase Edge Function for testing the integration end-to-end.
 * 
 * Usage:
 * node scripts/test-pb-webhook.js
 * 
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - PB_WEBHOOK_SECRET: The secret used to validate webhook calls
 */
import 'dotenv/config';
import fetch from 'node-fetch';

// Verify environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const webhookSecret = process.env.PB_WEBHOOK_SECRET;

if (!supabaseUrl || !webhookSecret) {
  console.error('Error: Required environment variables are missing.');
  console.error('Please ensure SUPABASE_URL and PB_WEBHOOK_SECRET are set.');
  process.exit(1);
}

// Create a simulated ProductBoard webhook event
// Project name - using Healthcare POC 1 for test
const projectName = "Healthcare POC 1";

const simulatedWebhookEvent = {
  data: {
    eventType: 'feature.status.updated',
    id: 'pb-test-' + Date.now(),
    links: {
      self: `https://api.productboard.com/features/pb-test-${Date.now()}`
    },
    data: {
      name: 'Test Feature from Webhook',
      description: 'This is a test feature created via simulated webhook',
      type: 'feature',
      status: {
        name: 'With Engineering',
        id: 'status-123'
      },
      component: {
        id: 'comp-123',
        name: 'Frontend',
        project: projectName
      },
      product: {
        id: 'prod-456',
        name: 'Healthcare App'
      },
      parent_id: 'init-789',
      parent: {
        id: 'init-789',
        name: 'Q2 Initiative'
      },
      notes: [
        {
          type: 'acceptance_criteria',
          content: 'Acceptance Criteria:\n- Criterion 1\n- Criterion 2\n- Criterion 3'
        },
        {
          type: 'customer_need',
          content: 'As a user, I want to be able to view my health data in a dashboard'
        },
        {
          type: 'technical_notes',
          content: 'Technical implementation details:\n- Use React for frontend\n- Connect to Health API'
        }
      ],
      custom_fields: {
        effort: 5,
        timeframe: '2025-06-30',
        investment_category: 'Growth',
        growth_driver: true,
        tentpole: false,
        owner: 'john.doe@example.com'
      }
    }
  }
};

/**
 * Send a simulated webhook event to the Supabase Edge Function
 */
async function sendWebhookEvent() {
  try {
    // Format the webhook endpoint URL
    const webhookUrl = `${supabaseUrl}/functions/v1/pb-ado-sync`;
    
    console.log('Sending simulated webhook event...');
    console.log(`Webhook URL: ${webhookUrl}`);
    console.log('Payload:');
    console.log(JSON.stringify(simulatedWebhookEvent, null, 2));
    
    // Make the API call
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': webhookSecret
      },
      body: JSON.stringify(simulatedWebhookEvent)
    });
    
    // Get the response
    const responseData = await response.text();
    
    if (!response.ok) {
      console.error('Webhook Error:', response.status, response.statusText);
      console.error('Error details:', responseData);
      return;
    }
    
    // Success!
    console.log('Webhook event sent successfully!');
    console.log('Response status:', response.status);
    console.log('Response:');
    console.log(responseData);
    
    return responseData;
  } catch (error) {
    console.error('Error sending webhook event:', error);
  }
}

// Run the test
sendWebhookEvent()
  .then(() => {
    console.log('Test completed.');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
