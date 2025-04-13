# Azure DevOps Caching Testing Guide

This guide provides step-by-step instructions for testing the Azure DevOps caching implementation.

## Prerequisites

1. Ensure you have a valid Azure DevOps Personal Access Token (PAT)
2. Make sure the Supabase database tables have been created (see `supabase/migrations/0001_create_ado_cache_tables.sql`)
3. Start the proxy server with `./start-proxy-server.sh`
4. Run the application locally with `npm run dev`

## About the Proxy Server

Due to CORS restrictions, direct API calls from the browser to Azure DevOps are blocked. To work around this, we've implemented a local proxy server that forwards requests to Azure DevOps and handles the CORS headers.

For more details on the proxy server implementation, see [CORS_PROXY_SOLUTION.md](./CORS_PROXY_SOLUTION.md).

## Testing Steps

### 1. Start the Proxy Server

Before testing the Azure DevOps integration, you need to start the proxy server:

1. Open a terminal window
2. Run the start script:
   ```bash
   ./start-proxy-server.sh
   ```
3. You should see output indicating that the proxy server is running:
   ```
   Starting Azure DevOps proxy server...
   Proxy server running on http://localhost:3008
   ```
4. Keep this terminal window open while testing

### 2. Initial Cache Population

Now, let's populate the cache with data from Azure DevOps:

1. Navigate to the Admin page in the application
2. Go to the "Azure DevOps" tab
3. Scroll down to the "Data Synchronization" section
4. Click the "Sync Azure DevOps Data" button
5. Wait for the sync to complete (you should see a success message)
6. Check the proxy server terminal for logs showing the requests being forwarded

### 2. Verify Cache Population

Let's verify that data has been cached in Supabase:

1. Open the Supabase dashboard for your project
2. Navigate to the "Table Editor" section
3. Check the following tables to ensure they contain data:
   - `ado_work_items`
   - `ado_work_item_relations`
   - `ado_area_paths`
   - `ado_teams`
   - `ado_work_item_types`

### 3. Test Cache-First Retrieval

Now, let's test that the application uses the cached data:

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Navigate to a page in the application that displays Azure DevOps data (e.g., the Stories page)
4. Observe the network requests:
   - You should see requests to Supabase (`supabase.co` domain)
   - You should NOT see requests to Azure DevOps (`dev.azure.com` domain) if the data is already cached

### 4. Test Cache Update

Let's test updating the cache:

1. Make a change in Azure DevOps (e.g., update a work item title)
2. Go back to the Admin page
3. Click the "Sync Azure DevOps Data" button again
4. Navigate to the page displaying the work item you modified
5. Verify that the updated information is displayed

### 5. Test Fallback Mechanism

To test the fallback mechanism:

1. Temporarily disable your internet connection or use browser DevTools to simulate offline mode
2. Navigate to a page displaying Azure DevOps data
3. Verify that the data is still displayed (from cache)
4. Check the browser console for any messages indicating fallback to cache

### 6. Test Force Refresh

To test forcing a refresh from the API:

1. In the browser console, you can manually call the API with force refresh:
   ```javascript
   // Example for work items
   const { fetchWorkItems } = await import('./src/lib/api/azureDevOpsWithCache.js');
   const result = await fetchWorkItems('your-org', 'your-project', 'your-pat', [workItemId], true);
   console.log(result);
   ```
2. Observe in the Network tab that a request is made to Azure DevOps
3. Verify in Supabase that the data is updated

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Make sure the proxy server is running
2. Check the proxy server logs for any errors
3. Verify that the application is using the proxy versions of the API functions:
   - `azureDevOpsProxy.ts` instead of `azureDevOps.ts`
   - `azureDevOpsWithCacheProxy.ts` instead of `azureDevOpsWithCache.ts`
4. Try restarting the proxy server

### No Data in Cache

If no data appears in the Supabase tables:

1. Check the browser console for any error messages
2. Check the proxy server logs for any errors
3. Verify that your Azure DevOps PAT is valid and has the necessary permissions
4. Check that the organization and project names are correct

### Cache Not Updating

If the cache doesn't update after syncing:

1. Check if the sync completed successfully (look for success message)
2. Verify that the data actually changed in Azure DevOps
3. Check the browser console for any error messages during sync
4. Check the proxy server logs for any errors

### API Calls Still Being Made

If the application is still making calls to Azure DevOps when it should use the cache:

1. Check that the hooks are properly importing from `azureDevOpsWithCacheProxy.ts` and not directly from `azureDevOps.ts`
2. Verify that the cache contains the requested data
3. Check if `forceRefresh` is being set to `true` somewhere in the code

## Monitoring Cache Performance

To monitor the performance of the caching system:

1. Watch the browser console for log messages from the caching functions
2. Check the network tab to see which requests are being made
3. Monitor the size of the Supabase tables to ensure they don't grow too large
4. Check the proxy server logs to see which requests are being forwarded to Azure DevOps
