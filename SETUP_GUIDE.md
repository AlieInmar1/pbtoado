# Setup Guide

This guide will help you set up and run the ProductBoard to Azure DevOps integration application.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- A ProductBoard account with API access
- An Azure DevOps organization with project
- Supabase account for database storage

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [repository-directory]
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
- Add your Supabase URL and anon key
- Add your ProductBoard API key
- Add your Azure DevOps organization, project, and API key

## Database Setup

The application uses Supabase as its database. You'll need to run the migrations to set up the required tables.

1. Ensure you have access to your Supabase project
2. Run the database migrations:
```bash
npm run migrations
```

## Configuration

### ProductBoard Configuration

1. Obtain a ProductBoard API key from your ProductBoard admin portal:
   - Navigate to Settings > Integrations > API
   - Generate a new API key with appropriate permissions

2. Get your default board ID:
   - Open your ProductBoard workspace
   - Navigate to a board you want to use
   - The board ID is in the URL: `https://app.productboard.com/boards/[board-id]/`

### Azure DevOps Configuration

1. Create a Personal Access Token (PAT) in Azure DevOps:
   - Navigate to your Azure DevOps organization
   - Go to User Settings > Personal Access Tokens
   - Create a new token with "Work Items (Read & Write)" permissions

2. Note your organization name and project name:
   - These are typically in your Azure DevOps URL:
   - `https://dev.azure.com/[organization]/[project]/`

## Running the Application

### Development mode

To run the application in development mode:

```bash
npm run dev
```

This will start the development server, typically at `http://localhost:5173/`.

### Production build

To create a production build:

```bash
npm run build
```

The built application will be in the `dist` directory and can be deployed to any static hosting service.

## Features

### ProductBoard Token Management

If you've enabled token management (`VITE_ENABLE_TOKEN_MANAGEMENT=true`), you'll need to:

1. Navigate to the Token Management page
2. Follow the instructions to capture a ProductBoard session token
3. This allows more detailed hierarchy and ranking information to be extracted

### Synchronization

By default, the application will sync data based on the interval specified in `VITE_SYNC_INTERVAL_MINUTES`. You can also:

1. Manually trigger a sync from the ProductBoard Features page
2. View sync history in the Sync History page
3. Check for any errors in the synchronization process

## Troubleshooting

### Connection Issues

- Check that your API keys are correct in the `.env` file
- Ensure your ProductBoard and Azure DevOps accounts have the necessary permissions
- Verify that your Supabase connection is working

### Sync Problems

- Look at the Sync History page for detailed error information
- Check the browser console for any JavaScript errors
- Verify that your ProductBoard token is still valid (if using token management)

## Support

If you encounter any issues or need assistance, please:

1. Refer to the core documentation in the `docs` directory
2. Check the `CORE_COMPONENTS.md` file for information about the system architecture
3. Contact the development team for further support
