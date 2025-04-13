# ProductBoard Hierarchy Visualization

## Overview

The ProductBoard Hierarchy Visualization component provides a comprehensive view of the ProductBoard product structure, enabling users to explore the hierarchical relationships between products, components, features, and subfeatures. This document explains the hierarchy visualization features, implementation details, and usage guides.

## Table of Contents

1. [Hierarchy Structure](#hierarchy-structure)
2. [Visualization Components](#visualization-components)
3. [Data Synchronization](#data-synchronization)
4. [User Interface](#user-interface)
5. [Filtering and Search](#filtering-and-search)
6. [Relationship Visualization](#relationship-visualization)
7. [Integration with Azure DevOps](#integration-with-azure-devops)
8. [Troubleshooting](#troubleshooting)

## Hierarchy Structure

### ProductBoard Hierarchy Model

The ProductBoard hierarchy consists of several key entity types arranged in hierarchical relationships:

1. **Products**: Top-level containers representing distinct products or product lines
2. **Components**: Major functional areas within products
3. **Features**: Specific capabilities or functionalities
4. **Subfeatures**: Granular feature elements or user stories

### Data Representation

In the application, this hierarchy is represented using a nested data structure that preserves the parent-child relationships:

```typescript
interface ProductBoardHierarchyItem {
  id: string;
  name: string;
  type: 'product' | 'component' | 'feature' | 'subfeature';
  parentId: string | null;
  children: ProductBoardHierarchyItem[];
  attributes: {
    status?: string;
    priority?: number;
    description?: string;
    // Additional metadata
  };
}
```

## Visualization Components

### ProductBoardHierarchyManager (`ProductBoardHierarchyManager.tsx`)

The main controller component that:
- Coordinates data loading and caching
- Handles user interactions
- Manages selection state
- Provides filtering and search capabilities

### EnhancedProductHierarchyView (`EnhancedProductHierarchyView.tsx`)

The visual representation component that renders the hierarchy as an interactive tree, including:
- Expandable/collapsible nodes
- Visual status indicators
- Relationship lines
- Selection highlighting

### HierarchyDetailPanel

A contextual panel that displays detailed information about the selected hierarchy item, including:
- Complete metadata
- Status and progress indicators
- Related items
- Actions specific to the item type

## Data Synchronization

### Data Loading Process

1. **Initial Load**:
   - Hierarchy data is fetched from ProductBoard API upon component mount
   - Data is transformed into the internal hierarchy model
   - Only top-level products are fully loaded initially

2. **On-Demand Loading**:
   - Lower levels of the hierarchy are loaded when a parent node is expanded
   - This lazy-loading approach optimizes performance for large hierarchies
   - Cache prevents redundant API calls

3. **Periodic Refresh**:
   - Data is automatically refreshed at configurable intervals
   - Changes are visually indicated to users
   - Manual refresh option is also available

### Caching Strategy

- Hierarchy data is cached at multiple levels:
  - In-memory cache during session
  - IndexedDB for persistence between sessions
  - Server-side cache in Supabase for shared access
- Cache invalidation occurs on explicit user actions or detected API changes

## User Interface

### Tree Visualization

The hierarchy is displayed as an interactive tree with:
- Expand/collapse controls for each parent node
- Visual indicators for item types (products, components, features)
- Status badges showing current state (completed, in progress, etc.)
- Selection highlighting for the active item

### Navigation Controls

- **Breadcrumb Trail**: Shows current location in hierarchy
- **Expand All / Collapse All**: Controls for tree visibility
- **Focus Mode**: Zooms to selected branch for deep hierarchies
- **View Toggle**: Switches between tree view and alternative visualizations

### Contextual Actions

Each hierarchy item offers contextual actions appropriate to its type:
- **Product Level**: Management, settings, metrics
- **Component Level**: Resource allocation, timeline view
- **Feature Level**: Ranking, status update, ADO synchronization
- **Subfeature Level**: Development tracking, user story generation

## Filtering and Search

### Filter Options

- **Type Filters**: Focus on specific entity types (products, features, etc.)
- **Status Filters**: Show items in particular states
- **Tag Filters**: Filter by applied tags or labels
- **Custom Attribute Filters**: Filter by any metadata fields

### Search Capabilities

- **Full-Text Search**: Find items by name, description, or content
- **Path Search**: Locate items by their hierarchical path
- **Advanced Query Syntax**: Combine criteria with boolean operators
- **Recent Searches**: Quick access to previously used searches

### Saved Views

- Users can save customized filter and search configurations
- Saved views are persisted for quick access
- Views can be shared with team members

## Relationship Visualization

### Initiative and Objective Relationships

The hierarchy visualization shows how features relate to:
- **Initiatives**: Strategic initiatives that features contribute to
- **Objectives**: Business objectives that features help accomplish

These relationships are visualized through:
- Connection lines with distinct styles
- Relationship type indicators
- Strength or contribution metrics

### Cross-Level Relationships

Some features may have relationships that cross hierarchy levels:
- Features that span multiple components
- Shared dependencies between features
- Competing or complementary features

The visualization uses special indicators to highlight these cross-cutting relationships.

## Integration with Azure DevOps

### Work Item Synchronization Status

The hierarchy visualization shows the synchronization status with Azure DevOps:
- **Synced**: Items synchronized with corresponding ADO work items
- **Pending**: Items queued for synchronization
- **Conflict**: Items with synchronization conflicts
- **Not Synced**: Items not yet mapped to ADO

### Bidirectional Mapping

- ADO work item IDs are displayed for mapped items
- Visual cues show mapping confidence level
- Relationships in ProductBoard are reflected in ADO work item links

### Synchronization Actions

Direct actions available from the hierarchy view:
- Trigger sync for a specific branch
- Create new ADO work items from unsynced features
- Resolve synchronization conflicts
- View detailed sync history

## Troubleshooting

### Common Issues

1. **Hierarchy Load Failures**
   - Check ProductBoard token validity
   - Verify API permissions
   - Check network connectivity
   - Review server logs for API errors

2. **Missing Hierarchy Items**
   - Verify visibility settings in ProductBoard
   - Check that all hierarchy levels are being requested
   - Ensure cache isn't serving stale data
   - Clear application cache and reload

3. **Visualization Performance Issues**
   - Collapse unused branches to reduce render load
   - Use search and filters to focus on relevant sections
   - Consider switching to alternative view modes for large hierarchies
   - Check browser console for rendering warnings

### Diagnostics

When troubleshooting hierarchy visualization issues:
1. Check the Network tab in browser developer tools
2. Review application logs for API errors
3. Verify data consistency between API responses and displayed hierarchy
4. Test with a simplified hierarchy subset if possible
