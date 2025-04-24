#!/bin/bash
# Script to deploy analyze-story-content Edge Function

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
    echo "Please make sure OPENAI_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    exit 1
fi

echo "Deploying analyze-story-content function..."

# Deploy analyze-story-content function
supabase functions deploy analyze-story-content

echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Supabase dashboard: https://app.supabase.io"
echo "2. Navigate to Settings > Functions"
echo "3. Find 'analyze-story-content' and click on it"
echo "4. Add the following environment variables:"
echo "   - OPENAI_API_KEY: $OPENAI_API_KEY"
echo ""
echo "Testing the function:"
echo "To test if the function is working properly, use this curl command:"
echo "curl -X POST '$SUPABASE_URL/functions/v1/analyze-story-content' \\"
echo "  -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"input\": \"Create a user story for a feature that allows users to filter content\"}'"
echo ""
echo "For more information see docs/AI_STORY_GENERATION_GUIDE.md"
