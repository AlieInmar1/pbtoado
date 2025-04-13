# Azure DevOps Incremental Sync and Batching

This document explains the improvements made to the Azure DevOps integration to make it more efficient and reliable.

## Overview

Two major improvements have been implemented:

1. **Batched Requests**: Work item IDs are now processed in smaller batches to avoid URL length limitations.
2. **Incremental Sync**: Only items that have changed since the last successful sync are fetched, reducing the amount of data transferred.

## Batched Requests

### Problem

When fetching a large number of work items (hundreds or thousands), the URL can become too long, resulting in a 404 error. This is because the Azure DevOps API has a limit on URL length.

### Solution

Work item IDs are now processed in smaller batches (50 IDs per request) to avoid URL length limitations. This ensures that even large datasets can be fetched reliably.

## Incremental Sync

### Problem

Previously, every sync operation would fetch all work items, regardless of whether they had changed since the last sync. This was inefficient and could lead to performance issues with large datasets.

### Solution

A new table `ado_sync_history` has been added to track the last successful sync time for each entity type. When performing a sync, only items that have changed since the last successful sync are fetched.

### How It Works

1. The system stores the timestamp of the last successful sync for each entity type (work items, work item types, area paths, teams).
2. When performing a sync, the system adds a date filter to the WIQL query to only fetch items that have changed since the last sync.
3. For the initial sync, or when forcing a full sync, all items are fetched.

## Using the Sync Button

The Azure DevOps Sync button in the Admin panel now has a checkbox to toggle between incremental and full sync:

- **Incremental Sync** (default): Only fetches items that have changed since the last successful sync. This is faster and more efficient for regular updates.
- **Force Full Sync**: Fetches all items regardless of when they were last synced. Use this when you suspect data inconsistencies or after making significant changes to the Azure DevOps project structure.

## Technical Implementation

### Database Schema

A new table `ado_sync_history` has been added with the following structure:

```sql
CREATE TABLE IF NOT EXISTS ado_sync_history (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    last_sync_time TIMESTAMP WITH TIME ZONE NOT NULL,
    items_synced INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### API Changes

The following functions have been updated to support incremental sync:

- `fetchWorkItems`: Now uses batching to avoid URL length limitations
- `queryWorkItems`: Now accepts a `changedSince` parameter to filter by date
- `getWorkItemsByType`: Now accepts a `changedSince` parameter to filter by date
- `getWorkItemsWithHierarchy`: Now accepts a `changedSince` parameter to filter by date
- `syncAllData`: Now accepts a `forceFullSync` parameter to control whether to perform a full or incremental sync

### UI Changes

The Azure DevOps Sync button now has a checkbox to toggle between incremental and full sync.

## Best Practices

- **Regular Incremental Syncs**: Schedule regular incremental syncs to keep your data up to date without overloading the system.
- **Occasional Full Syncs**: Perform a full sync occasionally (e.g., weekly or monthly) to ensure data consistency.
- **After Major Changes**: Perform a full sync after making significant changes to the Azure DevOps project structure.

## Troubleshooting

If you encounter issues with the sync process:

1. Check the browser console for error messages.
2. Try performing a full sync to ensure data consistency.
3. Check the `ado_sync_history` table to see if there are any failed sync operations.
4. If the issue persists, try clearing the cache by truncating the Azure DevOps cache tables and performing a full sync.
