# Azure DevOps to Supabase Caching Implementation Plan

## 1. Goal

*   Store Azure DevOps (ADO) data (Work Items, Hierarchy, Area Paths, Teams, Types) in Supabase tables.
*   Create a synchronization mechanism to periodically fetch data from ADO and update Supabase efficiently.
*   Modify the frontend application to read data exclusively from Supabase instead of making direct ADO API calls.
*   Ensure the data structure returned from Supabase matches the existing structure expected by the frontend hooks and components to minimize frontend refactoring.

## 2. Supabase Schema Design

We need tables to represent the core ADO entities we're currently fetching.

*   **`ado_work_items` Table:** Stores individual work items (Epics, Features, User Stories, etc.).
    *   `id`: `bigint` (Primary Key - ADO Work Item ID)
    *   `url`: `text` (ADO URL)
    *   `rev`: `integer` (Revision number - Used for sync comparison)
    *   `type`: `text` (e.g., 'User Story', 'Feature', 'Epic')
    *   `title`: `text`
    *   `state`: `text`
    *   `reason`: `text`
    *   `area_path`: `text`
    *   `iteration_path`: `text`
    *   `priority`: `integer`
    *   `value_area`: `text`
    *   `tags`: `text` (Semicolon-separated or consider `text[]` if using array functions)
    *   `description`: `text` (HTML content)
    *   `assigned_to_name`: `text` (Display name)
    *   `assigned_to_email`: `text` (Unique name/email)
    *   `created_by_name`: `text` (Display name)
    *   `created_by_email`: `text` (Unique name/email)
    *   `created_date`: `timestamp with time zone`
    *   `changed_by_name`: `text` (Display name)
    *   `changed_by_email`: `text` (Unique name/email)
    *   `changed_date`: `timestamp with time zone` (Used for sync comparison)
    *   `parent_id`: `bigint` (Foreign Key referencing `ado_work_items(id)`, nullable)
    *   `raw_data`: `jsonb` (Stores the full JSON response from the ADO API for this item)
    *   `last_synced_at`: `timestamp with time zone` (Timestamp of the last sync)
    *   *Indexes:* `id` (PK), `type`, `area_path`, `state`, `parent_id`, `changed_date`

*   **`ado_work_item_relations` Table:** Stores relationships between work items.
    *   `source_work_item_id`: `bigint` (Foreign Key referencing `ado_work_items(id)`)
    *   `target_work_item_id`: `bigint` (Extracted from relation URL, might reference items not yet synced)
    *   `target_url`: `text` (Full URL from relation)
    *   `rel_type`: `text` (e.g., 'System.LinkTypes.Hierarchy-Forward', 'System.LinkTypes.Hierarchy-Reverse', 'Related')
    *   `attributes`: `jsonb` (Stores relation attributes like `name`, `comment`)
    *   (Composite Primary Key: `source_work_item_id`, `target_url`, `rel_type`)
    *   *Indexes:* `source_work_item_id`, `target_work_item_id`, `rel_type`

*   **`ado_area_paths` Table:**
    *   `id`: `bigint` (Primary Key - ADO Classification Node ID)
    *   `name`: `text`
    *   `path`: `text` (Full path, e.g., 'Project\\Area\\SubArea')
    *   `structure_type`: `text` (Should always be 'area')
    *   `has_children`: `boolean`
    *   `raw_data`: `jsonb`
    *   `last_synced_at`: `timestamp with time zone`
    *   *Indexes:* `id` (PK), `path`

*   **`ado_teams` Table:**
    *   `id`: `uuid` (Primary Key - ADO Team ID)
    *   `name`: `text`
    *   `description`: `text`
    *   `url`: `text`
    *   `identity_url`: `text`
    *   `project_name`: `text`
    *   `project_id`: `uuid`
    *   `raw_data`: `jsonb`
    *   `last_synced_at`: `timestamp with time zone`
    *   *Indexes:* `id` (PK), `name`

*   **`ado_work_item_types` Table:**
    *   `name`: `text` (Primary Key)
    *   `description`: `text`
    *   `reference_name`: `text`
    *   `url`: `text`
    *   `color`: `text`
    *   `icon_url`: `text`
    *   `is_disabled`: `boolean`
    *   `raw_data`: `jsonb`
    *   `last_synced_at`: `timestamp with time zone`
    *   *Indexes:* `name` (PK)

