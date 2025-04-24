# System Configuration Guide

This document provides information about the system configuration feature that stores application-wide settings in the database.

## Overview

The System Configuration feature allows storing configuration values such as API tokens, environment settings, and other application-wide parameters securely in the database. This approach centralizes configuration management and avoids storing sensitive information in environment variables or code files.

## Purpose

The main benefits of using the system configuration database include:

- **Centralized Configuration:** All application settings in one place
- **Runtime Updates:** Change settings without requiring a code deployment or restart
- **Security:** Store sensitive information like API keys safely in the database
- **User Interface:** Manage configuration through the admin UI rather than text files
- **Audit Trail:** Track when configuration values were created or modified

## Database Structure

The system configuration is stored in a `system_config` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| key | text | Unique identifier for the config item |
| value | text | The configuration value |
| description | text | Human-readable explanation of the config item |
| created_at | timestamp | When the config was created |
| updated_at | timestamp | When the config was last updated |

## Accessing Configuration Values

To access configuration values in your code, use the `getSystemConfig` function:

```typescript
// Example pseudo-code
import { getSystemConfig } from '../lib/api/systemConfig';

// Get a configuration value
const apiKey = await getSystemConfig('productboard_api_token');
```

## Managing Configuration

### Using the Admin UI

Configuration can be managed through the admin UI:

1. Navigate to Admin → System Config
2. View existing configuration entries
3. Edit values as needed
4. Add new configuration entries when required

### Using the Seed Script

For initial setup or CI/CD pipelines, you can use the included seed script:

1. Ensure your `.env` file contains the necessary environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PRODUCTBOARD_API_TOKEN=your_productboard_token
   VITE_AZURE_DEVOPS_TOKEN=your_ado_token
   VITE_AZURE_DEVOPS_ORG=your_ado_org
   VITE_AZURE_DEVOPS_PROJECT=your_ado_project
   ```

2. Run the seed script:
   ```bash
   node src/seed-config.cjs
   ```

3. The script will add or update the following configuration entries:
   - `productboard_api_token`
   - `azure_devops_token`
   - `azure_devops_organization`
   - `azure_devops_project`

### Security Considerations

- Configuration values are protected by Row Level Security (RLS)
- Only authenticated users can read configuration
- Only admin users can modify configuration
- Sensitive values like API tokens are displayed as password fields with a show/hide toggle

## Common Configuration Keys

The following configuration keys are used in the application:

| Key | Description |
|-----|-------------|
| productboard_api_token | API token for ProductBoard integration |
| azure_devops_token | Personal access token for Azure DevOps |
| azure_devops_organization | Organization name in Azure DevOps |
| azure_devops_project | Project name in Azure DevOps |

## Integrations Using System Configuration

The following features use the system configuration system:

1. **ProductBoard Integration**
   - Uses `productboard_api_token` for authentication
   - If token is missing, will fall back to environment variables

2. **Azure DevOps Integration**
   - Uses `azure_devops_token` for authentication
   - Uses `azure_devops_organization` and `azure_devops_project` for API calls

## Adding New Configuration

When adding new functionality that requires configuration:

1. Create a migration that adds the new configuration entry
2. Set a default value if appropriate
3. Update relevant documentation
4. Add appropriate validation for the new configuration value
5. Update the seed script to include the new configuration

## Troubleshooting

If you encounter issues with configuration:

1. Check that the `system_config` table exists and contains the expected entries
2. Verify that the user has appropriate permissions
3. Check for console errors when accessing configuration values
4. Try manually setting the value through the Admin UI
5. Run the seed script to ensure basic configuration is in place
6. Check the browser console for any errors related to configuration access
