/**
 * Test script for ProductBoard products API integration
 * 
 * This script tests the fetching and processing of ProductBoard products
 * and users from the API.
 * 
 * Usage:
 * node src/test-pb-products.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize ProductBoard API client
const pbApi = axios.create({
  baseURL: 'https://api.productboard.com',
  headers: {
    'Authorization': `Bearer ${process.env.PRODUCTBOARD_API_KEY}`,
    'X-Version': '1',
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch products from ProductBoard API
 */
async function fetchProducts() {
  try {
    const products = [];
    let nextPage = null;
    let page = 1;
    
    do {
      console.log(`Fetching products page ${page}...`);
      
      let url = '/products';
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      if (response.data && response.data.data) {
        products.push(...response.data.data);
      }
      
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${products.length} products`);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Extract users from features
 */
async function extractUsersFromFeatures() {
  try {
    console.log('Fetching features to extract users...');
    
    // Fetch features from Supabase
    const { data: features, error } = await supabase
      .from('productboard_features')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    // Create a map to store unique users by email
    const userMap = new Map();
    
    features.forEach(feature => {
      const metadata = feature.metadata ? JSON.parse(feature.metadata) : {};
      
      if (metadata.owner && metadata.owner.email) {
        // Only add if not already in the map
        if (!userMap.has(metadata.owner.email)) {
          userMap.set(metadata.owner.email, {
            email: metadata.owner.email,
            name: metadata.owner.name || metadata.owner.email.split('@')[0],
            role: metadata.owner.role || 'User'
          });
        }
      }
    });
    
    // Convert map to array
    const users = Array.from(userMap.values());
    console.log(`Extracted ${users.length} unique users from features`);
    return users;
  } catch (error) {
    console.error('Error extracting users from features:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Testing ProductBoard products API integration...');
    
    // Fetch products
    console.log('\n=== Fetching Products ===');
    const products = await fetchProducts();
    console.log('Sample product:', JSON.stringify(products[0], null, 2));
    
    // Extract users from features
    console.log('\n=== Extracting Users ===');
    const users = await extractUsersFromFeatures();
    if (users.length > 0) {
      console.log('Sample user:', JSON.stringify(users[0], null, 2));
    } else {
      console.log('No users found in features');
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
