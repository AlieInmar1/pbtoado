# Core Components of PBtoADO

This document outlines the essential components of the ProductBoard to Azure DevOps integration system after cleanup. These components represent the working functionality that was preserved during the cleanup process.

## UI Components

- `src/components/ui/Card.tsx`: Reusable card component for content containers
- `src/components/ui/DataTable.tsx`: Table component for displaying structured data
- `src/components/ui/StatusBadge.tsx`: Status indicator for various states (success, error, etc.)

## ProductBoard Integration

- `src/lib/productboardAPI.ts`: Core API integration with ProductBoard
- `src/components/productboard/FeatureCardView.tsx`: Display component for ProductBoard features
- `src/components/productboard/ProductBoardTrackingManager.tsx`: Manages ProductBoard board tracking

## Azure DevOps Integration 

- `src/lib/azureDevOpsAPI.ts`: Core API integration with Azure DevOps
- `src/lib/productBoardRankingExtractor.ts`: Extracts feature rankings from ProductBoard

## Data Management

- `src/lib/supabase.ts`: Database connectivity for persistent storage
- `src/types/database.ts`: TypeScript types for database entities
- `src/types/productboard.ts`: TypeScript types for ProductBoard entities

## Pages

- `src/pages/ProductBoardFeatures.tsx`: Main view for ProductBoard features
- `src/pages/ProductBoardRankings.tsx`: View for feature rankings
- `src/pages/SyncHistory.tsx`: View for synchronization history

## Key Functionality Preserved

1. **Token-based Authentication**: Secure token management for ProductBoard API access
2. **Feature Synchronization**: Bidirectional sync between ProductBoard and Azure DevOps
3. **Hierarchy Visualization**: Display of ProductBoard feature hierarchy
4. **Ranking Management**: Feature ranking visualization and synchronization
5. **Change Tracking**: History of synchronization events

This document serves as a guide to understanding the core components that make up the essential functionality of the application after removing extraneous code, tests, and experimental features.
