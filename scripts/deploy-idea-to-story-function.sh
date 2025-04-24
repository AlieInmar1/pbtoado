#!/bin/bash
set -e

# Script to deploy the generate-story-from-idea Edge Function to Supabase

FUNCTION_NAME="generate-story-from-idea"
FUNCTION_DIR="supabase/functions/${FUNCTION_NAME}"

echo "🚀 Deploying ${FUNCTION_NAME} function to Supabase..."

# Navigate to the project root
cd "$(dirname "$0")/.."

# Check if the function directory exists
if [ ! -d "${FUNCTION_DIR}" ]; then
  echo "❌ Error: Function directory ${FUNCTION_DIR} not found!"
  exit 1
fi

# Make sure Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Error: Supabase CLI is not installed. Please install it first."
  echo "   https://supabase.com/docs/guides/cli/getting-started"
  exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found in project root."
  echo "   Please create .env file with required environment variables."
  exit 1
fi

# Load API key from .env
if ! grep -q "OPENAI_API_KEY" .env; then
  echo "⚠️ Warning: OPENAI_API_KEY not found in .env file."
  echo "   The function will use mock data instead of real AI-generated content."
else
  # Extract OpenAI API key from .env file
  OPENAI_API_KEY=$(grep "OPENAI_API_KEY" .env | cut -d '=' -f2)
  echo "✅ Found OpenAI API key in .env file."
fi

# Deploy the function
echo "📤 Deploying ${FUNCTION_NAME} to Supabase..."
supabase functions deploy ${FUNCTION_NAME}

# Set environment variables for the function
if [ ! -z "$OPENAI_API_KEY" ]; then
  echo "🔑 Setting OPENAI_API_KEY environment variable for the function..."
  supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY" --env production
fi

echo "✅ Function ${FUNCTION_NAME} deployed successfully!"
echo ""
echo "📋 Testing the deployed function locally:"
echo "  supabase functions serve ${FUNCTION_NAME} --no-verify-jwt --env-file .env"
echo ""
echo "✨ Function endpoint: https://$(grep "SUPABASE_PROJECT_REF" .env | cut -d '=' -f2).supabase.co/functions/v1/${FUNCTION_NAME}"
