# ProductBoard-ADO Integration Documentation

## Documentation Index

This directory contains comprehensive documentation for the ProductBoard-ADO Integration application. Use this index to navigate to specific documentation topics.

### Overview Documents

- [Application UI & Functionality Guide](APPLICATION_UI_GUIDE.md) - Comprehensive overview of the application structure, navigation, and features
- [Technical Architecture](../TECHNICAL_ARCHITECTURE.md) - Detailed technical architecture information
- [User Guide](USER_GUIDE.md) - End-user focused guidance

### Core Feature Documentation

- [ProductBoard Token Authentication](PRODUCTBOARD_TOKEN_AUTHENTICATION.md) - Details on the token-based authentication system
- [ProductBoard Hierarchy Visualization](PRODUCTBOARD_HIERARCHY_VISUALIZATION.md) - Information about hierarchy visualization features
- [Azure DevOps Integration](AZURE_DEVOPS_INTEGRATION.md) - Details on ADO integration capabilities

### UI & Component Documentation

- [UI Components Guide](../UI_COMPONENTS_GUIDE.md) - Reference for reusable UI components
- [UI Implementation Summary](../UI_IMPLEMENTATION_SUMMARY.md) - Overview of UI implementation details

### Development & Maintenance

- [Cleanup Plan](../CLEANUP_PLAN.md) - Project cleanup strategy
- [Cleanup Report](../CLEANUP_REPORT.md) - Results of cleanup activities

## Features Overview

### Token-Based Authentication with ProductBoard

Secure token-based authentication enables reliable communication with ProductBoard's API without storing user credentials.

[Learn more about Token Authentication](PRODUCTBOARD_TOKEN_AUTHENTICATION.md)

### ProductBoard Hierarchy Visualization

Interactive visualization of ProductBoard's hierarchical structure, including products, components, features, and subfeatures.

[Learn more about Hierarchy Visualization](PRODUCTBOARD_HIERARCHY_VISUALIZATION.md)

### Azure DevOps Integration

Bidirectional synchronization between ProductBoard items and Azure DevOps work items with configurable entity and field mappings.

[Learn more about ADO Integration](AZURE_DEVOPS_INTEGRATION.md)

### Feature Management

Comprehensive features for managing ProductBoard features, including detailed views, relationship management, and synchronization.

[See the Application UI Guide](APPLICATION_UI_GUIDE.md#core-features)

### Relationship Mapping

Tools for mapping and visualizing relationships between features, initiatives, and objectives across both systems.

[See Entity Mapping details](AZURE_DEVOPS_INTEGRATION.md#entity-mapping)

## Project Structure

The application follows a modular structure:

- **`src/`**: Application source code
  - **`components/`**: React components
    - **`ui/`**: Reusable UI components
    - **`productboard/`**: ProductBoard-specific components
  - **`pages/`**: Page components
  - **`lib/`**: Shared utilities
  - **`contexts/`**: React contexts
  - **`types/`**: TypeScript type definitions

- **`supabase/`**: Supabase functions and migrations
  - **`functions/`**: Edge functions for backend operations
  - **`migrations/`**: Database migrations

- **`pb-sync/`**, **`pb-connect/`**, **`pb-simple/`**: Synchronization utilities

## Getting Started

For information on getting started with the application, please refer to the:

- [Project README](../README.md) for installation and setup
- [User Guide](USER_GUIDE.md) for using the application

## Contributing to Documentation

When updating these documents:

1. Keep information consistent across related documents
2. Update the main README when adding new documents
3. Link related documents to each other where appropriate
4. Maintain the current formatting and structure
