# ProductBoard to Azure DevOps Integration Dry Run Mode

This document explains the "dry run" mode for the ProductBoard to Azure DevOps integration, which allows you to test and validate the integration without actually creating or updating work items in Azure DevOps.

## Overview

The ProductBoard to Azure DevOps integration listens for events from ProductBoard (specifically when a story's status changes to "With Engineering") and automatically creates or updates corresponding work items in Azure DevOps.

To facilitate testing and validation without affecting your ADO environment, we've added a "dry run" mode that:

1. Performs all the normal data extraction and payload preparation steps
2. Logs what would have been sent to ADO
3. Stores the payload in the database for later review
4. Skips the actual API call to ADO

## How to Enable/Disable Dry Run Mode

The dry run mode is controlled by an environment variable:

```
ADO_SYNC_ENABLED=false
```

- When set to `false`, the integration will operate in dry run mode (no actual ADO API calls)
- When set to `true`, the integration will make actual API calls to create/update work items in ADO

You can set this environment variable in your Supabase Edge Function configuration.

## Database Changes

To support the dry run mode, we've added an `ado_payload` column to the `pb_ado_automation_logs` table. This column stores the JSON payload that would have been sent to ADO during a dry run.

We've also added a new status value `dry_run` to indicate logs that represent dry run operations.

## Checking Dry Run Results

You can query the database to see the payloads that would have been sent to ADO:

```sql
SELECT 
  id, 
  pb_item_id, 
  pb_item_type, 
  status, 
  details, 
  created_at, 
  ado_payload
FROM 
  pb_ado_automation_logs
WHERE 
  status = 'dry_run'
ORDER BY 
  created_at DESC;
```

## Field Mapping

When a ProductBoard story is processed, the following fields are extracted and mapped to ADO fields:

### Basic Fields
- ProductBoard Name → ADO Title
- ProductBoard Description → ADO Description
- ProductBoard Customer Need → ADO Description (appended)
- ProductBoard Acceptance Criteria → ADO Acceptance Criteria

### Custom Fields
- ProductBoard Story Points → ADO Story Points
- ProductBoard Target Date → ADO Target Date
- ProductBoard Investment Category → ADO Custom.InvestmentCategory
- ProductBoard Growth Driver flag → ADO Custom.GrowthDriver
- ProductBoard Tentpole flag → ADO Custom.Tentpole
- ProductBoard ID → ADO Tags (as "ProductBoard:{id}")

## Workflow

1. A story in ProductBoard changes to "With Engineering" status
2. The webhook triggers our `pb-ado-sync` function
3. The function extracts all relevant data from the ProductBoard item
4. The function constructs the ADO payload with proper field mapping
5. If `ADO_SYNC_ENABLED=false`:
   - The payload is logged in the database with status "dry_run"
   - No API call is made to ADO
6. If `ADO_SYNC_ENABLED=true`:
   - The API call is made to ADO to create/update the work item
   - The mapping is stored in the database
   - A link is added to the ProductBoard item pointing to the ADO work item

## Best Practices

1. Start with `ADO_SYNC_ENABLED=false` to test and validate field mappings
2. Review the payloads in the `pb_ado_automation_logs` table
3. Adjust field mappings as needed
4. When ready to go live, set `ADO_SYNC_ENABLED=true`
5. You can always revert to dry run mode if needed

## Troubleshooting

If you encounter issues with the field mapping or payload construction:

1. Check the logs in Supabase for detailed errors
2. Query the `pb_ado_automation_logs` table for the specific log entry
3. Review the `ado_payload` column to see what would have been sent
4. Adjust field mappings in the `pb-ado-sync` function as needed
