#!/bin/bash
# Install dependencies needed for the configuration seed script

# Navigate to the project root
cd "$(dirname "$0")/.."

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Make sure you're in the correct directory."
  exit 1
fi

# Install dotenv and supabase-js if not already installed
DOTENV_INSTALLED=$(grep -c '"dotenv"' package.json || true)
SUPABASE_INSTALLED=$(grep -c '"@supabase/supabase-js"' package.json || true)

if [ "$DOTENV_INSTALLED" -eq 0 ]; then
  echo "Installing dotenv..."
  npm install --save dotenv
else
  echo "dotenv already installed."
fi

if [ "$SUPABASE_INSTALLED" -eq 0 ]; then
  echo "Installing @supabase/supabase-js..."
  npm install --save @supabase/supabase-js
else
  echo "@supabase/supabase-js already installed."
fi

echo ""
echo "Dependencies installed successfully."
echo "You can now run the configuration seed script with:"
echo "node src/seed-config.cjs"
echo ""
echo "Make sure your .env file contains the necessary variables:"
echo "VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY"
echo "VITE_PRODUCTBOARD_API_TOKEN (if applicable)"
echo "VITE_AZURE_DEVOPS_TOKEN (if applicable)"
echo "VITE_AZURE_DEVOPS_ORG (if applicable)"
echo "VITE_AZURE_DEVOPS_PROJECT (if applicable)"
