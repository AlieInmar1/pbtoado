# ProductBoard to Azure DevOps Integration for Healthcare POC 1

This document details the integration between ProductBoard and Azure DevOps specifically targeting the "Healthcare POC 1" project.

## Overview

The integration system automatically creates or updates Azure DevOps work items when a ProductBoard story status changes to "With Engineering". The system is configured to target the "Healthcare POC 1" project in Azure DevOps.

## Key Components

1. **Test Scripts**
   - `scripts/test-ado-push.sh` - Bash/curl script for direct ADO API testing
   - `scripts/test-ado-push.js` - Node.js script for direct ADO API testing
   - `scripts/test-pb-webhook.js` - Simulates a ProductBoard webhook event

2. **Webhook Handler**
   - `supabase/functions/pb-ado-sync/index.ts` - Supabase Edge Function that processes ProductBoard webhook events

## Project Targeting

All components are configured to use "Healthcare POC 1" as the target project:

1. **In the Bash script**:
   ```bash
   # Project name - using Healthcare POC 1 for test
   PROJECT_NAME="Healthcare POC 1"
   
   # Format ADO API URL with specific project
   ADO_API_URL="https://dev.azure.com/$ADO_ORG/$PROJECT_NAME/_apis/wit/workitems/\$${WORK_ITEM_TYPE}?api-version=6.0"
   
   # Area path uses the specific project
   "value": "'"$PROJECT_NAME"'\\Frontend"
   ```

2. **In the Node.js script**:
   ```javascript
   // Use Healthcare POC 1 as project name for testing
   const projectName = "Healthcare POC 1";
   
   // Format ADO API URL with specific project
   const adoApiUrl = `https://dev.azure.com/${encodeURIComponent(adoOrg)}/${encodeURIComponent(projectName)}/_apis/wit/workitems/$${encodeURIComponent(workItemType)}?api-version=6.0`;
   
   // Area path uses the specific project
   { "op": "add", "path": "/fields/System.AreaPath", "value": `${projectName}\\${simulatedPbItem.component.name}` }
   ```

3. **In the webhook test script**:
   ```javascript
   // Project name hardcoded for testing
   const projectName = "Healthcare POC 1";
   
   // Component includes project reference
   component: {
     id: 'comp-123',
     name: 'Frontend',
     project: projectName
   }
   ```

4. **In the webhook handler (Supabase Edge Function)**:
   ```typescript
   // Use Healthcare POC 1 as the default project
   const defaultProject = 'Healthcare POC 1';
   
   // Get component's project or use default
   const componentProject = pbItemData?.data?.component?.project || defaultProject;
   
   // Get component name from the data
   const componentName = pbItemData?.data?.component?.name || 'Frontend';
   
   // Construct area path with project and component
   const targetAreaPath = `${componentProject}\\${componentName}`;
   ```

## Area Path Construction

The integration constructs Azure DevOps area paths in the format: `Healthcare POC 1\ComponentName`

For example:
- If a ProductBoard story belongs to the "Frontend" component, the area path will be "Healthcare POC 1\Frontend"
- If a ProductBoard story belongs to the "API" component, the area path will be "Healthcare POC 1\API"

## Field Mappings

The following fields are mapped from ProductBoard to Azure DevOps:

| ProductBoard Field | Azure DevOps Field |
|-------------------|-------------------|
| Name | System.Title |
| Description | System.Description (enriched with HTML) |
| Component | System.AreaPath (Healthcare POC 1\ComponentName) |
| Notes.acceptance_criteria | Microsoft.VSTS.Common.AcceptanceCriteria |
| Custom fields.effort | Microsoft.VSTS.Scheduling.StoryPoints |
| Custom fields.timeframe | Microsoft.VSTS.Scheduling.TargetDate |
| ID, Component ID, Product ID | System.Tags (as metadata) |
| Custom fields.growth_driver | Tag: GrowthDriver |
| Custom fields.tentpole | Tag: Tentpole |
| Custom fields.investment_category | Tag: Investment:Value |

## Testing the Integration

You can test the integration using any of these methods:

1. **Using the Bash script**:
   ```bash
   ./scripts/test-ado-push.sh
   ```

2. **Using Node.js**:
   ```bash
   node scripts/test-ado-push.js
   ```

3. **Simulating a webhook event**:
   ```bash
   node scripts/test-pb-webhook.js
   ```

## Notes

- All test scripts have been made executable with `chmod +x`
- The TypeScript errors shown in the Supabase Edge Function (`pb-ado-sync/index.ts`) are expected and can be safely ignored as they are related to Deno-specific imports, which will work correctly in the Supabase Functions environment
- If a ProductBoard component doesn't specify a project, "Healthcare POC 1" will be used as the default project

## Workflow

1. A ProductBoard item's status gets changed to "With Engineering"
2. This triggers a webhook event to the Supabase Edge Function
3. The function verifies if this is a status change to "With Engineering"
4. If verified, it creates a new work item in the "Healthcare POC 1" project in Azure DevOps
5. The function updates the mapping record with the ADO work item ID
6. A separate function adds the ADO link back to the ProductBoard item

This implementation ensures that stories from ProductBoard are properly synchronized to the "Healthcare POC 1" project in Azure DevOps when they reach the appropriate status.
