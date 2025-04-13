# ProductBoard-ADO Integration: Application UI & Functionality Guide

This comprehensive guide documents the user interface and functionality of the ProductBoard-ADO Integration application. It covers the application structure, navigation patterns, UI components, core features, and user workflows.

## Table of Contents

1. [Application Structure & Navigation](#application-structure--navigation)
2. [Complete Sitemap](#complete-sitemap)
3. [Core Features](#core-features)
4. [User Workflows](#user-workflows)
5. [UI Components Reference](#ui-components-reference)

## Application Structure & Navigation

### Layout Overview

The application follows a standard layout structure consisting of:

- **Header**: Contains app branding, workspace selector, and user profile controls
- **Navigation Sidebar**: Provides access to all major sections of the application
- **Main Content Area**: Displays the active page content
- **AI Assistant**: Floating button for accessing help and AI-powered features

### Navigation Patterns

The sidebar navigation is organized into several main sections:

1. **Dashboard** - Application overview and summary
2. **ProductBoard** - ProductBoard integration features
   - Features
   - Hierarchy
   - Rankings
   - Token Management
3. **Azure DevOps** - ADO integration features
   - Entity Mappings
   - Field Mappings
   - Sync History
4. **Grooming Sessions** - Manage and conduct grooming sessions
5. **Story Management** - Oversee user story creation and management
6. **Admin** - Administrative functions
   - Workspaces
   - Story Templates
   - AI Prompts
   - Feature Flags
   - Database Settings

### Workspace Context

The application supports multiple workspaces, allowing users to manage different ProductBoard and ADO connections. The current workspace context affects the data displayed throughout the application. Users can switch between workspaces using the selector in the header.

## Complete Sitemap

### Main Navigation

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | Dashboard | Application overview and key metrics |
| `/admin/productboard/features` | ProductBoardFeatures | Browse and manage ProductBoard features |
| `/admin/productboard/hierarchy` | ProductBoardHierarchy | Visual view of ProductBoard hierarchy structure |
| `/admin/productboard/rankings` | ProductBoardRankings | View and manage feature rankings |
| `/admin/productboard/ranking-settings` | ProductBoardRankingSettings | Configure token-based authentication |
| `/admin/entity-mappings` | EntityMappings | Configure mapping between ProductBoard and ADO entities |
| `/admin/field-mappings` | FieldMappings | Configure field mapping between systems |
| `/sync-history` | SyncHistory | View synchronization history and status |
| `/grooming` | GroomingSessions | Manage grooming sessions |
| `/grooming/session/:sessionId` | SessionDetail | View details of a specific grooming session |
| `/stories` | StoryManagement | Manage user stories across systems |

### Admin Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/workspace/:id` | WorkspaceSettings | Configure workspace settings |
| `/admin/story-templates` | StoryTemplates | Manage story templates |
| `/admin/ai-prompts` | AIPrompts | Configure AI assistant prompts |
| `/admin/feature-flags` | FeatureFlags | Manage feature flags |
| `/admin/database` | DatabaseSettings | Configure database connections |

### Standalone Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/token-capture` | TokenCapturePage | Standalone page for capturing ProductBoard authentication tokens |

## Core Features

### 1. Token-based Authentication with ProductBoard

The application uses a token-based authentication system to securely connect with ProductBoard's API without storing user credentials.

**Key Components:**
- **Token Manager**: Allows users to capture and manage ProductBoard authentication tokens
- **Token Status Indicator**: Shows current token validity and expiration
- **Token Refresh Workflow**: Guides users through the token refresh process

**Implementation:**
- Users can capture tokens via the Token Capture page or through the bookmarklet
- Tokens are securely stored in the database with encryption
- Token validity is continuously monitored with automatic notifications before expiration

### 2. ProductBoard Hierarchy Visualization

Provides a complete visualization of the ProductBoard product hierarchy, allowing users to navigate through products, components, features, and subfeatures.

**Key Components:**
- **Hierarchy Tree View**: Interactive tree visualization of the complete hierarchy
- **Filtering & Search**: Tools to find specific items within the hierarchy
- **Detail Panels**: Context-specific details for selected hierarchy items

**Implementation:**
- Hierarchy data is pulled from ProductBoard API and cached locally
- User can expand/collapse sections to focus on relevant areas
- Visual indicators show synchronization status with ADO items

### 3. Feature Management & Ranking Synchronization

Enables viewing and managing ProductBoard features and synchronizing their prioritization data with Azure DevOps work items.

**Key Components:**
- **Feature Dashboard**: Comprehensive view of features with filtering and sorting
- **Feature Card View**: Visual representation of features with key information
- **Feature Detail Modal**: Detailed view with complete feature information
- **Ranking Configuration**: Controls for synchronizing ranking data between systems

**Implementation:**
- Features are displayed with their current ranking, status, and relationship data
- Rankings can be synchronized manually or on a schedule
- Changes in either system can be detected and reconciled

### 4. Relationship Mapping

Maps and manages relationships between ProductBoard features, initiatives, and objectives, as well as their counterparts in Azure DevOps.

**Key Components:**
- **Entity Mapping**: Configures how entities in one system map to the other
- **Relationship Visualization**: Shows connections between related items
- **Bulk Relationship Management**: Tools for managing relationships at scale

**Implementation:**
- Relationships are stored in a normalized database structure
- Bidirectional synchronization ensures consistency across systems
- Visual indicators show relationship types and synchronization status

### 5. Azure DevOps Integration

Connects with Azure DevOps to synchronize work items, field values, and other project data.

**Key Components:**
- **Field Mappings**: Configuration for how fields map between systems
- **Sync Configuration**: Controls for synchronization frequency and scope
- **Conflict Resolution**: Tools for resolving conflicts between systems

**Implementation:**
- Connects via Azure DevOps API with secure PAT authentication
- Supports custom field mappings for specialized workflows
- Provides detailed logging and history for all synchronization operations

## User Workflows

### Capturing a ProductBoard Token

1. Navigate to the Token Management page via "ProductBoard > Token Management"
2. Click "Capture New Token"
3. Follow on-screen instructions to use the bookmarklet or token capture page
4. Authenticate with ProductBoard when prompted
5. Confirm token capture and assign to workspace
6. Verify token status indicator shows "Valid"

### Exploring ProductBoard Hierarchy

1. Navigate to "ProductBoard > Hierarchy"
2. Use the search bar to find specific products or features (optional)
3. Click on the expand icons to reveal nested hierarchy levels
4. Select any item to view its details in the right panel
5. Toggle between different visualization modes using the view selector
6. Use the filter bar to focus on specific areas of the hierarchy

### Synchronizing Feature Rankings

1. Navigate to "ProductBoard > Rankings"
2. Select the ProductBoard space to synchronize
3. Review the current rankings displayed in the table
4. Use filters to focus on specific features (optional)
5. Click "Sync Rankings" to begin the synchronization process
6. Review the sync preview showing affected items
7. Confirm synchronization
8. View the sync history and status indicators for confirmation

### Managing Entity Mappings

1. Navigate to "Azure DevOps > Entity Mappings"
2. Review existing mappings between ProductBoard and ADO entities
3. Click "Add Mapping" to create a new mapping
4. Select source entity type and target entity type
5. Configure mapping rules and field transformations
6. Save the new mapping
7. Test the mapping with the "Test" button to verify operation

### Conducting a Grooming Session

1. Navigate to "Grooming Sessions"
2. Click "Create New Session" to start a new grooming session
3. Complete the session details (name, date, participants)
4. Add features to the session from the ProductBoard features list
5. Start the session by clicking "Begin Session"
6. Work through features, updating estimates and details
7. Add notes and action items as needed
8. Finalize the session with "Complete Session"
9. Review the session summary and export results if needed

## UI Components Reference

The application uses a consistent set of UI components throughout, providing a cohesive user experience. For detailed information about individual components, please refer to the [UI Components Guide](../UI_COMPONENTS_GUIDE.md).

### Main Layout Components

- **Header**: App branding, workspace selector, notifications, and user menu
- **Sidebar Navigation**: Main navigation with collapsible sections
- **Main Content Area**: Primary content display with responsive layout
- **AI Assistant**: Floating help button with context-aware assistance

### Feature-Specific Components

- **Hierarchy Tree**: Interactive tree component for visualizing hierarchical data
- **Feature Card**: Displays feature information in a concise card format
- **Ranking Table**: Displays and allows manipulation of ranked items
- **Token Status Badge**: Visual indicator of token validity and status
- **Entity Mapping Editor**: Interface for creating and editing entity mappings
- **Field Mapping Editor**: Interface for mapping fields between systems
- **Sync History Timeline**: Visual display of synchronization history
