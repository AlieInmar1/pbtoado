/**
 * Centralized environment variable loader
 * This ensures consistent loading of environment variables across all scripts
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

function loadEnv() {
  // Get the base directory (should be pb-connect)
  const baseDir = path.resolve(__dirname, '..');
  const envPath = path.join(baseDir, '.env');
  
  console.log(`Looking for .env file at: ${envPath}`);
  
  // Check if file exists
  if (fs.existsSync(envPath)) {
    console.log('.env file found ✓');
    // Load environment variables
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.error('Error loading .env file:', result.error);
    } else {
      console.log('.env file loaded successfully ✓');
    }
  } else {
    console.error('.env file not found at expected location ✗');
    // Try to load from current working directory as fallback
    const cwdEnvPath = path.join(process.cwd(), '.env');
    console.log(`Trying fallback location: ${cwdEnvPath}`);
    
    if (fs.existsSync(cwdEnvPath)) {
      console.log('Found .env in current working directory ✓');
      dotenv.config({ path: cwdEnvPath });
    } else {
      console.error('No .env file found in fallback location ✗');
    }
  }
  
  // Validate critical environment variables
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'PRODUCTBOARD_API_KEY'];
  const missingVars = requiredVars.filter(name => !process.env[name]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('All required environment variables present ✓');
  }
}

// Execute on import
loadEnv();

module.exports = { loadEnv };
