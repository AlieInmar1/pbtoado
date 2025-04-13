# ProductBoard Token Authentication System

## Overview

The ProductBoard Token Authentication system enables secure communication with the ProductBoard API without storing user credentials. This document provides a detailed explanation of how the token-based authentication works, its components, and user workflows.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Key Components](#key-components)
3. [Token Capture Process](#token-capture-process)
4. [Token Management](#token-management)
5. [Token Validation & Refresh](#token-validation--refresh)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

## System Architecture

The token authentication system consists of several interlinked components:

1. **Client-Side Components**
   - Token Capture Modal/Page
   - Token Status Indicator
   - User Token Manager
   - Bookmarklet for token extraction

2. **Server-Side Components**
   - Token validation service
   - Scheduled token refresh
   - Token storage in Supabase
   - Apify token extraction actor

3. **External Services**
   - Apify platform
   - ProductBoard session authentication

This architecture ensures that the application can securely authenticate with ProductBoard while maintaining a seamless user experience.

## Key Components

### Token Capture Modal (`TokenCaptureModal.tsx`)

A modal dialog that guides users through the token capture process, providing instructions and feedback.

### Token Status Badge (`TokenStatusBadge.tsx`)

Visual indicator of token validity status, showing:
- Valid (green)
- Expiring Soon (amber)
- Invalid (red)
- Unknown (gray)

### User Token Manager (`UserTokenManager.tsx`)

Interface for managing tokens at the user level, including:
- Viewing token status
- Initiating token capture
- Refreshing tokens
- Configuring token preferences

### Bookmarklet (`bookmarklet.ts`)

JavaScript bookmarklet that extracts session tokens from ProductBoard. Can be:
- Dragged to bookmark bar
- Executed directly in ProductBoard
- Used with special capture page

### Token Capture Page (`TokenCapturePage.tsx`)

Standalone page designed for capturing ProductBoard tokens, particularly useful for:
- Initial setup
- Users unfamiliar with bookmarklets
- Controlled environments

### Apify Token Extractor

Server-side actor hosted on Apify that helps extract ProductBoard authentication tokens securely.

## Token Capture Process

The token capture workflow consists of several steps:

1. **Initiation**
   - User clicks "Capture Token" in Token Manager
   - User is presented with the Token Capture Modal
   - Instructions explain the process and options

2. **Method Selection**
   - **Bookmarklet Method**: 
     - User drags bookmarklet to bookmark bar
     - User navigates to ProductBoard
     - User clicks the bookmarklet while in ProductBoard
     - Token is automatically extracted
   
   - **Capture Page Method**:
     - User is directed to standalone token capture page
     - User logs into ProductBoard within the frame
     - System automatically extracts token

3. **Token Processing**
   - Extracted token is validated for format and basic content
   - Token is securely transmitted to the server
   - Token is encrypted and stored in the database
   - Association with user account and workspace

4. **Confirmation**
   - User receives confirmation of successful capture
   - Token status is updated in the UI
   - User can now perform ProductBoard API operations

## Token Management

### Storage Strategy

Tokens are stored with several security measures:

- Encrypted at rest in Supabase database
- Associated with specific users
- Scope-limited by workspace
- Expiration metadata tracked

### Workspace Association

Tokens can be:
- **User-specific**: Only available to the capturing user
- **Workspace-shared**: Available to all users in a workspace
- **Global**: Available system-wide (admin only)

### Token Metadata

Each token stores metadata including:
- Capture timestamp
- Expiration (estimated)
- Last validation date
- Associated user
- Workspace scope
- Usage statistics

## Token Validation & Refresh

### Validation Process

Tokens are validated:
- On initial capture
- Periodically via scheduled job
- Before critical API operations
- When explicitly requested by user

Validation involves:
- Testing with a lightweight ProductBoard API call
- Checking response headers for expiration signals
- Updating token status in the database

### Refresh Workflow

When a token requires refreshing:

1. User is notified via UI indicators (status badge)
2. User can trigger manual refresh via Token Manager
3. User follows token capture process again
4. New token replaces the old one
5. Associated settings are preserved

### Scheduled Validation

The `scheduled-token-refresh` Supabase function:
- Runs on a configurable schedule (default: daily)
- Checks all stored tokens for validity
- Updates status in database
- Notifies users about expiring tokens

## Security Considerations

### Token Protection

The system employs multiple security measures:

- Tokens are encrypted in the database
- Transmitted securely over HTTPS
- Never stored in client-side storage (localStorage, etc.)
- Never logged or exposed in plaintext
- Access controlled via Supabase RLS policies

### User Privacy

The token system respects user privacy:

- User credentials are never stored
- ProductBoard login happens directly with ProductBoard
- The application only stores the resulting session token
- Users can revoke access at any time

### Token Rotation

For enhanced security:

- Tokens have a natural expiration (~2 weeks)
- System encourages regular token rotation
- Notifications prompt users to refresh expiring tokens
- Historical tokens can be purged

## Troubleshooting

### Common Issues

1. **Token Capture Fails**
   - Ensure you're logged into ProductBoard
   - Try using the standalone capture page
   - Check for browser extensions blocking scripts
   - Verify you have proper permissions in ProductBoard

2. **Token Expires Quickly**
   - May indicate ProductBoard session issues
   - Try logging out and back into ProductBoard
   - Check if your ProductBoard admin has session limits

3. **API Calls Fail Despite Valid Token**
   - Verify permissions in ProductBoard
   - Check for API rate limiting
   - Ensure token has access to required scopes

### Diagnostics

For troubleshooting token issues:

1. Check token status in Token Manager
2. Use the "Check Token Validity" function
3. Review token capture logs in the database
4. Contact support if persistent issues occur
