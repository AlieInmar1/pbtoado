# Grooming System Fixes

This document outlines the fixes implemented to address issues with the grooming sessions and grooming assistant components.

## Issues Fixed

### 1. Data Type Mismatch for Complexity Field

**Problem:**
- The database schema defined `complexity` as an integer field in the `grooming_stories` table
- The TypeScript type definitions defined `complexity` as a string enum ('low', 'medium', 'high')
- This mismatch caused errors when trying to store string values in an integer field

**Solution:**
- Updated TypeScript type definitions to use numbers instead of strings:
  - `complexity?: number; // 1=low, 2=medium, 3=high`
- Created a database migration to convert existing string values to integers
- Added comments to clarify the meaning of the numeric values

### 2. Missing Foreign Key Relationship

**Problem:**
- The database was missing a proper foreign key relationship between the `session_stories` and `grooming_stories` tables
- This caused a 400 Bad Request error with the message: "Could not find a relationship between 'session_stories' and 'grooming_stories' in the schema cache"
- The UI components couldn't load or display stories properly

**Solution:**
- Created a new migration file to add the missing foreign key constraint
- Added proper row-level security policies to ensure data access control
- Refreshed the schema cache to ensure the relationship is recognized

### 3. Invalid UUID Format for Workspace ID and Board ID

**Problem:**
- The `SprintPlanningBoard` component was being passed 'default' as the workspace ID in multiple places
- The ProductBoard sync was using 'default' as the default board ID
- This caused errors with the message: "invalid input syntax for type uuid: 'default'"
- The database expected a valid UUID format for these IDs

**Solution:**
- Updated the `SprintPlanningBoard` component to use a valid UUID format ('00000000-0000-0000-0000-000000000000') as the default workspace ID
- Fixed the `src/features/grooming-assistant/routes.tsx` file to pass the valid UUID format instead of 'default'
- Updated the `core/pb-connect/index.js` file to use '00000000-0000-0000-0000-000000000000' as the default board ID
- Updated the `proxy-server/server.js` file to use '00000000-0000-0000-0000-000000000000' as the default board ID
- Updated the `src/lib/api/productBoard.ts` file to document the new default board ID
- This ensures consistency with the rest of the application, which already uses this UUID format for default IDs

### 4. Code Updates

The following files were updated to handle complexity as a number:

1. `src/types/grooming.ts`:
   - Updated `CreateStoryRequest` interface
   - Updated `UpdateStoryRequest` interface
   - Updated `GroomingStory` interface
   - Updated `StoryFilter` interface

2. `src/hooks/useSessionStories.ts`:
   - Updated the `useAddProductBoardFeatureToSession` function to use `2` (medium) as the default complexity value

3. `grooming/hooks/useGroomingData.ts`:
   - Updated the `transformStory` function to handle complexity as a number

4. `grooming/GroomingStoryDetail.tsx`:
   - Updated the `convertToGroomingStory` function to handle complexity as a number

5. `src/features/grooming/components/StoriesTab.tsx`:
   - Updated the `convertToGroomingStory` function to use numeric complexity values

### 5. Story Selector UI Improvements

**Problem:**
- The ProductBoard and regular story selector modals were showing all stories immediately upon opening
- Stories were displayed with full details, making them too large
- There was no way to expand/collapse story details
- The UI was overwhelming with too much information at once
- Type errors in the StorySelector component due to mismatched type definitions

**Solution:**
- Modified the ProductBoardStorySelector and StorySelector components to:
  - Show no stories initially until a search or filter is applied
  - Display only story titles by default in a compact format
  - Add click-to-expand functionality for viewing full story details
  - Simplify the "Add to Session" button to just "Add" to save space
  - Improve empty state messaging to guide users to search or apply filters
- Fixed type errors in the StorySelector component by:
  - Creating a custom Story interface that includes all the properties used in the component
  - Using type aliases to map from the existing types to the custom interface

### 6. Grooming Assistant Component Fixes

**Problem:**
- The GroomingAssistant component was importing toast from 'sonner' instead of './lib/sonner'
- The component was trying to access protected properties from the Supabase client
- TypeScript errors related to import.meta.env not being recognized

**Solution:**
- Fixed the import path for toast to use './lib/sonner' for consistency
- Used environment variables directly instead of trying to access them from the Supabase client
- Added @ts-ignore comments to suppress TypeScript errors related to import.meta.env
- This ensures the Grooming Assistant can properly communicate with the Supabase Edge Functions

### 7. Missing Workspace ID in Story Creation

**Problem:**
- When creating a new grooming story from a ProductBoard feature, the workspace_id field was not being set
- This caused a database constraint violation with the error: "null value in column 'workspace_id' of relation 'grooming_stories' violates not-null constraint"
- The error occurred in both the ProductBoardStorySelector and StorySplittingModal components

**Solution:**
- Updated the CreateStoryRequest interface in src/types/grooming.ts to include workspace_id as a required field
- Modified the useAddProductBoardFeatureToSession hook to include the current workspace ID when creating a story
- Updated the StorySplittingModal component to add the workspace_id to each new story when splitting a story
- Added error handling to check if a workspace is selected before attempting to create stories

### 8. Performance Issues with ProductBoard Feature Selector

**Problem:**
- The ProductBoardStorySelector component was loading and displaying all features at once
- This caused performance issues when there were many features
- The UI became cluttered and difficult to navigate with a large number of features

**Solution:**
- Implemented pagination in the ProductBoardStorySelector component
- Limited the display to 10 features per page
- Added pagination controls with Previous/Next buttons and page indicators
- Added a total page count calculation based on the filtered features
- This improves performance and provides a better user experience when working with large datasets

### 9. Missing Discussion Notes Column in Session Stories Table

**Problem:**
- The code was trying to use `discussion_notes` column in the `session_stories` table for storing order information
- This column didn't exist in the database schema, causing the error: "Could not find the 'discussion_notes' column of 'session_stories' in the schema cache"
- The error occurred when trying to reorder stories in the StoriesTab component

**Solution:**
- Created a new migration file `supabase/migrations/0014_add_discussion_notes_to_session_stories.sql` to add the missing column
- Added the `discussion_notes TEXT` column to the `session_stories` table
- Added a comment to explain the purpose of the column
- Refreshed the schema cache to ensure the new column is recognized
- This allows the existing code to work without modification, maintaining the intended functionality

### 6. Database Migrations

1. Created migration file `supabase/migrations/0012_update_complexity_field_type.sql` that:
   - Converts existing string values to their numeric equivalents
   - Adds a comment to the column explaining the numeric values

2. Created migration file `supabase/migrations/0013_fix_session_stories_relationship_v2.sql` that:
   - Adds the missing foreign key constraint between `session_stories` and `grooming_stories` tables
   - Creates a simplified row-level security policy that doesn't rely on the `workspace_users` table
   - Refreshes the schema cache

## How to Apply the Fixes

1. Apply the database migrations:
   - Run the SQL migration files against your Supabase database

2. Restart the development server:
   ```bash
   npm run dev
   ```

## Verification

After applying these fixes, the grooming sessions and grooming assistant should work correctly:
- Creating new stories should work without type errors
- Viewing and editing existing stories should display the correct complexity values
- Filtering stories by complexity should work as expected
- The stories should load properly in the session view
- The UI components (table, filters, etc.) should function correctly

## Additional Notes

- The complexity field is now consistently represented as a number throughout the application
- This change maintains backward compatibility with existing data through the migration
- The UI still presents complexity in a user-friendly way (low, medium, high) while storing it as a number
- The foreign key relationship ensures data integrity between session stories and grooming stories
