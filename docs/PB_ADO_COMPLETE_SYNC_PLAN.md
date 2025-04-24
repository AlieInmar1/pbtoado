# ProductBoard to Azure DevOps Complete Sync System

This document outlines an implementation plan for a comprehensive ProductBoard to Azure DevOps synchronization system. The goal is to maintain a complete inventory of ProductBoard items in our database while selectively syncing appropriate items to ADO when they're ready for engineering work.

## Core Requirements

1. Maintain a complete inventory of all ProductBoard features/stories
2. Automatically sync items to ADO when their status changes to "With Engineering"
3. Keep both systems in sync with changes
4. Provide visibility and control over the sync process

## Implementation Phases

We'll break this into four manageable phases:

## Phase 1: Database Schema & Full Sync (Week 1)

**Tasks:**

1. **Database Schema Updates:**
   - Add tracking fields to pb_ado_mappings table
   - Create migration script for schema changes

2. **Scheduled Full Sync Service:**
   - Create a Supabase Edge Function to run the sync
   - Set up scheduled execution (daily)
   - Use existing pb-connect code for API fetching
   - Add post-processing to mark eligible items

**Deliverables:**
- SQL migration script
- Supabase Edge Function for scheduled sync
- Documentation of schema changes

## Phase 2: Enhanced Webhook Handler (Week 2)

**Tasks:**

1. **Event Type Support:**
   - Add support for feature.created events
   - Add support for feature.updated events
   - Improve handling of status changes

2. **Sync Eligibility Logic:**
   - Determine when items should be synced to ADO
   - Track sync status and history

**Deliverables:**
- Updated pb-ado-sync function
- Documentation of webhook event handling

## Phase 3: ADO Integration Improvements (Week 3)

**Tasks:**

1. **Field Mapping Enhancement:**
   - Improve field mapping between ProductBoard and ADO
   - Support custom fields
   - Handle bidirectional updates

2. **Status Tracking:**
   - Track sync status and history
   - Handle errors and retries

**Deliverables:**
- Enhanced ADO integration logic
- Field mapping configuration system
- Error handling and retry logic

## Phase 4: Admin Interface & Monitoring (Week 4)

**Tasks:**

1. **Admin Dashboard:**
   - View all ProductBoard items and their sync status
   - Filter and search functionality
   - Manual sync controls

2. **Monitoring & Alerts:**
   - Track sync success/failure rates
   - Alert on persistent failures
   - Audit logging

**Deliverables:**
- Admin UI components
- Monitoring dashboard
- Documentation for administrators

## Detailed Task Breakdown

### Phase 1: Database Schema & Full Sync

#### Task 1.1: Create Database Migration

```sql
-- Migration for enhanced pb_ado_mappings table
ALTER TABLE pb_ado_mappings 
ADD COLUMN IF NOT EXISTS sync_eligible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sync_triggered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS item_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index to improve query performance
CREATE INDEX IF NOT EXISTS idx_pb_ado_mappings_sync_eligible 
ON pb_ado_mappings(sync_eligible);

-- Add comment explaining the table
COMMENT ON TABLE pb_ado_mappings IS 
'Maps ProductBoard items to Azure DevOps work items with sync status tracking';
```

#### Task 1.2: Create Scheduled Sync Edge Function

Create a new Supabase Edge Function at `supabase/functions/pb-scheduled-sync/index.ts` that:
1. Runs the existing pb-connect code to sync all ProductBoard data
2. Marks items as eligible for sync based on their status
3. Logs sync statistics and any errors

#### Task 1.3: Set Up Scheduled Execution

Configure the function to run automatically (daily or on demand).

### Phase 2: Enhanced Webhook Handler

#### Task 2.1: Update pb-ado-sync Function

Modify `supabase/functions/pb-ado-sync/index.ts` to:
1. Handle additional event types (created, updated)
2. Apply consistent sync eligibility rules
3. Update the database record for all events
4. Only trigger ADO sync when appropriate

#### Task 2.2: Sync Eligibility Logic

Implement logic that determines when items should be synced to ADO:
- When status changes to "With Engineering"
- When significant fields are updated on already-synced items
- When manually triggered

### Phase 3: ADO Integration Improvements

#### Task 3.1: Field Mapping Enhancement

Create a configurable field mapping system between ProductBoard and ADO:
- Map standard fields (title, description, etc.)
- Map custom fields
- Support different work item types

#### Task 3.2: Status Tracking

Enhance status tracking:
- Track sync attempts and results
- Handle errors and implement retries
- Store detailed sync history

### Phase 4: Admin Interface & Monitoring

#### Task 4.1: Admin Dashboard UI

Create UI components in the admin section:
- Table to view all ProductBoard items
- Filters for sync status, errors, etc.
- Controls for manual sync

#### Task 4.2: Monitoring & Alerts

Implement monitoring:
- Track success/failure metrics
- Set up alerts for issues
- Create audit log of sync activities

## Next Steps

To begin implementation, we should:

1. Start with the database schema updates in Phase 1
2. Create a sample DB migration file
3. Update the existing webhooks to store created items

Let me know when you're ready to proceed with implementing Phase 1, and I'll help create the necessary files and scripts.
