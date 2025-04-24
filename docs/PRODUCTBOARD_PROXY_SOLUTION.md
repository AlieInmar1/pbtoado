# ProductBoard API Proxy Solution

## Overview

This document explains how we've implemented a proxy solution for the ProductBoard API to solve Cross-Origin Resource Sharing (CORS) issues when pushing stories to ProductBoard from the browser.

## Problem

When trying to push stories directly to ProductBoard's API (`https://api.productboard.com/v1`) from the browser, we encountered CORS errors:

```
Access to fetch at 'https://api.productboard.com/v1/features' from origin 'http://localhost:3002' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This happens because ProductBoard's API doesn't include the necessary CORS headers to allow requests from our local development server.

## Solution

We've implemented a proxy solution similar to our Azure DevOps proxy:

1. **Proxy Server Extension**: We added a new route `/pb-api` to our existing proxy server that forwards requests to ProductBoard's API.

2. **API URL Configuration**: We updated `PRODUCTBOARD_API_URL` in `src/config/constants.ts` to point to our local proxy instead of directly to ProductBoard.

## How It Works

1. The browser makes a request to our local proxy server (`http://localhost:3008/pb-api`)
2. The proxy server forwards the request to ProductBoard's API (`https://api.productboard.com/v1`)
3. The proxy server adds the necessary headers and handles the response
4. The response is sent back to the browser

Since the proxy server is a Node.js application, it doesn't face the same CORS restrictions as a browser.

## Implementation Details

### 1. Proxy Server Configuration (`proxy-server/server.js`)

We added a new middleware for ProductBoard:

```javascript
// Proxy middleware for ProductBoard API
app.use('/pb-api', createProxyMiddleware({
  target: 'https://api.productboard.com',
  changeOrigin: true,
  pathRewrite: {
    '^/pb-api': '/v1', // Replace '/pb-api' with '/v1' to match ProductBoard's API structure
  },
  // Forward the authorization header and add other required headers
  onProxyReq: (proxyReq, req) => {
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // Version header required by ProductBoard
    proxyReq.setHeader('X-Version', '1');
    // ...
  }
}));
```

### 2. API URL Configuration (`src/config/constants.ts`)

```javascript
// Changed from 'https://api.productboard.com/v1' to:
export const PRODUCTBOARD_API_URL = 'http://localhost:3008/pb-api';
```

## Usage

1. Start the proxy server before attempting to push to ProductBoard:
   ```bash
   ./start-proxy-server.sh
   ```

2. Create and push stories as normal using the ProductBoard API integration. All requests will be routed through the proxy server.

## Troubleshooting

If you encounter issues when pushing to ProductBoard:

1. Ensure the proxy server is running
2. Check the proxy server logs for any errors
3. Verify that your ProductBoard API token is correctly set in the system configuration

## References

- [CORS MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [http-proxy-middleware Documentation](https://github.com/chimurai/http-proxy-middleware)
- [ProductBoard API Documentation](https://developer.productboard.com/)