## 3. Data Synchronization Mechanism (Refined)

*   **Method:** Create a Supabase Edge Function (e.g., `sync-ado-data`).
*   **Trigger:** Manual via Admin UI button or scheduled (e.g., `pg_cron`).
*   **Logic:**
    1.  Fetch all necessary data from ADO (Work Items, Area Paths, etc.).
    2.  **For each type of data (e.g., Work Items):**
        *   Retrieve existing records from Supabase (e.g., `ado_work_items`), fetching `id` and `rev` (or `changed_date`). Store these in a Map for quick lookup: `Map<id, { rev: number, changed_date: string }>`.
        *   **Compare fetched ADO data with existing Supabase data:**
            *   Iterate through fetched ADO items.
            *   If an ADO item's ID is **not** in the Supabase Map -> **New Record**.
            *   If an ADO item's ID **is** in the Supabase Map:
                *   Compare ADO item's `rev` / `changed_date` with the value from the Map.
                *   If ADO data is newer -> **Updated Record**.
                *   If ADO data is not newer -> **Skip Update**.
            *   Keep track of ADO item IDs processed.
        *   **Identify Stale Records:** Any ID in the initial Supabase Map that wasn't processed during the ADO iteration is potentially stale.
        *   **Prepare Data for Supabase:** Create arrays for `newItems`, `updatedItems`. Map ADO fields to Supabase columns.
        *   **Perform Supabase Operations:**
            *   Use `supabase.from('table').insert(newItems)` for new records.
            *   Use `supabase.from('table').update(mappedData).eq('id', item.id)` for each updated item (or explore bulk update patterns if the Supabase client library supports them well). Consider using `upsert` with `ignoreDuplicates: false` as a simpler alternative if precise change detection isn't strictly necessary for *every* sync, relying on `rev`/`changed_date` primarily. The most robust is separate insert/update batches based on comparison.
        *   **Handle Stale Records:** Implement chosen strategy (e.g., `supabase.from('table').delete().in('id', staleIds)`).
    3.  Update a central `sync_status` table or similar with the `last_synced_at` timestamp upon successful completion of *all* data types.
    4.  Implement comprehensive error handling and logging within the Edge Function.
*   **Credentials:** Store ADO API key securely as a Supabase Edge Function secret.

## 4. Frontend Integration

*   **Modify API Library (`src/lib/api/azureDevOps.ts`):**
    *   Rewrite functions (`getWorkItemsWithHierarchy`, `getAreaPaths`, etc.) to use the Supabase client (`import { supabase } from '../supabase';`) to query the new `ado_` tables.
    *   **Crucially:** Structure the data returned by these functions to *exactly match* the format currently returned by the direct ADO calls. This involves:
        *   Querying `ado_work_items`.
        *   Querying `ado_work_item_relations` for relevant items.
        *   Reconstructing the nested `fields` object from table columns.
        *   Reconstructing the `relations` array from the `ado_work_item_relations` table data.
        *   Rebuilding the hierarchy structure (epics map, features map, story list, parent links) as done in the current `buildHierarchy` helper, but using data queried from Supabase.
    *   The `testConnection` function could query Supabase for the last sync time or a sample record.

*   **Update Hooks (`src/hooks/useAzureDevOps*.ts`):**
    *   Update React Query keys (e.g., `['supabase-ado-hierarchy']`).
    *   The `refetch` function provided by `useQuery` will now re-query Supabase. A separate mechanism (e.g., a mutation hook) will be needed to trigger the `sync-ado-data` Edge Function.

*   **Admin UI:**
    *   Display `last_synced_at`.
    *   Button to trigger `sync-ado-data` Edge Function.
    *   Display sync status/errors.

## 5. Potential Challenges

*   **Data Consistency:** Sync frequency vs. data freshness trade-off.
*   **Relationship Reconstruction:** Querying and joining `ado_work_items` and `ado_work_item_relations` efficiently to rebuild the expected `relations` array.
*   **Initial Sync Performance:** Handling potentially large initial data load.
*   **Schema Evolution:** Adapting to ADO API changes.
*   **Query Performance:** Optimizing Supabase queries (joins, filtering) and ensuring appropriate database indexes are created.
*   **Edge Function Limits:** Timeouts or memory limits for large sync operations; may require batching within the function.
