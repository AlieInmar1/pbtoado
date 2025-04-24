ok # ProductBoard Token Extraction: Two-Call Apify Integration

## Implementation Summary

We've updated the `capture-productboard-tokens` Supabase function to use a more reliable two-step approach for extracting tokens from ProductBoard:

1. **First API Call**: Run the actor and wait for completion
2. **Second API Call**: Fetch the complete token data from the OUTPUT key-value store

This approach provides several advantages:
- It retrieves the explicit OUTPUT value we set in the actor
- It's more direct and reliable
- It includes fallback mechanisms if the OUTPUT call fails

## Changes Made

### 1. Updated API Endpoints

**Previous approach** (single call):
```javascript
// Run, wait, and get dataset items in one call
const apiUrl = `https://api.apify.com/v2/acts/${formattedActorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
```

**New approach** (two calls):
```javascript
// First call: Run the actor
const runSyncUrl = `https://api.apify.com/v2/acts/${formattedActorId}/run-sync?token=${APIFY_API_TOKEN}`;

// Second call: Get the OUTPUT data
const outputUrl = `https://api.apify.com/v2/key-value-stores/${defaultKeyValueStoreId}/records/OUTPUT?token=${APIFY_API_TOKEN}`;
```

### 2. Fallback Mechanism

We've added a fallback mechanism in case the OUTPUT retrieval fails:

```javascript
if (!outputResponse.ok) {
  console.error(`Error getting OUTPUT: ${outputResponse.status} ${outputResponse.statusText}`);
  // Fallback to dataset items
  return await getTokensFromDataset(runId, APIFY_API_TOKEN);
}
```

### 3. JSON Parsing

Since the actor now stores a stringified JSON object in OUTPUT, we've added parsing:

```javascript
// The OUTPUT value is a stringified JSON object
tokenData = JSON.parse(outputText);
```

## How It Works

1. The function first executes the actor with the `run-sync` endpoint, which runs the actor and waits for it to complete
2. From the actor run information, we get the default key-value store ID
3. We then make a second API call to get the OUTPUT value from that key-value store
4. If this fails for any reason, we fall back to getting the data from the dataset items like before
5. The parsed token data is then stored in the database as before

## Deployment Notes

When deploying this function to Supabase:

1. Ignore any TypeScript errors in VS Code - these are expected when working with Deno functions
2. The function supports three token extraction methods:
   - Client-side capture (browser extension)
   - Server-side with Puppeteer (interactive)
   - Server-side with Apify (automated)
3. The Apify method is the most robust and now leverages both dataset and OUTPUT storage

## Testing

Test the function with various scenarios:

1. Normal operation (both API calls succeed)
2. OUTPUT retrieval failure (fallback to dataset)
3. JSON parsing failure (fallback to dataset)
4. Complete failure (proper error handling)

Use the API key and actor parameters from your existing configuration:

```
APIFY_API_TOKEN=your_token
APIFY_TOKEN_EXTRACTOR_ACTOR_ID=username/actor-name
