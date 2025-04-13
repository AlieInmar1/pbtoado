/**
 * ProductBoard API client module
 * Handles fetching data from ProductBoard APIs
 */

const axios = require('axios');
require('dotenv').config();

// Configure axios instance for ProductBoard API
const pbApi = axios.create({
  baseURL: 'https://api.productboard.com',
  headers: {
    'Authorization': `Bearer ${process.env.PRODUCTBOARD_API_KEY}`,
    'X-Version': '1',
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch all initiatives from ProductBoard with pagination
 * @returns {Promise<Array>} - Array of initiatives
 */
async function fetchInitiatives() {
  try {
    const initiatives = [];
    let nextPage = null;
    let page = 1;
    
    // Continue fetching until there are no more pages
    do {
      console.log(`Fetching initiatives page ${page}...`);
      
      // Construct URL with pagination
      let url = '/initiatives';
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      // Add retrieved initiatives to our array
      if (response.data && response.data.data) {
        initiatives.push(...response.data.data);
      }
      
      // Check if there's a next page link in the response
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${initiatives.length} initiatives`);
    return initiatives;
  } catch (error) {
    console.error('Error fetching initiatives:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch all objectives from ProductBoard with pagination
 * @returns {Promise<Array>} - Array of objectives
 */
async function fetchObjectives() {
  try {
    const objectives = [];
    let nextPage = null;
    let page = 1;
    
    // Continue fetching until there are no more pages
    do {
      console.log(`Fetching objectives page ${page}...`);
      
      // Construct URL with pagination
      let url = '/objectives';
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      // Add retrieved objectives to our array
      if (response.data && response.data.data) {
        objectives.push(...response.data.data);
      }
      
      // Check if there's a next page link in the response
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${objectives.length} objectives`);
    return objectives;
  } catch (error) {
    console.error('Error fetching objectives:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch all features from ProductBoard with pagination
 * @returns {Promise<Array>} - Array of features
 */
async function fetchFeatures() {
  try {
    const features = [];
    let nextPage = null;
    let page = 1;
    
    // Continue fetching until there are no more pages
    do {
      console.log(`Fetching features page ${page}...`);
      
      // Construct URL with pagination
      let url = '/features';
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      // Add retrieved features to our array
      if (response.data && response.data.data) {
        features.push(...response.data.data);
      }
      
      // Check if there's a next page link in the response
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${features.length} features`);
    return features;
  } catch (error) {
    console.error('Error fetching features:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Retry a failed API call with exponential backoff
 * @param {Function} apiCall - The API call function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<any>} - The API response
 */
async function retryWithBackoff(apiCall, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      // If we've exhausted retries or it's not a 429 (rate limiting) error, rethrow
      if (retries === maxRetries - 1 || (error.response && error.response.status !== 429)) {
        throw error;
      }
      
      // Calculate delay for next retry with exponential backoff
      const waitTime = delay * Math.pow(2, retries);
      console.log(`Rate limited. Retrying in ${waitTime}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      retries++;
    }
  }
}

/**
 * Fetch objectives linked to a specific initiative
 * @param {string} initiativeId - The ProductBoard ID of the initiative
 * @returns {Promise<Array>} - Array of linked objectives
 */
async function fetchInitiativeObjectives(initiativeId) {
  try {
    console.log(`Fetching objectives linked to initiative ${initiativeId}...`);
    
    const objectives = [];
    let nextPage = null;
    let page = 1;
    
    // Continue fetching until there are no more pages
    do {
      console.log(`Fetching initiative-objective links page ${page}...`);
      
      // Construct URL with pagination
      let url = `/initiatives/${initiativeId}/links/objectives`;
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      // Add retrieved objectives to our array
      if (response.data && response.data.data) {
        objectives.push(...response.data.data);
      }
      
      // Check if there's a next page link in the response
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${objectives.length} objectives linked to initiative ${initiativeId}`);
    return objectives;
  } catch (error) {
    console.error(`Error fetching objectives for initiative ${initiativeId}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch initiatives linked to a specific objective
 * @param {string} objectiveId - The ProductBoard ID of the objective
 * @returns {Promise<Array>} - Array of linked initiatives
 */
async function fetchObjectiveInitiatives(objectiveId) {
  try {
    console.log(`Fetching initiatives linked to objective ${objectiveId}...`);
    
    const initiatives = [];
    let nextPage = null;
    let page = 1;
    
    // Continue fetching until there are no more pages
    do {
      console.log(`Fetching objective-initiative links page ${page}...`);
      
      // Construct URL with pagination
      let url = `/objectives/${objectiveId}/links/initiatives`;
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      // Add retrieved initiatives to our array
      if (response.data && response.data.data) {
        initiatives.push(...response.data.data);
      }
      
      // Check if there's a next page link in the response
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${initiatives.length} initiatives linked to objective ${objectiveId}`);
    return initiatives;
  } catch (error) {
    console.error(`Error fetching initiatives for objective ${objectiveId}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch features linked to a specific initiative
 * @param {string} initiativeId - The ProductBoard ID of the initiative
 * @returns {Promise<Array>} - Array of linked features
 */
async function fetchInitiativeFeatures(initiativeId) {
  try {
    console.log(`Fetching features linked to initiative ${initiativeId}...`);
    
    const features = [];
    let nextPage = null;
    let page = 1;
    
    // Continue fetching until there are no more pages
    do {
      console.log(`Fetching initiative-feature links page ${page}...`);
      
      // Construct URL with pagination
      let url = `/initiatives/${initiativeId}/links/features`;
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      // Add retrieved features to our array
      if (response.data && response.data.data) {
        features.push(...response.data.data);
      }
      
      // Check if there's a next page link in the response
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${features.length} features linked to initiative ${initiativeId}`);
    return features;
  } catch (error) {
    console.error(`Error fetching features for initiative ${initiativeId}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch features linked to a specific objective
 * @param {string} objectiveId - The ProductBoard ID of the objective
 * @returns {Promise<Array>} - Array of linked features
 */
async function fetchObjectiveFeatures(objectiveId) {
  try {
    console.log(`Fetching features linked to objective ${objectiveId}...`);
    
    const features = [];
    let nextPage = null;
    let page = 1;
    
    // Continue fetching until there are no more pages
    do {
      console.log(`Fetching objective-feature links page ${page}...`);
      
      // Construct URL with pagination
      let url = `/objectives/${objectiveId}/links/features`;
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      // Add retrieved features to our array
      if (response.data && response.data.data) {
        features.push(...response.data.data);
      }
      
      // Check if there's a next page link in the response
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${features.length} features linked to objective ${objectiveId}`);
    return features;
  } catch (error) {
    console.error(`Error fetching features for objective ${objectiveId}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch all components from ProductBoard with pagination
 * @returns {Promise<Array>} - Array of components
 */
async function fetchComponents() {
  try {
    const components = [];
    let nextPage = null;
    let page = 1;
    
    // Continue fetching until there are no more pages
    do {
      console.log(`Fetching components page ${page}...`);
      
      // Construct URL with pagination
      let url = '/components';
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await pbApi.get(url);
      
      // Add retrieved components to our array
      if (response.data && response.data.data) {
        components.push(...response.data.data);
      }
      
      // Check if there's a next page link in the response
      nextPage = null;
      if (response.data && response.data.links && response.data.links.next) {
        nextPage = response.data.links.next;
        page++;
      }
    } while (nextPage);
    
    console.log(`Fetched ${components.length} components`);
    return components;
  } catch (error) {
    console.error('Error fetching components:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

module.exports = {
  fetchInitiatives,
  fetchObjectives,
  fetchFeatures,
  fetchComponents,
  fetchInitiativeObjectives,
  fetchObjectiveInitiatives,
  fetchInitiativeFeatures,
  fetchObjectiveFeatures,
  retryWithBackoff
};
