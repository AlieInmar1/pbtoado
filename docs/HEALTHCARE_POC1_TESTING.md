# Healthcare POC 1 - Testing Guide

This document provides instructions for testing the updated ProductBoard to Azure DevOps integration scripts specifically targeting the Healthcare POC 1 project.

## Issues Fixed

The test scripts have been fixed to resolve several issues:

1. **Bash Script (`test-ado-push.sh`)**:
   - Fixed environment variable loading with `set -o allexport` and proper sourcing
   - Added URL encoding for project name parameter with spaces (Healthcare POC 1)
   - Ensured proper escaping in JSON payload

2. **JavaScript Scripts (`test-ado-push.js` and `test-pb-webhook.js`)**:
   - Converted from CommonJS to ES Modules format
   - Replaced `require()` with ES `import` statements
   - Retained the Healthcare POC 1 project targeting

3. **Master Test Script (`test-healthcare-poc1.sh`)**:
   - Updated to call the fixed versions of all test scripts

## How to Use the Fixed Scripts

You have two options:

### Option 1: Use the Fixed Scripts Directly

1. Run the fixed bash script:
   ```bash
   chmod +x scripts/test-ado-push.sh.fixed
   ./scripts/test-ado-push.sh.fixed
   ```

2. Run the fixed Node.js script:
   ```bash
   node scripts/test-ado-push.js.fixed
   ```

3. Run the fixed webhook simulation:
   ```bash
   node scripts/test-pb-webhook.js.fixed
   ```

4. Run all tests with the fixed master script:
   ```bash
   chmod +x scripts/test-healthcare-poc1.sh.fixed
   ./scripts/test-healthcare-poc1.sh.fixed
   ```

### Option 2: Replace the Original Scripts

If you prefer to overwrite the original scripts:

```bash
# Copy the fixed versions over the originals
cp scripts/test-ado-push.sh.fixed scripts/test-ado-push.sh
cp scripts/test-ado-push.js.fixed scripts/test-ado-push.js
cp scripts/test-pb-webhook.js.fixed scripts/test-pb-webhook.js
cp scripts/test-healthcare-poc1.sh.fixed scripts/test-healthcare-poc1.sh

# Make them executable
chmod +x scripts/test-ado-push.sh
chmod +x scripts/test-healthcare-poc1.sh
```

Then you can run the tests using the original filenames:

```bash
./scripts/test-healthcare-poc1.sh
```

## Additional Node.js Setup

For the JavaScript files, since they're now using ES Modules, you'll need to ensure you have the required dependencies:

```bash
npm install dotenv node-fetch
```

## Environment Variables

Remember to set up the following environment variables in your `.env` file:

```
# Azure DevOps configuration
ADO_ORG=your-organization
ADO_PROJECT=your-project-name
ADO_PAT=your-personal-access-token

# ProductBoard configuration (for webhook test)
PB_WEBHOOK_SECRET=your-webhook-secret

# Supabase configuration (for webhook test)
SUPABASE_URL=your-supabase-url
```

## Verify Test Success

After running the tests, you should:

1. See successful API responses in the terminal
2. Be able to view the created work items in Azure DevOps under the Healthcare POC 1 project
3. Verify that the area path is correctly set (e.g., "Healthcare POC 1\Frontend")
4. Check that all mapped fields are populated correctly
