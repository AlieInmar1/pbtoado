# Azure DevOps CORS Proxy Solution

## Overview

This document outlines the solution for addressing CORS (Cross-Origin Resource Sharing) issues when making Azure DevOps API calls from the browser.

## Problem

Direct API calls from the browser to Azure DevOps are blocked by CORS policies, which prevent web pages from making requests to a different domain than the one that served the web page. This results in errors like:

```
Access to fetch at 'https://dev.azure.com/...' from origin 'http://localhost:3007' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution: Local Proxy Server

The implemented solution uses a local proxy server that forwards requests to Azure DevOps and handles the CORS headers:

1. **Browser → Local Proxy**: The browser makes requests to a local proxy server running on port 3008.
2. **Local Proxy → Azure DevOps**: The proxy server forwards these requests to Azure DevOps.
3. **Azure DevOps → Local Proxy**: Azure DevOps responds to the proxy server.
4. **Local Proxy → Browser**: The proxy server adds CORS headers and forwards the response back to the browser.

## Implementation

The solution consists of:

1. **Proxy Server**: A simple Express server that proxies requests to Azure DevOps.
2. **Modified API Functions**: Updated API functions that use the proxy server instead of calling Azure DevOps directly.

### Files

- `proxy-server/server.js`: The proxy server implementation.
- `proxy-server/package.json`: Dependencies for the proxy server.
- `src/lib/api/azureDevOpsProxy.ts`: Modified Azure DevOps API functions that use the proxy.
- `src/lib/api/azureDevOpsWithCacheProxy.ts`: Modified caching-enabled API functions that use the proxy.
- `start-proxy-server.sh`: Script to start the proxy server.

## How to Use

### Starting the Proxy Server

1. Open a terminal window.
2. Run the start script:
   ```bash
   ./start-proxy-server.sh
   ```
3. You should see output indicating that the proxy server is running:
   ```
   Starting Azure DevOps proxy server...
   Proxy server running on http://localhost:3008
   Use http://localhost:3008/ado/[organization]/[project]/... to access Azure DevOps API
   ```

### Using the Application

1. With the proxy server running, start the application as usual:
   ```bash
   npm run dev
   ```
2. The application will now use the proxy server for all Azure DevOps API calls.
3. You can verify this by checking the proxy server logs, which will show requests being forwarded to Azure DevOps.

## Troubleshooting

### Proxy Server Not Running

If you see CORS errors in the browser console, check if the proxy server is running:

1. Open a terminal and run:
   ```bash
   curl http://localhost:3008/health
   ```
2. You should see "Proxy server is running" as the response.
3. If not, start the proxy server using the instructions above.

### API Calls Still Failing

If API calls are still failing even with the proxy server running:

1. Check the proxy server logs for any errors.
2. Verify that the application is using the proxy versions of the API functions:
   - `azureDevOpsProxy.ts` instead of `azureDevOps.ts`
   - `azureDevOpsWithCacheProxy.ts` instead of `azureDevOpsWithCache.ts`
3. Check that the proxy URL in `azureDevOpsProxy.ts` is correct (should be `http://localhost:3008/ado`).

## Production Considerations

For production deployment, consider the following options:

### Option 1: Backend Proxy Server

Deploy a proxy server alongside your main application:

1. **Implementation**: Similar to the local proxy, but deployed to your production environment.
2. **Security**: Add authentication to ensure only your application can use the proxy.
3. **Deployment**: Deploy as a separate service or as part of your main backend.

### Option 2: API Gateway

Use an API gateway service that supports CORS and proxying:

1. **Implementation**: Configure the API gateway to proxy requests to Azure DevOps.
2. **Security**: Use API keys or other authentication methods to secure the gateway.
3. **Deployment**: Use a managed service like AWS API Gateway, Azure API Management, or similar.

### Option 3: Server-Side API Calls

Move all Azure DevOps API calls to the server side:

1. **Implementation**: Create server endpoints that make the Azure DevOps API calls.
2. **Security**: Handle authentication on the server side.
3. **Deployment**: Integrate with your existing backend services.

## Security Considerations

1. **API Key Management**: Store the Azure DevOps PAT securely as an environment variable or in a secrets manager.
2. **CORS Configuration**: In production, restrict CORS to only allow requests from your application's domain.
3. **Rate Limiting**: Implement rate limiting to prevent abuse of the Azure DevOps API.
4. **Logging and Monitoring**: Add logging to track API usage and detect potential issues.
