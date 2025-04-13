# ProductBoard-ADO Integration Rebuild

This directory contains a modern, maintainable rebuild of the ProductBoard-ADO Integration application following best practices for React development.

## Architecture

The rebuild follows a domain-driven, feature-based architecture with clear separation of concerns as detailed in the documentation:

- [Component Design Principles](../docs/architecture/COMPONENT_DESIGN_PRINCIPLES.md)
- [Application Structure](../docs/architecture/APPLICATION_STRUCTURE.md)
- [Data Flow and State Management](../docs/architecture/DATA_FLOW_AND_STATE.md)
- [Feature Modules](../docs/architecture/FEATURE_MODULES.md)
- [Implementation Plan](../docs/architecture/IMPLEMENTATION_PLAN.md)

## Key Features

- **Modern React with TypeScript**: Fully typed components and hooks
- **Domain-Driven Structure**: Organized by features rather than technical concerns
- **Component Library**: Reusable, composable UI components
- **State Management**: React Query for server state, Context API for application state
- **Performance Optimizations**: Code splitting, memoization, and other optimizations built in
- **Accessibility**: ARIA attributes and keyboard navigation support

## Getting Started

### Prerequisites

- Node.js v18+
- npm v8+

### Installation

```bash
# Navigate to the project directory
cd path/to/project

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
# Create a production build
npm run build
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Project Structure

```
/src_rebuild
  /features              # Domain-specific feature modules
    /auth                # Authentication, tokens, workspace selection
    /dashboard           # Main dashboard and overview components
    /hierarchy           # Product hierarchy visualization 
    /features            # Feature management components
    /rankings            # Feature prioritization and ranking views
    /stories             # Story management and grooming
    /sync                # Sync controls, history, and status
  
  /components            # Shared UI components
    /ui                  # Base UI primitives
    /layout              # Layout components
    /data-display        # Tables, charts, visualization components
    /feedback            # Alerts, toasts, progress indicators
    /forms               # Form controls and validation
  
  /hooks                 # Custom hooks
  /utils                 # Utility functions
  /services              # API clients and service layer
  /types                 # TypeScript type definitions
  /constants             # Application constants
  /assets                # Icons, images, and other static assets
```

## Main Technologies

- React
- TypeScript
- React Query (TanStack Query)
- React Router
- Tailwind CSS
- Vite
- Vitest
- Supabase

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# ProductBoard
VITE_PRODUCTBOARD_API_URL=https://api.productboard.com

# Azure DevOps
VITE_ADO_API_URL=https://dev.azure.com/your-organization
```

## Contributing

Please follow the design principles and architecture guidelines documented in the `docs/architecture/` directory when contributing to this project.

## License

This project is proprietary and confidential.
