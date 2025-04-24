# ProductBoard to Azure DevOps Integration Summary

This document provides an overview of the implemented ProductBoard to Azure DevOps integration.

## Integration Flow

1. **Event Trigger**: ProductBoard webhook sends an event when a story status changes to "With Engineering"
2. **Supabase Function**: The pb-ado-sync Edge Function processes this event
3. **Field Mapping**: ProductBoard fields are mapped to Azure DevOps fields
4. **ADO Work Item Creation**: A new work item is created in Azure DevOps with proper field values
5. **Link Storage**: The mapping between ProductBoard ID and ADO ID is stored for future reference

## Components Implemented

### 1. Webhook Handler
Enhanced the `supabase/functions/pb-ado-sync/index.ts` handler with:
- Improved field mappings
- Rich HTML formatting for descriptions 
- Comprehensive tag handling for ProductBoard metadata
- Business value prioritization

### 2. Hierarchy Mapping Utils
Created `hierarchyMappingUtils.ts` to:
- Determine appropriate area path based on ProductBoard component/product
- Map ProductBoard item levels to correct ADO work item types

### 3. Testing Infrastructure
- Node.js script for testing ADO API directly (`scripts/test-ado-push.js`)
- Bash script for testing via curl (`scripts/test-ado-push.sh`)
- Webhook simulation script (`scripts/test-pb-webhook.js`)
- Helper script for installing dependencies (`scripts/install-integration-deps.sh`)

### 4. Documentation
- Integration testing guide (`docs/ADO_INTEGRATION_TESTING.md`)
- This summary document

## Field Mappings

| ProductBoard Field | Azure DevOps Field | Notes |
|-------------------|-------------------|-------|
| Name | System.Title | |
| Description | System.Description | Enhanced with HTML formatting |
| Status | System.State | "With Engineering" → "New" |
| Notes.acceptance_criteria | Microsoft.VSTS.Common.AcceptanceCriteria | |
| Custom Fields.effort | Microsoft.VSTS.Scheduling.StoryPoints | |
| Custom Fields.timeframe | Microsoft.VSTS.Scheduling.TargetDate | |
| Custom Fields.investmentCategory | Custom.InvestmentCategory + Tag | |
| Custom Fields.growthDriver | Custom.GrowthDriver + Tag | |
| Custom Fields.tentpole | Custom.Tentpole + Tag | |
| Component, Product | System.Tags | Added as tags with prefixes |
| ID | System.Tags | ProductBoard ID reference |

## Getting Started

### Prerequisites
- Node.js and npm
- Azure DevOps account with proper permissions
- ProductBoard account with API access
- Supabase project for Edge Functions

### Installation

1. Install dependencies:
   ```bash
   ./scripts/install-integration-deps.sh
   ```

2. Configure your environment variables in `.env`:
   ```
   ADO_ORG=your-organization
   ADO_PROJECT=your-project
   ADO_PAT=your-personal-access-token
   SUPABASE_URL=your-supabase-url
   PB_WEBHOOK_SECRET=your-webhook-secret
   PB_API_TOKEN=your-api-token
   ```

3. Deploy the Edge Function to Supabase:
   ```bash
   # Use your Supabase CLI deployment process
   supabase functions deploy pb-ado-sync
   ```

4. Configure the ProductBoard webhook to point to your Edge Function URL

## Testing

See `docs/ADO_INTEGRATION_TESTING.md` for detailed testing instructions.

## Next Steps

1. **Enhanced Area Path Mapping**: Implement more sophisticated rules for determining area paths
2. **Bidirectional Sync**: Add support for ADO → ProductBoard updates
3. **Status Mapping**: Create configurable mappings between ProductBoard statuses and ADO states
4. **Error Handling**: Improve error handling and retry mechanisms
