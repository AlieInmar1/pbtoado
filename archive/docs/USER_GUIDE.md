# User Guide

This guide explains how to use the key features of the ProductBoard-ADO integration application.

## Getting Started

1. **Login**: Access the application through your organization's login page
2. **Dashboard**: After login, you'll see the main dashboard with overview metrics
3. **Navigation**: Use the top navigation bar to access key sections:
   - Dashboard
   - Admin
   - Grooming

## Setting Up ProductBoard Integration

### Step 1: Configure API Access

1. Navigate to **Admin > ProductBoard**
2. In the main ProductBoard panel, provide your ProductBoard API key
3. Click **Test Connection** to verify API access

### Step 2: Capture User Tokens

1. Go to **Admin > ProductBoard > Ranking Settings**
2. Under "User-Level Token Management", click "Capture New User Token"
3. Enter your ProductBoard credentials in the modal that appears
4. The system will securely extract and store your authentication tokens

![Token Capture Process](../assets/token-capture.png)

### Step 3: Set Up Board Tracking

1. Still in the Ranking Settings page, find the "ProductBoard Tracking" section
2. Click "Add Board" to specify ProductBoard boards to track
3. Enter the board URL and name
4. Configure synchronization settings

## Working with ProductBoard Data

### Viewing Product Hierarchy

1. Navigate to **Admin > ProductBoard > Hierarchy**
2. Select a product from the dropdown menu
3. Browse the hierarchical structure:
   - Products
   - Components
   - Features
   - Subfeatures
4. Click on any item to view details in the right panel

### Exploring Features

1. Navigate to **Admin > ProductBoard > Features**
2. Use the view toggle to switch between card and list views
3. Use filters and search to find specific features
4. Click on a feature to open its detailed view
5. View relationships between features in the hierarchy view

### Managing Rankings

1. Navigate to **Admin > ProductBoard > Rankings**
2. View prioritized features from ProductBoard
3. Click "Preview Import" to see what will be synchronized
4. Review changes and click "Sync to ADO" to update Azure DevOps

## Azure DevOps Integration

### Setting Up ADO Connection

1. Navigate to **Admin > Entity Mappings**
2. Configure the mapping between ProductBoard items and ADO work items
3. Specify which fields should be synchronized
4. Set up automatic sync or use manual sync options

### Synchronizing Rankings to ADO

1. Navigate to **Admin > ProductBoard > Rankings**
2. Review the rankings from ProductBoard
3. Click "Sync to ADO" to update work item priorities
4. View the sync history to track changes over time

### Viewing Synchronized Data

1. Navigate to the Dashboard to see an overview of synchronized items
2. Check the "Last Sync" information to ensure data is current
3. Use filters to view only items that have changed since last sync

## Grooming Sessions

### Creating a Grooming Session

1. Navigate to **Grooming**
2. Click "New Session" to create a new grooming session
3. Select the ProductBoard features to include
4. Invite team members to participate

### Running a Grooming Session

1. Open a grooming session from the Grooming page
2. View prioritized features based on ProductBoard rankings
3. Add/remove features as needed
4. Record estimates and decisions
5. Finalize the session to update ADO work items

### Reviewing Session Results

1. Navigate to **Grooming**
2. Select a past session from the list
3. View the decisions and estimates made
4. See which features were moved to the backlog

## Managing Tokens

### Viewing Token Status

1. Navigate to **Admin > ProductBoard > Ranking Settings**
2. The "User-Level Token Management" section displays all tokens
3. Check token status (valid, expiring soon, invalid)
4. See expiration dates and last used timestamps

### Refreshing Tokens

1. Find the token you want to refresh in the User-Level Token Management section
2. Click the "Refresh" button next to the token
3. A new browser tab will open to refresh your authentication
4. Once completed, return to the app to see the updated token status

### Revoking Tokens

1. Find the token you want to revoke
2. Click the "Revoke" button next to the token
3. Confirm the revocation
4. The token will be marked as invalid and no longer used

## Troubleshooting

### Connection Issues

If you encounter connection issues with ProductBoard:

1. Check your API key is correct and still valid
2. Verify your user tokens are valid and not expired
3. Test the connection using the "Test Connection" button
4. Check your network connectivity to ProductBoard

### Synchronization Problems

If data isn't synchronizing correctly:

1. Check the "Last Sync" information to see if a sync was attempted
2. Verify that you have valid tokens for the boards you're trying to sync
3. Check mapping configurations between ProductBoard and ADO
4. Try a manual sync to see if it resolves the issue

### Invalid or Expired Tokens

If you see "Invalid Token" or "Token Expired" messages:

1. Go to the Ranking Settings page
2. Find the invalid token in the User-Level Token Management section
3. Click "Refresh" to obtain a new token
4. If refreshing doesn't work, try capturing a new token

## Best Practices

1. **Regular Token Refresh**: Refresh your tokens before they expire to ensure uninterrupted access
2. **Dedicated Service Account**: Use a dedicated ProductBoard account for token capture in production
3. **Mapping Verification**: Regularly verify that your entity mappings are correct
4. **Sync Frequency**: Set up a regular sync schedule that balances data freshness with system load
5. **Selective Synchronization**: Only track the ProductBoard boards that you actively use with ADO

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search | Ctrl+/ |
| Refresh Data | F5 |
| Toggle View | Ctrl+V |
| Quick Filter | Ctrl+F |
| Show Help | ? |

This user guide covers the core functionality of the ProductBoard-ADO integration. For technical details, please refer to the Technical Documentation.
