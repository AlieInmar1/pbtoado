# ProductBoard-Azure DevOps Integration

This application integrates ProductBoard with Azure DevOps to sync feature information, track progress, and manage product development workflow between the two platforms.

## Features

- Sync ProductBoard features to Azure DevOps work items
- Track feature hierarchy between ProductBoard and Azure DevOps
- Manage feature rankings and prioritization
- Track sync history and resolve conflicts
- Manage workspace settings for different teams
- Story grooming and management tools
- Completion status tracking and RICE score prioritization

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Integration**: ProductBoard API and Azure DevOps API

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Supabase account
- ProductBoard account with API access
- Azure DevOps account with API access

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Supabase Setup

The application requires several tables in your Supabase project:

1. **workspaces**: Stores workspace configuration
2. **stories**: Stores synchronized stories and features
3. **productboard_features**: Stores raw ProductBoard feature data
4. **sync_records**: Stores synchronization history
5. **productboard_tracked_boards**: Stores board configuration
6. **productboard_item_rankings**: Stores feature rankings
7. **grooming_sessions**: Stores grooming sessions
8. **ado_work_items**: Caches Azure DevOps work items
9. **ado_work_item_relations**: Caches relationships between work items
10. **ado_area_paths**: Caches Azure DevOps area paths
11. **ado_teams**: Caches Azure DevOps teams
12. **ado_work_item_types**: Caches Azure DevOps work item types
13. **ado_sync_history**: Tracks the last successful sync time for each entity type

You can set up these tables either:
1. Manually through the Supabase dashboard
2. Run the database migrations in the `supabase/migrations` folder

### Running the Application

```bash
npm run dev
```

Visit `http://localhost:5173/` to access the application.

### First-time Setup

1. Once the application is running, you'll be prompted to create a workspace
2. Add your ProductBoard API key
3. Add your Azure DevOps organization and Personal Access Token (PAT)
4. Set up the board mappings between ProductBoard and Azure DevOps
5. Run an initial sync to populate the database

## Core Functionality

- **Dashboard**: Overview of sync status and recent activities
- **Hierarchy**: View and manage the ProductBoard hierarchy
- **Features**: Detailed feature management
- **Rankings**: Feature prioritization tools
- **Stories**: Story management
- **Grooming**: Sprint planning and grooming sessions
- **History**: Sync history and logs
- **Admin**: Workspace configuration and API settings

## Azure DevOps Integration

### Caching Strategy

The application implements a frontend-driven caching strategy for Azure DevOps data:

1. **Frontend-Initiated Sync**: The frontend application fetches data directly from the ADO API.
2. **Transparent Caching**: After fetching data from ADO, it's automatically cached in Supabase tables.
3. **Cache-First Retrieval**: Subsequent requests first check the Supabase cache before making calls to ADO.
4. **Fallback Mechanism**: If ADO API calls fail, the system falls back to cached data when available.
5. **Manual Sync Option**: An admin interface allows users to manually trigger a full sync of all ADO data.

For more details, see [ADO_CACHING_STRATEGY.md](docs/architecture/ADO_CACHING_STRATEGY.md) and [ADO_INCREMENTAL_SYNC_GUIDE.md](docs/ADO_INCREMENTAL_SYNC_GUIDE.md).

### Incremental Sync and Batching

The application now supports incremental sync and batched requests for Azure DevOps data:

1. **Incremental Sync**: Only items that have changed since the last successful sync are fetched, reducing the amount of data transferred and improving sync performance.
2. **Batched Requests**: Work item IDs are processed in smaller batches to avoid URL length limitations, ensuring reliable syncing of large datasets.
3. **Sync History Tracking**: A new table `ado_sync_history` tracks the last successful sync time for each entity type.
4. **UI Controls**: The Azure DevOps Sync button now has a checkbox to toggle between incremental and full sync.

### CORS Proxy Solution

Due to CORS restrictions, direct API calls from the browser to Azure DevOps are blocked. To work around this, the application includes a local proxy server that forwards requests to Azure DevOps and handles the CORS headers.

To use the Azure DevOps integration:

1. Start the proxy server:
   ```bash
   ./start-proxy-server.sh
   ```
2. Run the application:
   ```bash
   npm run dev
   ```

For more details on the proxy server implementation, see [CORS_PROXY_SOLUTION.md](docs/CORS_PROXY_SOLUTION.md).

## Project Structure

- **src/components**: UI components
  - **src/components/admin/AzureDevOpsSyncButton.tsx**: Button component for syncing Azure DevOps data
- **src/contexts**: React context providers
- **src/lib**: Utility functions and API clients
  - **src/lib/api/azureDevOps.ts**: Original Azure DevOps API functions
  - **src/lib/api/azureDevOpsWithCache.ts**: Caching-enabled Azure DevOps API functions
  - **src/lib/api/azureDevOpsProxy.ts**: Proxy-enabled Azure DevOps API functions
  - **src/lib/api/azureDevOpsWithCacheProxy.ts**: Caching and proxy-enabled Azure DevOps API functions
- **src/features**: Feature modules
- **src/hooks**: React hooks for data fetching
- **src/types**: TypeScript type definitions
- **core/pb-connect**: Core integration library
- **supabase**: Supabase configuration and migrations
  - **supabase/migrations/0001_create_ado_cache_tables.sql**: Migration for ADO cache tables
  - **supabase/migrations/0002_create_ado_sync_history_table.sql**: Migration for ADO sync history table
- **proxy-server**: Local proxy server for Azure DevOps API
- **docs**: Documentation
  - **docs/architecture**: Architecture documentation
  - **docs/CORS_PROXY_SOLUTION.md**: Documentation for the CORS proxy solution
  - **docs/ADO_CACHING_TESTING_GUIDE.md**: Guide for testing the ADO caching functionality
  - **docs/ADO_INCREMENTAL_SYNC_GUIDE.md**: Guide for the incremental sync functionality
  - **docs/ADO_FIELD_EXTRACTION_FIX.md**: Documentation of the Azure DevOps field extraction bug fix
  - **docs/PB_ADO_HIERARCHY_MAPPING.md**: Documentation of the ProductBoard to Azure DevOps hierarchy mapping system

## Troubleshooting

If you see a "Failed to load sync history" error on first run, this means the Supabase database tables are not set up properly. Please check the Supabase setup section.
