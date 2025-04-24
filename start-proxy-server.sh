#!/bin/bash

# Start the proxy server for both Azure DevOps and ProductBoard APIs
echo "Starting API Proxy Server..."
echo "This proxy server now handles:"
echo " - Azure DevOps API at http://localhost:3008/ado"
echo " - ProductBoard API at http://localhost:3008/pb-api"
echo ""
echo "Make sure the proxy server is running before attempting to push to ProductBoard."

cd proxy-server && node server.js
