#!/bin/bash

# Start the Azure DevOps proxy server
echo "Starting Azure DevOps proxy server..."
cd proxy-server && node server.js
