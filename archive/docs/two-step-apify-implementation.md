# Two-Step Apify Token Extraction Implementation

## Summary of Changes

We've modified the ProductBoard token extraction function to use a more efficient two-step approach:

1. **Step 1: Start the Actor Run**
   - Make an API call to start the actor and get the default key-value store ID
   - This is non-blocking and returns immediately with run information

2. **Step 2: Wait and Get Results**
   - Wait 70 seconds to give the actor time to finish execution
   - Make a second API call to directly fetch the OUTPUT from the key-value store

3. **Process Results**
   - Parse the JSON response from OUTPUT (which contains our token data)
   - Return the token data in the expected format

## Benefits of This Approach

1. **More Reliable**: 
   - No dependency on status checking which was causing errors
   - Direct access to the OUTPUT record where our data is stored

2. **Better Error Handling**:
   - Separate error handling for each step of the process
   - Detailed logging of each stage for easier debugging

3. **Explicit Timing Control**:
   - Fixed 70-second wait time instead of uncertain wait times
   - Can be adjusted based on typical actor run time

## API Endpoints Used

1. **Start Actor Run**:
   ```
   https://api.apify.com/v2/acts/{actorId}/runs?token={APIFY_API_TOKEN}
   ```

2. **Get Output Value**:
   ```
   https://api.apify.com/v2/key-value-stores/{storeId}/records/OUTPUT?token={APIFY_API_TOKEN}
   ```

## Deployment Instructions

1. **Backup the Current Function**:
   ```bash
   cp supabase/functions/capture-productboard-tokens/index.ts supabase/functions/capture-productboard-tokens/index.ts.backup
   ```

2. **Deploy Updated Function to Supabase**:
   ```bash
   cd supabase
   supabase functions deploy capture-productboard-tokens --project-ref your-project-ref
   ```

3. **Test the Token Extraction**:
   - Use your application's UI to trigger a token extraction
   - Check the Supabase function logs for proper execution
   - Verify tokens are saved correctly in the database

## Troubleshooting

If you encounter issues:

1. **Check Timeout Value**: If the actor takes longer than 70 seconds to run, increase the timeout value.

2. **API Permissions**: Make sure your Apify API token has the correct permissions.

3. **Response Format**: If the OUTPUT data format changes, you may need to adjust the parsing logic.

4. **Error Logs**: The function now includes detailed logging at each step - check the logs to pinpoint any issues.

5. **Fallback to Previous Implementation**: If needed, you can restore from the backup:
   ```bash
   cp supabase/functions/capture-productboard-tokens/index.ts.backup supabase/functions/capture-productboard-tokens/index.ts
   ```

## Notes on TypeError Messages in VS Code

You may notice TypeScript errors in VS Code for Deno imports and globals. These are expected when working with Deno functions in VS Code and do not affect the function's operation when deployed to Supabase Functions. These errors include:

- Cannot find module errors for Deno imports
- Cannot find name 'Deno'
- Type errors related to browser APIs

These errors occur because VS Code is using Node.js TypeScript settings rather than Deno settings. The function will still work correctly when deployed to Supabase.
