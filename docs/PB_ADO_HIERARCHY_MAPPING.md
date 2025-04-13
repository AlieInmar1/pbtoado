# ProductBoard to Azure DevOps Hierarchy Mapping

This document explains the hierarchy mapping system that allows for configurable mapping between ProductBoard items and Azure DevOps work items.

## Overview

The hierarchy mapping system provides a flexible way to define how items in ProductBoard map to work items in Azure DevOps. This includes:

1. **Type Mapping**: Defining which ProductBoard item types (Initiative, Feature, Sub-feature) map to which Azure DevOps work item types (Epic, Feature, User Story)
2. **Area Path Mapping**: Defining how items are assigned to area paths in Azure DevOps based on business unit, product code, and team

## Hierarchy Levels

### ProductBoard Hierarchy

ProductBoard has a three-level hierarchy:

1. **Initiative**: Top-level strategic items that represent major business objectives
2. **Feature**: Mid-level items that represent specific product features
3. **Sub-feature** (called "Story" in the UI): Detailed implementation items

In ProductBoard, the hierarchy is maintained through parent-child relationships:
- Features have a parent_id that links to their parent Initiative
- Sub-features have a parent_id that links to their parent Feature

### Azure DevOps Hierarchy

Azure DevOps has a similar three-level hierarchy:

1. **Epic**: Top-level strategic items
2. **Feature**: Mid-level items
3. **User Story**: Detailed implementation items

In Azure DevOps, the hierarchy is maintained through work item relations with the relation type "System.LinkTypes.Hierarchy-Reverse" for parent relationships.

## Mapping Configuration

The mapping configuration is stored in the `hierarchy_mappings` table in the database. Each mapping configuration includes:

### Type Mapping

The `pb_to_ado_mappings` field defines how ProductBoard item types map to Azure DevOps work item types:

```json
[
  {
    "pb_level": "initiative",
    "ado_type": "Epic",
    "description": "Map ProductBoard Initiatives to Azure DevOps Epics"
  },
  {
    "pb_level": "feature",
    "ado_type": "Feature",
    "description": "Map ProductBoard Features to Azure DevOps Features"
  },
  {
    "pb_level": "subfeature",
    "ado_type": "User Story",
    "description": "Map ProductBoard Sub-features (Stories) to Azure DevOps User Stories"
  }
]
```

### Area Path Mapping

The `area_path_mappings` field defines how items are assigned to area paths in Azure DevOps:

```json
[
  {
    "business_unit": "Healthcare",
    "product_code": "Platform",
    "team": "Skunkworks",
    "area_path": "Healthcare\\Teams\\Skunkworks",
    "description": "Map Healthcare Platform Skunkworks team items"
  }
]
```

## Mapping Logic

When a new item is created in ProductBoard and needs to be synced to Azure DevOps, the following logic is applied:

1. Determine the ProductBoard level of the item (initiative, feature, or subfeature)
2. Look up the corresponding Azure DevOps work item type from the mapping configuration
3. Determine the business unit, product code, and team for the item
4. Look up the corresponding area path from the mapping configuration
5. Create the work item in Azure DevOps with the correct type and area path
6. Create the parent-child relationship in Azure DevOps if the item has a parent

## Implementation

The hierarchy mapping system is implemented in the following files:

- `src/lib/api/hierarchyMapping.ts`: Core mapping logic and API functions
- `src/hooks/useHierarchyMappings.ts`: React hook for accessing mapping configurations
- `src/features/admin/components/HierarchyMappingEditor.tsx`: UI for editing mapping configurations
- `supabase/migrations/0005_create_hierarchy_mappings_table.sql`: Database schema for mapping configurations
- `src/test-pb-ado-mapping.js`: Test script for validating mapping logic

## Testing

The `src/test-pb-ado-mapping.js` script can be used to test the mapping logic. It:

1. Fetches ProductBoard features and sub-features
2. Fetches Azure DevOps work items that have ProductBoard IDs
3. Applies the mapping logic to see if it would place them in the correct hierarchy
4. Outputs the results for validation

To run the test script:

```bash
node src/test-pb-ado-mapping.js
```

## Extending the Mapping System

The mapping system can be extended in the following ways:

1. **Additional Mapping Fields**: Add more fields to the mapping configuration to support more complex mapping rules
2. **Dynamic Mapping Logic**: Implement more sophisticated mapping logic based on item attributes
3. **Bidirectional Mapping**: Enhance the system to support mapping from Azure DevOps to ProductBoard

## Troubleshooting

If items are not being mapped correctly:

1. Check the mapping configuration in the admin UI
2. Run the test script to validate the mapping logic
3. Check the console logs for any errors during the mapping process
4. Verify that the ProductBoard items have the correct parent-child relationships
