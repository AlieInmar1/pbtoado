/**
 * Main entry point for ProductBoard data sync
 * Provides a CLI interface for running the sync process
 */

const sync = require('./lib/sync');
require('dotenv').config();

// Default board ID if not provided in arguments
const DEFAULT_BOARD_ID = 'default';

/**
 * Parse command line arguments
 * @returns {Object} - Parsed command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const parsedArgs = {
    workspaceId: process.env.PRODUCTBOARD_WORKSPACE_ID,
    boardId: DEFAULT_BOARD_ID,
    reset: false,
    resetTables: []
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--workspace' || arg === '-w') {
      parsedArgs.workspaceId = args[++i];
    } else if (arg === '--board' || arg === '-b') {
      parsedArgs.boardId = args[++i];
    } else if (arg === '--reset' || arg === '-r') {
      parsedArgs.reset = true;
    } else if (arg === '--reset-tables') {
      // Get comma-separated list of tables to reset
      const tableArg = args[++i];
      if (tableArg) {
        parsedArgs.resetTables = tableArg.split(',');
      }
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }
  
  return parsedArgs;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
ProductBoard Data Sync

Usage: node index.js [options]

Options:
  -w, --workspace <id>     ProductBoard workspace ID (defaults to PRODUCTBOARD_WORKSPACE_ID env var)
  -b, --board <id>         ProductBoard board ID (defaults to 'default')
  -r, --reset              Clear all data before syncing (prevents duplicates)
  --reset-tables <tables>  Clear specific tables, comma-separated (e.g. "features,initiatives")
  -h, --help               Show this help message

Environment Variables:
  PRODUCTBOARD_API_KEY     ProductBoard API key (required)
  PRODUCTBOARD_WORKSPACE_ID  ProductBoard workspace ID (optional)
  SUPABASE_URL             Supabase URL (required)
  SUPABASE_KEY             Supabase API key (required)

Examples:
  node index.js --workspace "my-workspace" --board "my-board"
  node index.js --reset  # Clear all tables first
  node index.js --reset-tables "productboard_features,productboard_initiatives"
`);
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const requiredVars = [
    'PRODUCTBOARD_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Error: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`- ${varName}`);
    });
    console.error('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
  }
}

/**
 * Main function to run the sync process
 */
async function main() {
  try {
    validateEnvironment();
    
    const args = parseArguments();
    console.log(`Starting ProductBoard sync with workspace: ${args.workspaceId || '(default)'}, board: ${args.boardId}`);
    
    // Check if reset is requested
    if (args.reset) {
      console.log("⚠️  Resetting all tables before sync to prevent duplicates");
    } else if (args.resetTables.length > 0) {
      console.log(`⚠️  Resetting specified tables before sync: ${args.resetTables.join(', ')}`);
    }
    
    // Add options
    const options = {
      reset: args.reset,
      resetTables: args.resetTables
    };
    
    const result = await sync.syncProductBoardData(args.workspaceId, args.boardId, options);
    
    if (result.success) {
      console.log('\n✅ Sync completed successfully!');
      console.log('\n📊 Statistics:');
      
      // Format our statistics with more details about inserts/updates
      if (result.detailedStats) {
        // Initiatives
        console.log('\n🚀 Initiatives:');
        console.log(`  - Total: ${result.stats.initiatives_count}`);
        if (result.detailedStats.initiatives) {
          console.log(`  - Inserted: ${result.detailedStats.initiatives.inserted || 0}`);
          console.log(`  - Updated: ${result.detailedStats.initiatives.updated || 0}`);
        }
        
        // Objectives
        console.log('\n🎯 Objectives:');
        console.log(`  - Total: ${result.stats.objectives_count}`);
        if (result.detailedStats.objectives) {
          console.log(`  - Inserted: ${result.detailedStats.objectives.inserted || 0}`);
          console.log(`  - Updated: ${result.detailedStats.objectives.updated || 0}`);
        }
        
        // Features
        console.log('\n✨ Features:');
        console.log(`  - Total: ${result.stats.features_count}`);
        if (result.detailedStats.features) {
          console.log(`  - Inserted: ${result.detailedStats.features.inserted || 0}`);
          console.log(`  - Updated: ${result.detailedStats.features.updated || 0}`);
        }
      } else {
        // Fallback to simple stats if detailed stats aren't available
        console.log(`- Initiatives: ${result.stats.initiatives_count}`);
        console.log(`- Objectives: ${result.stats.objectives_count}`);
        console.log(`- Features: ${result.stats.features_count}`);
      }
    } else {
      console.error('\n❌ Sync failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error:', error.message);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  main
};
