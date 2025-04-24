# ProductBoard to Azure DevOps Webhook Integration

This document describes the ProductBoard to Azure DevOps (ADO) webhook integration system, which automatically creates or updates ADO work items when ProductBoard features change status to "With Engineering".

## Overview

When a ProductBoard feature is marked as "With Engineering", the system:

1. Creates a new ADO work item or updates an existing one
2. Adds a link back to the ADO work item in ProductBoard's integrations section
3. Maintains a record of all mappings between ProductBoard features and ADO work items

## Architecture

The integration consists of two Supabase Edge Functions and database tables:

1. **pb-ado-sync**: Receives webhook events from ProductBoard, processes them, and creates/updates ADO work items
2. **pb-link-updater**: Updates ProductBoard with links to the created ADO work items
3. **Database tables**: Store mappings and automation logs

![Architecture Diagram](https://www.plantuml.com/plantuml/png/bLJBRjim4BphAnRk8I3FrWQHG6an9n2I95jwmDu1LIc2JOe5e46QxUvPXD0TsVQa-Cy_RnoPQDufG15G14RRk_B0iZgnDJO0IYnG2oQEoFbW1LdMO-ZWXKH0I1C0UJOzTEb1g1a69XGN5rfjAp5I3ujRjbftMYo4DcZUiPDUAG9tC71-6QaFEA2KqnveDiWF0gDX-fG7MVQL0yBn1iK8-SKHvqhshFdLizRgU5BzP_DRXv0m_3BUy01k73uBOOxw0W00)

## Workflow

1. A feature in ProductBoard is moved to "With Engineering" status.
2. ProductBoard triggers a webhook to the `pb-ado-sync` function.
3. The function validates the webhook signature and extracts event data.
4. The function fetches details about the ProductBoard feature.
5. If the feature's status has changed to "With Engineering", the function:
   - Checks if an ADO work item already exists for this feature
   - Creates a new ADO work item or updates the existing one
   - Stores/updates the mapping in the database
6. The system then establishes a link between ProductBoard and ADO using one of two methods:
   - API Method: The `pb-link-updater` function adds an integration link in ProductBoard pointing back to the ADO work item.
   - UI Automation Method: The `link-pb-to-ado-manual.js` script uses browser automation with Puppeteer to create the link through ProductBoard's UI.
8. All actions are logged in the database for auditing and troubleshooting.

## Prerequisites

- Supabase Project
- ProductBoard account with API access
- Azure DevOps account with API access
- Admin access to both systems to configure the integration

## Database Setup

The integration relies on two database tables:

### pb_ado_mappings

Stores the mapping between ProductBoard features and ADO work items.

```sql
create table pb_ado_mappings (
  id uuid primary key default uuid_generate_v4(),
  productboard_id text not null unique,
  ado_work_item_id integer not null,
  ado_work_item_url text,
  last_known_pb_status text,
  last_synced_at timestamp with time zone default now(),
  sync_status text,
  sync_error text,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index idx_pb_ado_mappings_productboard_id on pb_ado_mappings(productboard_id);
create index idx_pb_ado_mappings_ado_work_item_id on pb_ado_mappings(ado_work_item_id);
```

### pb_ado_automation_logs

Tracks all webhook events and integration actions.

```sql
create table pb_ado_automation_logs (
  id uuid primary key default uuid_generate_v4(),
  event_type text,
  pb_item_id text,
  pb_item_type text,
  status text,
  details text,
  payload jsonb,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index idx_pb_ado_automation_logs_pb_item_id on pb_ado_automation_logs(pb_item_id);
create index idx_pb_ado_automation_logs_status on pb_ado_automation_logs(status);
create index idx_pb_ado_automation_logs_created_at on pb_ado_automation_logs(created_at);
```

## Deployment

1. Set up the Supabase database tables (see SQL above)
2. Deploy the Edge Functions:

```bash
# Make the deployment script executable
chmod +x scripts/deploy-pb-ado-functions.sh

# Run the deployment script
./scripts/deploy-pb-ado-functions.sh
```

## Configuration

### Environment Variables

Configure the following environment variables in the Supabase dashboard for the Edge Functions:

| Variable | Description | Required |
|----------|-------------|----------|
| SUPABASE_URL | Your Supabase project URL | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Service role key for the Supabase project | Yes |
| PB_API_TOKEN | ProductBoard API token | Yes |
| PB_WEBHOOK_SECRET | Secret for validating webhook calls | Yes |
| PB_SESSION_TOKEN | ProductBoard session token for UI automation | No |
| ADO_ORG | Azure DevOps organization name | Yes |
| ADO_PROJECT | Azure DevOps project name | Yes |
| ADO_PAT | Azure DevOps Personal Access Token | Yes |

### ProductBoard Webhook Configuration

1. Go to ProductBoard Settings > Integrations > Webhooks
2. Click "Add webhook"
3. Set the following details:
   - Name: "ADO Sync"
   - URL: `https://[your-project-ref].supabase.co/functions/v1/pb-ado-sync`
   - Secret: Choose a secure secret and save it in the `PB_WEBHOOK_SECRET` environment variable
   - Events: Select "feature.status.updated"
4. Save the webhook configuration

### Azure DevOps Configuration

1. Ensure your ADO PAT has permissions for:
   - Work Items: Read, Write, & Manage
   - Area Path: Read & Manage

## Testing the Integration

1. Create a test feature in ProductBoard
2. Move it to the "With Engineering" status
3. Check the `pb_ado_automation_logs` table for log entries
4. Verify in Azure DevOps that a work item was created
5. Verify in ProductBoard that an integration link was added

## Component Details

### pb-ado-sync

This function:
- Receives and validates webhook events from ProductBoard
- Processes various event types, focusing on status changes
- Fetches feature details from ProductBoard API
- Creates or updates work items in Azure DevOps API
- Maintains mappings and logging in the database
- Triggers the appropriate method to establish a link between PB and ADO

### pb-link-updater

This function:
- Receives mapping details (PB ID + ADO ID/URL)
- Checks for existing integration links in ProductBoard using the API
- Creates or updates integration links
- Updates logs in the database

### link-pb-to-ado-manual.js

This script:
- Uses Puppeteer for browser automation
- Navigates to a ProductBoard feature page using the URL
- Authenticates using the PB session token
- Interacts with the ProductBoard UI to:
  * Find and click the "Integrations" section
  * Click on "ADO Integration"
  * Select the "Link to existing issue" tab
  * Select the appropriate ADO project
  * Enter the ADO work item ID
  * Click the "Link" button to create the integration
- Provides detailed logging and error handling
- Takes screenshots in case of errors to aid debugging

## Troubleshooting

### Common Issues

1. **Webhook not being triggered**
   - Check if the ProductBoard webhook is properly configured
   - Verify the webhook URL is correct
   - Check ProductBoard webhook logs for errors

2. **Authentication errors**
   - Ensure all API tokens and credentials are valid
   - Check environment variables are set correctly

3. **Data mapping issues**
   - Check the database for mapping errors
   - Review the logs for specific error messages

### Viewing Logs

Check the `pb_ado_automation_logs` table to view all events and actions. Common status values:

- `received`: Webhook received
- `fetched`: ProductBoard feature data fetched
- `skipped_status_check`: Feature status didn't match trigger conditions
- `processing_required`: Feature status changed to "With Engineering"
- `ado_created`: ADO work item created successfully
- `ado_updated`: ADO work item updated successfully
- `ado_error`: Error creating/updating ADO work item
- `link_updated`: ProductBoard integration link added/updated
- `link_error`: Error updating ProductBoard integration link

## Extended Capabilities

The current implementation is focused on status changes to "With Engineering", but the system can be extended to:

- Handle other status changes
- Add custom fields mapping between the systems
- Support different work item types (not just User Stories)
- Support bi-directional updates
- Add UI components for managing the integration

## Security Considerations

- The webhook uses a shared secret for validation
- API tokens are stored securely as environment variables
- Edge functions run in isolated environments
- Database access is controlled through Supabase RLS policies
