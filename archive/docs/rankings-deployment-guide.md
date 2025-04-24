# ProductBoard Rankings Deployment Guide

This guide explains how to deploy the ProductBoard rankings storage feature which enables tracking ranking changes over time and provides a UI for reviewing changes before syncing to Azure DevOps.

## Step 1: Deploy Database Changes

Since we encountered permission issues with the automated migration script, you'll need to deploy the SQL changes directly:

### Option A: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/direct-rankings-migration.sql`
4. Paste the SQL into the editor and execute it

### Option B: Using Supabase CLI

If you have the Supabase CLI configured:

```bash
supabase db execute --file ./supabase/direct-rankings-migration.sql
```

## Step 2: Deploy the Supabase Function

Deploy the enhanced sync-productboard-rankings function that now supports storing rankings in the database:

```bash
# Make the deployment script executable if not already
chmod +x deploy-function.sh

# Deploy the function
./deploy-function.sh
```

This function has been updated to:
- Store rankings history in the database
- Track previous/current ranks
- Support optional syncing to Azure DevOps

## Step 3: Verify Deployment

Once deployed, verify everything is working:

1. Go to your ProductBoard Ranking Settings page
2. Click "Extract Rankings" for one of your boards
3. Navigate to the new Rankings page using the "Rankings" link
4. Confirm you can see the extracted rankings with their history

## New Features

### Extracting without syncing to ADO

You can now extract rankings from ProductBoard without immediately syncing to Azure DevOps:

1. Click "Extract Rankings" on a board
2. This will store the rankings in the database
3. You'll see a confirmation with new/changed items count

### Viewing ranking history

The new Rankings page provides:
- Visualization of all rankings with their history
- Filtering to show only changed items
- Search capabilities for finding specific items
- Sorting by different columns including change magnitude

### Manual sync to ADO

Once you've reviewed the changes:
1. Click "Sync to Azure DevOps" on the Rankings page
2. Confirm that you want to update ADO
3. The function will update the StackRank fields in ADO
4. Items will be marked as "Synced" in the UI

## Troubleshooting

If you encounter any issues:

- Check the SQL execution logs for any errors
- Verify the function deployment completed successfully
- Inspect the browser console when using the new UI
- Review the function logs in the Supabase dashboard

## Next Steps

After deployment, consider:

1. Adding this to your CI/CD pipelines
2. Training team members on using the new features
3. Setting up auto-sync for critical boards (via SQL)
