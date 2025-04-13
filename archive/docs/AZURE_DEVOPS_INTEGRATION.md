# Azure DevOps Integration

## Overview

The Azure DevOps (ADO) integration enables bidirectional synchronization between ProductBoard items and Azure DevOps work items. This document details the integration architecture, synchronization mechanisms, entity mappings, and implementation details.

## Table of Contents

1. [Integration Architecture](#integration-architecture)
2. [Authentication & Configuration](#authentication--configuration)
3. [Entity Mapping](#entity-mapping)
4. [Field Mapping](#field-mapping)
5. [Synchronization Process](#synchronization-process)
6. [Conflict Resolution](#conflict-resolution)
7. [Sync History & Monitoring](#sync-history--monitoring)
8. [Troubleshooting](#troubleshooting)

## Integration Architecture

### High-Level Overview

The integration consists of the following components:

1. **Connector Service**: Maintains the connection between ProductBoard and Azure DevOps.
2. **Mapping Engine**: Defines and applies the rules for entity and field mappings.
3. **Sync Service**: Orchestrates the data synchronization process.
4. **Storage Layer**: Persists mapping configurations, sync history, and relationship data.
5. **Conflict Resolution System**: Handles data conflicts between systems.

### Data Flow

```
┌───────────────┐      ┌──────────────────┐      ┌────────────────┐
│ ProductBoard  │◄────►│  Sync Service    │◄────►│  Azure DevOps  │
└───────────────┘      └──────────────────┘      └────────────────┘
        ▲                       ▲                        ▲
        │                       │                        │
        │                       ▼                        │
        │               ┌──────────────────┐            │
        └───────────────┤  Mapping Engine  ├────────────┘
                        └──────────────────┘
                                 ▲
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  Storage Layer   │
                        └──────────────────┘
```

Data flows bidirectionally between ProductBoard and Azure DevOps, with the Sync Service orchestrating the process based on mappings defined in the Mapping Engine.

## Authentication & Configuration

### Azure DevOps Authentication

The integration uses Personal Access Tokens (PATs) for authenticating with Azure DevOps:

1. **Token Generation**: Generated in Azure DevOps with specific scopes:
   - `Work Items (Read, Write, & Manage)`
   - `Project and Team (Read)`

2. **Token Storage**: PATs are securely stored in the Supabase database with encryption.

3. **Configuration Parameters**:
   - Organization name
   - Project name
   - PAT
   - API version (defaults to the latest supported)

### ProductBoard Authentication

The integration uses the token-based authentication system detailed in [ProductBoard Token Authentication](PRODUCTBOARD_TOKEN_AUTHENTICATION.md).

## Entity Mapping

### Mapping Strategy

The Entity Mapping system defines how entities in ProductBoard correspond to work item types in Azure DevOps.

#### Default Mappings

| ProductBoard Entity | Azure DevOps Work Item |
|---------------------|------------------------|
| Feature | Feature |
| Component | Epic |
| Subfeature | User Story |
| Initiative | Epic |
| Objective | N/A (Custom field in Epic) |

#### Custom Mapping Configuration

Administrators can create custom entity mappings through the Entity Mapping interface:

1. **Direct Mappings**: One-to-one mapping between entity types.
2. **Conditional Mappings**: Based on attributes like status, priority, or custom fields.
3. **Hierarchical Mappings**: Define parent-child relationships between mapped entities.

### Entity Relationship Preservation

The integration preserves relationships between entities:

1. **Parent-Child Relationships**: Hierarchical relationships in ProductBoard are reflected in ADO.
2. **Cross-Entity Relationships**: Connections between different entity types are maintained.
3. **Linking Strategy**: Uses Azure DevOps link types (Parent, Related, etc.) to represent ProductBoard relationships.

## Field Mapping

### Field Mapping Configuration

The Field Mapping interface allows administrators to define how fields map between systems:

1. **Standard Fields**: Common fields like title, description, priority, etc.
2. **Custom Fields**: Organization-specific fields in either system.
3. **Computed Fields**: Fields generated from calculations or transformations.

### Transformation Rules

Field values can be transformed during synchronization:

1. **Direct Mapping**: Values copied directly without transformation.
2. **Value Mapping**: Specific values in one system map to different values in the other.
3. **Formula Mapping**: Values calculated based on formulas or expressions.
4. **Default Values**: Applied when source fields are empty or missing.

### Field Mapping Example

```json
{
  "title": {
    "productboard": "name",
    "ado": "System.Title",
    "direction": "bidirectional",
    "transformation": "direct"
  },
  "priority": {
    "productboard": "priority",
    "ado": "Microsoft.VSTS.Common.Priority",
    "direction": "productboard_to_ado",
    "transformation": "valueMap",
    "valueMap": {
      "high": "1",
      "medium": "2",
      "low": "3"
    }
  },
  "description": {
    "productboard": "description",
    "ado": "System.Description",
    "direction": "bidirectional",
    "transformation": "htmlToMarkdown"
  }
}
```

## Synchronization Process

### Synchronization Triggers

Data synchronization can be triggered through:

1. **Manual Sync**: User-initiated synchronization for specific items or collections.
2. **Scheduled Sync**: Automated synchronization at configured intervals.
3. **Event-Based Sync**: Triggered by changes in either system.
4. **Webhook-Based Sync**: Real-time synchronization via webhooks when available.

### Sync Modes

The integration supports different synchronization modes:

1. **Full Sync**: Complete synchronization of all mapped entities.
2. **Incremental Sync**: Synchronize only changes since the last sync.
3. **Entity-Specific Sync**: Synchronize specific entity types or collections.
4. **Directional Sync**: Control data flow direction (PB to ADO, ADO to PB, or bidirectional).

### Sync Process Flow

1. **Initialization**
   - Verify authentication tokens
   - Load mapping configurations
   - Establish API connections

2. **Data Collection**
   - Retrieve data from source system
   - Apply filters based on sync configuration
   - Prepare data for transformation

3. **Transformation**
   - Apply entity mappings
   - Transform field values
   - Validate transformed data

4. **Change Detection**
   - Compare with previous state
   - Identify created, updated, and deleted items
   - Detect potential conflicts

5. **Synchronization**
   - Create, update, or delete items in target system
   - Establish relationships and links
   - Handle synchronization failures

6. **Verification**
   - Verify successful synchronization
   - Calculate synchronization statistics
   - Log synchronization results

7. **Completion**
   - Update sync history
   - Notify users of completion
   - Handle post-sync actions

## Conflict Resolution

### Conflict Types

The integration handles several types of conflicts:

1. **Concurrent Modification**: When items are modified in both systems between syncs.
2. **Field Value Conflicts**: Conflicting values for the same field.
3. **Relationship Conflicts**: Inconsistent relationships between entities.
4. **Deleted Item Conflicts**: Items deleted in one system but modified in another.

### Resolution Strategies

Conflicts are resolved using configurable strategies:

1. **System Priority**: One system takes precedence (e.g., ProductBoard is authoritative).
2. **Last Modified**: The most recently modified version prevails.
3. **Field-Level Rules**: Different rules for specific fields.
4. **Manual Resolution**: User intervention for critical conflicts.
5. **Merge Strategy**: Combining non-conflicting changes from both systems.

### Conflict Notification

Users are notified of conflicts through:

1. **In-App Notifications**: Alerts within the application interface.
2. **Email Notifications**: Optional email alerts for critical conflicts.
3. **Sync History**: Detailed conflict information in sync history.
4. **Resolution Interface**: Tools for reviewing and resolving conflicts.

## Sync History & Monitoring

### Sync History Tracking

The Sync History feature provides:

1. **Comprehensive Logs**: Detailed records of all synchronization activities.
2. **Item-Level Tracking**: History of synchronization for individual items.
3. **Change Visualization**: Visual representation of changes made during sync.
4. **Error Logging**: Detailed information about synchronization failures.

### Monitoring Dashboard

The monitoring capabilities include:

1. **Sync Status Overview**: Current state of synchronization.
2. **Historical Performance**: Trends and patterns in synchronization.
3. **Error Analysis**: Common failure points and resolution rates.
4. **System Health**: Connection status and API performance.

### Statistics and Metrics

The integration tracks various metrics:

1. **Sync Volume**: Number of items synchronized.
2. **Success Rate**: Percentage of successful synchronizations.
3. **Conflict Rate**: Frequency and types of conflicts.
4. **Sync Duration**: Time taken for synchronization processes.
5. **API Performance**: Response times and throughput.

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify PAT validity and permissions
   - Check ProductBoard token status
   - Ensure correct organization and project names

2. **Mapping Errors**
   - Validate entity mapping configurations
   - Check for circular dependencies
   - Verify field mapping validity

3. **Synchronization Failures**
   - Review API error responses
   - Check for rate limiting issues
   - Verify network connectivity

4. **Data Inconsistencies**
   - Check for conflicting field values
   - Verify relationship consistency
   - Review transformation rules

### Diagnostic Tools

1. **Sync Logs**: Detailed records of synchronization activities.
2. **API Request Inspector**: Examine raw API requests and responses.
3. **Mapping Validator**: Test mapping configurations before applying.
4. **Conflict Explorer**: Analyze and resolve synchronization conflicts.

### Resolution Steps

1. **Verify Credentials**: Ensure authentication tokens are valid.
2. **Check Configurations**: Validate entity and field mappings.
3. **Review Logs**: Analyze synchronization logs for errors.
4. **Test Connections**: Verify API connectivity to both systems.
5. **Validate Data**: Check for data consistency issues.
6. **Retry Sync**: Attempt synchronization with adjusted settings.
7. **Reset State**: In extreme cases, reset synchronization state and start fresh.
