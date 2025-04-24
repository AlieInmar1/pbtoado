#!/bin/bash
# Script to deploy AI-related Supabase Edge Functions

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if .env file exists in root directory
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in root directory."
    echo "Please make sure the .env file exists with your OpenAI API key and Supabase credentials."
    exit 1
fi

# Load environment variables from root .env file
source .env

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: Required environment variables are not set in .env file."
    echo "Please make sure OPENAI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are set."
    exit 1
fi

echo "Deploying AI-related Supabase Edge Functions..."

# Deploy analyze-transcript function
echo "Deploying analyze-transcript function..."
supabase functions deploy analyze-transcript

# Deploy analyze-story function
echo "Deploying analyze-story function..."
supabase functions deploy analyze-story

echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Supabase dashboard: https://app.supabase.io"
echo "2. Navigate to Settings > Functions"
echo "3. Add the following environment variables:"
echo "   - OPENAI_API_KEY: $OPENAI_API_KEY"
echo "   - SUPABASE_URL: $SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY: $SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "For more information, see docs/AI_COMPONENTS_SETUP.md"
