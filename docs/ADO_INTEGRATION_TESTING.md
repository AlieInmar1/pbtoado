# Azure DevOps Integration Testing Guide

This document provides instructions for testing the ProductBoard to Azure DevOps integration using the provided test scripts.

## Overview

We've implemented several test scripts to verify the integration between ProductBoard and Azure DevOps:

1. **Direct ADO API Testing** - Tests pushing directly to ADO API
2. **Webhook Simulation Testing** - Tests sending a simulated ProductBoard webhook event

## Prerequisites

Before running the tests, ensure you have the following environment variables set in your `.env` file:

```bash
# Azure DevOps credentials
ADO_ORG=your-ado-org
ADO_PROJECT=your-ado-project
ADO_PAT=your-ado-personal-access-token

# Supabase/ProductBoard credentials
SUPABASE_URL=your-supabase-url
PB_WEBHOOK_SECRET=your-productboard-webhook-secret
PB_API_TOKEN=your-productboard-api-token
```

## Test Scripts

### 1. Direct ADO API Testing

#### Node.js Script

This script creates a work item directly in Azure DevOps using the node-fetch library:

```bash
# Install dependencies
npm install --save node-fetch dotenv

# Run the script
node scripts/test-ado-push.js
```

#### Bash/Curl Script

This script uses curl to create a work item in Azure DevOps:

```bash
# Make the script executable
chmod +x scripts/test-ado-push.sh

# Run the script
./scripts/test-ado-push.sh
```

### 2. Webhook Simulation Testing

This script simulates a ProductBoard webhook event to test the entire integration flow:

```bash
# Install dependencies
npm install --save node-fetch dotenv

# Run the script
node scripts/test-pb-webhook.js
```

## Field Mappings

The integration maps the following fields from ProductBoard to Azure DevOps:

| ProductBoard Field | Azure DevOps Field | Notes |
|-------------------|-------------------|-------|
| Name | System.Title | |
| Description | System.Description | Also includes customer need and technical notes |
| Status | System.State | "With Engineering" maps to "New" in ADO |
| Notes.acceptance_criteria | Microsoft.VSTS.Common.AcceptanceCriteria | |
| Custom Fields.effort | Microsoft.VSTS.Scheduling.StoryPoints | |
| Custom Fields.timeframe | Microsoft.VSTS.Scheduling.TargetDate | |
| Custom Fields.investmentCategory | Custom.InvestmentCategory + Tag | |
| Custom Fields.growthDriver | Custom.GrowthDriver + Tag | |
| Custom Fields.tentpole | Custom.Tentpole + Tag | |
| Component, Product | System.Tags | Added as tags with prefixes |
| ID | System.Tags | Added as tag with "ProductBoard:" prefix |

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify your ADO_PAT is valid and has the appropriate permissions
   - Check SUPABASE_URL and PB_WEBHOOK_SECRET for webhook testing

2. **Field Mapping Errors**:
   - Some ADO fields may be customized or missing in your organization
   - Check ADO project settings to verify field names

3. **API Rate Limiting**:
   - ADO and ProductBoard both have API rate limits
   - Add delays between tests if you encounter rate limiting

### Checking Results

1. In Azure DevOps:
   - Navigate to your project
   - Check Work Items to see newly created items
   - Verify field mappings are correct

2. In Supabase:
   - Check the `pb_ado_automation_logs` table for logs
   - Check the `pb_ado_mappings` table for created mappings

## Next Steps

After verifying the integration works correctly with these test scripts, you can:

1. Deploy the edge functions to your Supabase project
2. Configure ProductBoard webhook to point to your deployed function
3. Monitor the integration in production

For more details on the implementation, see the following documents:
- `docs/PB_ADO_WEBHOOK_INTEGRATION.md`
- `docs/PRODUCTBOARD_ADO_INTEGRATION_DETAILS.md`
