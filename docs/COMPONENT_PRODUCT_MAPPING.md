# Component-Product Mapping

This document describes the component-product mapping functionality that has been added to the hierarchy mapping system. This feature allows mapping ProductBoard components to Azure DevOps products, which helps determine the correct area path for features and stories.

## Overview

The hierarchy mapping system now includes a new mapping type: Component-Product Mapping. This mapping type connects ProductBoard components to Azure DevOps products, which is used in conjunction with the existing mappings to determine the correct area path for work items.

The mapping chain now works as follows:

1. **Initiative-Epic Mapping**: Maps ProductBoard initiatives to Azure DevOps epics and determines the business unit
2. **Component-Product Mapping**: Maps ProductBoard components to Azure DevOps products
3. **User-Team Mapping**: Maps ProductBoard users to Azure DevOps teams, optionally filtered by business unit and product

Together, these mappings determine the correct area path for each work item based on its position in the hierarchy and its associated metadata.

## Database Schema

A new table `productboard_components` has been added to store ProductBoard components:

```sql
CREATE TABLE IF NOT EXISTS productboard_components (
  id SERIAL PRIMARY KEY,
  productboard_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  business_unit TEXT,
  product_code TEXT,
  workspace_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The `hierarchy_mappings` table has been updated to include a new field `component_product_mappings`:

```sql
ALTER TABLE public.hierarchy_mappings 
ADD COLUMN IF NOT EXISTS component_product_mappings JSONB DEFAULT '[]'::jsonb;
```

## Data Model

The component-product mapping is represented by the following TypeScript interface:

```typescript
export interface ComponentProductMapping {
  component_id: string;
  component_name: string;
  product_id: string;
  product_name: string;
  business_unit?: string;
  description?: string;
}
```

## Fetching Components

Components are fetched from ProductBoard using the `fetchComponents` function in the pb-connect module. This function fetches all components from ProductBoard and stores them in the database.

A new script `fetch-pb-components.js` has been added to fetch components from ProductBoard and store them in the database. This script can be run manually or scheduled to run periodically.

```bash
node src/fetch-pb-components.js
```

## Using Components in the UI

Components can be accessed in the UI using the `useComponents` hook:

```typescript
import { useComponents } from '../hooks/useComponents';

function MyComponent() {
  const { components, isLoading, error } = useComponents();
  
  // Use components in your UI
}
```

## Mapping Components to Products

Components can be mapped to products in the Hierarchy Mapping Editor. The editor now includes a new tab "Component/Product Mapping" that allows users to create and manage component-product mappings.

Each mapping connects a ProductBoard component to an Azure DevOps product, optionally with a business unit. This mapping is used to determine the product code for a work item based on its associated component.

## Determining Area Paths

The area path for a work item is determined using the following logic:

1. For epics, the area path is determined by the initiative-epic mapping, which provides the business unit
2. For features, the area path is determined by the component-product mapping, which provides the product code
3. For stories, the area path is determined by the user-team mapping, which uses the user, business unit, and product code

The `getTeamForStory` function in `hierarchyMapping.ts` implements this logic:

```typescript
export function getTeamForStory(
  userEmail: string,
  componentId: string,
  businessUnit: string,
  mappings: HierarchyMappingConfig[]
): string {
  // Use the first mapping configuration for now
  const mapping = mappings[0];
  
  // Find the component product mapping to get the product code
  const componentMapping = mapping.component_product_mappings.find(m => 
    m.component_id === componentId
  );
  
  const productCode = componentMapping?.product_name || '';
  
  // Find the matching user team mapping with exact match
  const userTeamMapping = mapping.user_team_mappings.find(m => 
    m.user_email === userEmail && 
    m.product_code === productCode && 
    m.business_unit === businessUnit
  );
  
  // If no exact match, try to find a partial match
  if (!userTeamMapping) {
    // Try matching just user email and product code
    const userProductMapping = mapping.user_team_mappings.find(m => 
      m.user_email === userEmail && 
      m.product_code === productCode
    );
    
    if (userProductMapping) {
      return userProductMapping.team;
    }
    
    // Try other partial matches...
  }
  
  return userTeamMapping.team;
}
```

## Visualizing Mappings

The Mapping Results tab in the Hierarchy Mapping Editor has been enhanced to show the component information for each item and to use the new mapping logic to determine the expected area path.

This allows users to see if the system is generating the correct area path for each item based on the configured mappings.

## Next Steps

Future enhancements to the component-product mapping functionality could include:

1. Automatic mapping suggestions based on naming patterns
2. Bulk import/export of mappings
3. Visualization of the component hierarchy
4. Integration with the ProductBoard API to fetch component updates in real-time
