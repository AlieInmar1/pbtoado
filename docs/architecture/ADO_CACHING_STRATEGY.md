# Azure DevOps Caching Strategy

## Overview

This document outlines the caching strategy implemented for Azure DevOps (ADO) data in the PBtoADO application. The strategy addresses the challenge of IP restrictions or security policies that prevent direct access to Azure DevOps from Supabase Edge Functions.

## Problem Statement

Initially, we attempted to implement a server-side synchronization mechanism using Supabase Edge Functions to periodically fetch data from Azure DevOps and store it in Supabase tables. However, testing revealed that Azure DevOps API calls from Supabase Edge Functions were being blocked, likely due to IP restrictions or security policies on the Azure DevOps side.

## Solution Architecture

The implemented solution uses a frontend-driven caching approach:

1. **Frontend-Initiated Sync**: The frontend application, which has proven ability to connect to Azure DevOps, fetches data directly from the ADO API.

2. **Transparent Caching**: After fetching data from ADO, the frontend automatically caches it in Supabase tables.

3. **Cache-First Retrieval**: Subsequent requests first check the Supabase cache before making calls to ADO.

4. **Fallback Mechanism**: If ADO API calls fail, the system falls back to cached data when available.

5. **Manual Sync Option**: An admin interface allows users to manually trigger a full sync of all ADO data.

## Implementation Details

### Cache Tables

The following tables are used for caching ADO data:

- `ado_work_items`: Stores work items (Epics, Features, User Stories)
- `ado_work_item_relations`: Stores relationships between work items
- `ado_area_paths`: Stores area paths (classification nodes)
- `ado_teams`: Stores team information
- `ado_work_item_types`: Stores work item type definitions

### API Layer

The caching logic is implemented in `src/lib/api/azureDevOpsWithCache.ts`, which wraps the original ADO API functions from `src/lib/api/azureDevOps.ts` with caching behavior:

1. **Read Operations**:
   - First check if requested data exists in Supabase cache
   - If found and not forcing refresh, return cached data
   - Otherwise, fetch from ADO API
   - After successful fetch, cache the data in Supabase
   - Return the fetched data

2. **Cache Update Strategy**:
   - For most entities, use Supabase's `upsert` operation with appropriate conflict keys
   - For relations, use a replace strategy (delete existing relations for source items, then insert new ones)

3. **Error Handling**:
   - If ADO API calls fail, attempt to retrieve data from cache as fallback
   - Log detailed error information

### React Hooks

The application's React hooks have been updated to use the caching-enabled API:

- `useAzureDevOps.ts`: For fetching individual work items
- `useAzureDevOpsHierarchy.ts`: For fetching the complete hierarchy of work items

### Manual Sync Component

A new component `AzureDevOpsSyncButton` has been added to the Admin interface, allowing users to manually trigger a full sync of all ADO data. This is useful for:

- Initial data population
- Refreshing the cache after significant changes in ADO
- Recovering from sync failures

## Advantages

1. **Reliability**: By leveraging the frontend's proven ability to connect to ADO, we avoid the IP restriction issues.

2. **Performance**: Cached data reduces the need for frequent API calls to ADO.

3. **Offline Capabilities**: The cache provides a fallback when ADO is unavailable.

4. **Reduced API Usage**: Minimizes the number of API calls to ADO, helping to stay within rate limits.

## Limitations

1. **Freshness**: Data may become stale if not regularly synced.

2. **User Dependency**: Initial data population and refreshes depend on user action.

3. **Storage**: Caching large amounts of data may increase Supabase storage usage.

## Future Improvements

1. **Selective Sync**: Implement more granular sync options (e.g., sync only specific work item types or areas).

2. **Differential Updates**: Only fetch and update items that have changed since the last sync.

3. **Background Sync**: Explore options for scheduled background syncs that don't rely on Edge Functions.

4. **Conflict Resolution**: Implement more sophisticated conflict resolution for concurrent updates.

5. **Cache Expiration**: Add time-based cache invalidation for certain data types.
