#!/bin/bash
# Test script for Healthcare POC 1 Azure DevOps integration

echo "🚀 Starting Healthcare POC 1 integration test..."

# Make sure all test scripts are executable
chmod +x scripts/test-ado-push.sh
# Node scripts don't need execute permission

# Run Bash/curl test
echo -e "\n📡 Testing direct ADO API with curl (Bash script):"
./scripts/test-ado-push.sh

# Run Node.js test 
echo -e "\n📡 Testing direct ADO API with Node.js:"
node scripts/test-ado-push.js

# Run webhook simulation
echo -e "\n📡 Testing ProductBoard webhook simulation:"
node scripts/test-pb-webhook.js

echo -e "\n✅ All tests completed for Healthcare POC 1 integration."
