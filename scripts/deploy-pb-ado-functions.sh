#!/bin/bash

# Script to deploy ProductBoard-ADO webhook integration functions
echo "Starting deployment of ProductBoard-ADO webhook integration functions..."

# Change to the project root directory if needed
cd "$(dirname "$0")/.."

# Make sure supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Error: supabase CLI is not installed."
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Deploy the webhook handler function (pb-ado-sync)
echo "Deploying pb-ado-sync function..."
cd supabase/functions/pb-ado-sync
supabase functions deploy pb-ado-sync --no-verify-jwt
if [ $? -ne 0 ]; then
    echo "Error deploying pb-ado-sync function!"
    exit 1
fi
echo "pb-ado-sync function deployed successfully."

# Change back to project root
cd "$(dirname "$0")/.."

# Deploy the integration link updater function (pb-link-updater)
echo "Deploying pb-link-updater function..."
cd supabase/functions/pb-link-updater
supabase functions deploy pb-link-updater --no-verify-jwt
if [ $? -ne 0 ]; then
    echo "Error deploying pb-link-updater function!"
    exit 1
fi
echo "pb-link-updater function deployed successfully."

# Return to project root
cd "$(dirname "$0")/.."

echo "All ProductBoard-ADO webhook integration functions deployed successfully."
echo ""
echo "Next steps:"
echo "1. Set up the following environment variables in the Supabase dashboard:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - PB_API_TOKEN (ProductBoard API token)"
echo "   - PB_WEBHOOK_SECRET (Secret for validating webhook calls)"
echo "   - PB_SESSION_TOKEN (Optional: ProductBoard session token for UI automation)"
echo "   - ADO_ORG (Azure DevOps organization name)"
echo "   - ADO_PROJECT (Azure DevOps project name)"
echo "   - ADO_PAT (Azure DevOps Personal Access Token)"
echo ""
echo "2. Create a webhook in ProductBoard pointing to:"
echo "   https://[your-project-ref].supabase.co/functions/v1/pb-ado-sync"
echo ""
echo "3. Configure the webhook to trigger on status changes (feature.status.updated events)"
echo ""
echo "Done!"

exit 0
