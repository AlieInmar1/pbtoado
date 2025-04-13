# ProductBoard to Azure DevOps Integration

This application connects ProductBoard with Azure DevOps, providing synchronization of features, initiatives, objectives and providing visual hierarchy tools to help manage the product development process.

## Project Structure

The codebase is organized as follows:

### Core Components
- `/src/components/ui`: Reusable UI components
- `/src/components/productboard`: ProductBoard-specific components
- `/src/lib`: Utility functions and services
- `/src/types`: TypeScript type definitions
- `/src/pages`: Application pages/routes

### Key Features
- ProductBoard data fetching and synchronization
- ProductBoard hierarchy visualization
- Integration with Azure DevOps
- User token management for ProductBoard authentication

## Main Functionality

1. **ProductBoard Connectivity**: 
   - Connects to ProductBoard via API
   - Fetches features, initiatives, and objectives
   - Visualizes ProductBoard hierarchy

2. **Azure DevOps Integration**:
   - Syncs ProductBoard items with Azure DevOps work items
   - Maintains relationships between items

3. **User Interface**:
   - Dashboard views for ProductBoard data
   - Sync history and statistics tracking
   - Item relationship visualization

## Getting Started

1. Copy `.env.example` to `.env` and configure your environment variables
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PRODUCTBOARD_API_KEY=your_productboard_api_key
VITE_ADO_ORGANIZATION=your_azure_devops_organization
VITE_ADO_PROJECT=your_azure_devops_project
VITE_ADO_API_KEY=your_azure_devops_api_key
