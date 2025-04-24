#!/bin/bash
# Install dependencies for ProductBoard to ADO integration testing

echo "Installing required Node.js dependencies for testing..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm not found. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
npm install --save node-fetch dotenv

# Make test scripts executable
chmod +x scripts/test-ado-push.sh

echo "Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables in .env file:"
echo "   - ADO_ORG"
echo "   - ADO_PROJECT"
echo "   - ADO_PAT"
echo "   - SUPABASE_URL"
echo "   - PB_WEBHOOK_SECRET"
echo "   - PB_API_TOKEN"
echo ""
echo "2. Run the test scripts:"
echo "   - node scripts/test-ado-push.js"
echo "   - ./scripts/test-ado-push.sh"
echo "   - node scripts/test-pb-webhook.js"
