#!/bin/bash

# Script to replace the src directory with src_rebuild

# Check if src_rebuild exists
if [ ! -d "src_rebuild" ]; then
  echo "Error: src_rebuild directory not found"
  exit 1
fi

# Backup the current src directory
echo "Backing up the current src directory to src_old..."
if [ -d "src" ]; then
  mv src src_old
  echo "Backup created at src_old"
else
  echo "No existing src directory found, proceeding without backup"
fi

# Move src_rebuild to src
echo "Moving src_rebuild to src..."
mv src_rebuild src
echo "Successfully moved src_rebuild to src"

echo "Done! The src directory has been replaced with src_rebuild."
echo "You can now build the app from the root directory using 'npm run build'"
