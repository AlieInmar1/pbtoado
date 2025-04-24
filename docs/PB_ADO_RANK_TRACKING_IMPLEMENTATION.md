# ProductBoard-ADO Rank Tracking Implementation Guide

This document outlines the implementation approach for tracking ranks and board positions between ProductBoard and Azure DevOps, allowing for consistent prioritization across both systems.

## Database Schema

We've added the following fields to the `pb_ado_enhanced_mappings` table to support rank tracking:

```sql
-- Rank tracking fields
pb_feature_rank INTEGER,               -- Position of feature in ProductBoard
pb_story_within_feature_rank INTEGER,  -- Position of story within its parent feature
ado_backlog_rank INTEGER,              -- Position in ADO backlog
pb_board_section VARCHAR(100)          -- Board section/column (e.g., "To Do", "In Progress")
```

## Implementation Components

### 1. Board Scraper Enhancement

The ProductBoard board scraper will be enhanced to:

- Extract and store the feature rank on the feature board
- Extract and store the story ranks within each feature
- Capture the board section/column for each item
- Store this data in the `pb_ado_enhanced_mappings` table

### 2. ADO Backlog Rank Integration

- When creating/updating ADO work items, set the `Stack Rank` field based on our internal rank
- When changes occur in ADO, sync back the rank to our system

### 3. Rank Change Detection

- Monitor for rank changes in ProductBoard through webhooks/polling
- Compare current ranks with stored ranks to detect changes
- For significant rank changes, trigger updates to ADO

### 4. Bi-directional Sync

- If a story is reprioritized in ProductBoard, update its rank in ADO
- If a story is reprioritized in ADO, update the database to reflect this change

## API Endpoints

### ProductBoard API

- Board API will be used to retrieve current board layouts and item positions
- We'll parse the response to extract:
  - Feature positions in the feature board
  - Story positions within each feature
  - Current board section for each item

### Azure DevOps API

- Use the ADO REST API to update the `Stack Rank` field
- For bulk updates, use batch operations to minimize API calls

## Client-side Components

1. **Rank Status Indicator**
   - Visual indicator showing if ranks are in sync between systems
   - Appears on story detail views

2. **Rank Sync Button**
   - Manual button to force rank synchronization
   - For admin use when automatic sync fails

3. **Board Position Viewer**
   - Admin component to view and compare positions across systems
   - Helpful for troubleshooting sync issues

## Usage Examples

### Example 1: Tracking Feature Position

```javascript
// Sample code for updating a feature's position
const updateFeatureRank = async (featureId, newRank) => {
  const { error } = await supabase
    .from('pb_ado_enhanced_mappings')
    .update({ pb_feature_rank: newRank })
    .eq('pb_feature_id', featureId);
  
  if (error) console.error('Failed to update rank:', error);
  else await syncRankToAdo(featureId); // Sync to ADO
};
```

### Example 2: Syncing Board Section Changes

```javascript
// Sample code for updating a story's board section
const updateBoardSection = async (storyId, newSection) => {
  const { error } = await supabase
    .from('pb_ado_enhanced_mappings')
    .update({ pb_board_section: newSection })
    .eq('pb_feature_id', storyId);
  
  if (error) console.error('Failed to update board section:', error);
  else await syncBoardSectionToAdo(storyId, newSection); // Sync section to ADO
};
```

## Testing Strategy

1. **Unit Tests**
   - Test rank extraction logic from board data
   - Test rank comparison functions

2. **Integration Tests**
   - Verify rank updates flow correctly from PB to database
   - Verify rank updates flow correctly from database to ADO

3. **End-to-End Tests**
   - Simulate rank changes in PB and verify ADO updates
   - Simulate rank changes in ADO and verify database updates

## Future Enhancements

- **Batch Processing**: Process rank updates in batches to minimize API calls
- **Visual Rank Editor**: Add UI for manually correcting ranks when systems get out of sync
- **Rank Audit Log**: Track all rank changes with timestamps and user info
- **Conflict Resolution**: Smart handling of simultaneous rank changes in both systems
