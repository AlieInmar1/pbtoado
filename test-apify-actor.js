// test-apify-actor.js
import fetch from 'node-fetch';

async function testApifyActor() {
  const proxyServerUrl = 'https://pbtoado.onrender.com';
  const endpoint = '/apify/run-pb-linker';
  
  const testData = {
    pbStoryUrl: "https://inmar.productboard.com/products-page?d=MTpQbUVudGl0eToxZmRhZDY4YS02NjZlLTRkY2UtYjVlYi1iMzU2N2YwZGU1NWY%3D",
    adoProjectName: "Healthcare POC 1",
    adoStoryId: "229656"
  };
  
  console.log(`Sending test request to ${proxyServerUrl}${endpoint}`);
  console.log('Test data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(`${proxyServerUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    const responseText = await response.text(); // Get raw text first

    try {
      const responseData = JSON.parse(responseText); // Try parsing as JSON
      console.log('Response data (JSON):', JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (jsonError) {
      // If JSON parsing fails, log the raw text
      console.error('Failed to parse response as JSON.');
      console.log('Raw response text:', responseText);
      // Re-throw the original JSON parsing error or a custom error
      throw new Error(`Received non-JSON response (Status: ${response.status}): ${responseText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('Error during fetch or processing response:', error);
    throw error;
  }
}

testApifyActor()
  .then(result => {
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
  });
