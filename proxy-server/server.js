const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3008;

// Enable CORS for all routes
app.use(cors());

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Proxy middleware for Azure DevOps API
app.use('/ado', createProxyMiddleware({
  target: 'https://dev.azure.com',
  changeOrigin: true,
  pathRewrite: {
    '^/ado': '', // Remove the '/ado' prefix when forwarding
  },
  // Forward the authorization header
  onProxyReq: (proxyReq, req) => {
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // Log the proxied request
    console.log(`[${new Date().toISOString()}] Proxying to: ${proxyReq.path}`);
  },
  // Log the proxy response
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[${new Date().toISOString()}] Proxy response: ${proxyRes.statusCode}`);
  },
  // Handle errors
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] Proxy error:`, err);
    res.status(500).send('Proxy Error: ' + err.message);
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Proxy server is running');
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Use http://localhost:${PORT}/ado/[organization]/[project]/... to access Azure DevOps API`);
});
