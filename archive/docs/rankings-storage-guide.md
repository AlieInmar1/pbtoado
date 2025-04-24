# ProductBoard Rankings Persistent Storage Guide

## Overview

This implementation adds permanent storage of ProductBoard rankings with a historical view of changes over time. It allows you to extract and store rankings without immediately syncing to Azure DevOps, giving you an opportunity to review changes before they are applied.

## What's New

1. **Database Tables**:
   - New `productboard_item_rankings` table to store all extracted rankings
   - New `productboard_rank_changes` view to easily track changes to rankings
   - Added columns to existing tables to control ranking sync behavior

2. **Function Enhancements**:
   - Updated `sync-productboard-rankings` function to store rankings in the database
   - Added option to extract rankings without syncing to Azure DevOps
   - Added detailed tracking of rank changes between synchronizations

3. **User Interface**:
   - New ProductBoardRankings page to view ranking history
   - Links from the tracking manager to view rankings for a specific board
   - Visual indicators for ranking changes (up/down)

## Implementation Details

### Database Schema

The implementation adds the following to your database:

```sql
-- Main rankings storage table
CREATE TABLE productboard_item_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id TEXT NOT NULL,
  sync_history_id UUID REFERENCES productboard_sync_history(id),
  story_id TEXT NOT NULL,
  story_name TEXT,
  current_rank INTEGER NOT NULL,
  previous_rank INTEGER,
  indent_level INTEGER,
  matching_id TEXT,
  is_synced_to_ado BOOLEAN DEFAULT false,
  synced_to_ado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_id, board_id, story_id)
);

-- Indexes for faster queries
CREATE INDEX idx_productboard_item_rankings_board ON productboard_item_rankings(workspace_id, board_id);
CREATE INDEX idx_productboard_item_rankings_sync ON productboard_item_rankings(sync_history_id);

-- View for tracking rank changes
CREATE VIEW productboard_rank_changes AS
SELECT 
  r.id, r.workspace_id, r.board_id, r.story_id, r.story_name,
  r.current_rank, r.previous_rank,
  ABS(r.current_rank - r.previous_rank) AS rank_change,
  CASE 
    WHEN r.current_rank < r.previous_rank THEN 'up'
    WHEN r.current_rank > r.previous_rank THEN 'down'
    ELSE 'unchanged'
  END AS change_direction,
  r.matching_id, r.is_synced_to_ado, r.updated_at, b.board_name,
  (r.current_rank <> r.previous_rank AND r.previous_rank IS NOT NULL) AS has_changed
FROM 
  productboard_item_rankings r
JOIN 
  productboard_tracked_boards b ON r.board_id = b.board_id AND r.workspace_id = b.workspace_id
WHERE 
  r.previous_rank IS NOT NULL;

-- Column additions to existing tables
ALTER TABLE productboard_tracked_boards ADD COLUMN auto_sync_rankings BOOLEAN DEFAULT false;
ALTER TABLE productboard_sync_history ADD COLUMN rankings_stored BOOLEAN DEFAULT false;
```

### Updated Supabase Function

The `sync-productboard-rankings` function has been enhanced to:

1. Accept a new parameter `sync_to_ado` (default: false) to control whether to update Azure DevOps
2. Store all rankings in the database, tracking previous/current ranks
3. Return detailed information about changes to rankings
4. Only update Azure DevOps when explicitly requested

### New UI

A new page at `/admin/productboard/rankings/:workspaceId/:boardId` allows you to:

1. View all items in a ProductBoard with their current and previous ranks
2. Filter to see only changed items
3. Search for specific items by ID or name
4. Sort by different columns including change magnitude
5. View different historical syncs

## How to Deploy

### Step 1: Run the Database Migration

```bash
# Make the migration script executable
chmod +x run-rankings-migration.js

# Run the migration
node run-rankings-migration.js
```

### Step 2: Deploy the Updated Function

```bash
# Deploy the function to Supabase
./deploy-sync-function.sh
```

### Step 3: Test the Implementation

1. Go to Settings > ProductBoard Ranking Settings
2. Click "Extract Rankings" for a board
3. Navigate to the new "Rankings" page for that board
4. View the stored rankings and any changes
5. When ready, click "Sync to Azure DevOps" to apply the changes

## Usage Guide

### Extracting Rankings Only (No ADO Sync)

1. Go to ProductBoard Ranking Settings
2. Click "Extract Rankings" for the desired board
3. The function will extract all rankings and store them in the database
4. You'll see a confirmation with the number of new and changed items

### Viewing Ranking History

1. Go to ProductBoard Ranking Settings
2. Click "Rankings" button for a board
3. The rankings page shows all items with their current and previous ranks
4. Use filters to see only changed items or search for specific items
5. The "Changes" column highlights if an item moved up or down in rank

### Syncing to Azure DevOps

After reviewing the rankings:

1. Click "Sync to Azure DevOps" on the rankings page
2. Confirm that you want to update ADO with these rankings
3. The function will update the StackRank field for each work item in ADO
4. Items will be marked as "Synced" in the UI

## Configuration

You can enable auto-sync for a board in the database:

```sql
UPDATE productboard_tracked_boards
SET auto_sync_rankings = true
WHERE board_id = 'your-board-id';
```

When auto-sync is enabled, extraction will automatically sync to ADO without manual confirmation.
