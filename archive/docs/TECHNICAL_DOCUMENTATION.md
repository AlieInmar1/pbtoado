# Technical Documentation

This technical documentation is intended for developers working on the ProductBoard-ADO integration system. It provides deeper technical details about the system architecture, implementation details, and guidance for extending the codebase.

## System Architecture

The application follows a layered architecture pattern:

1. **UI Layer** - React components and pages
2. **Service Layer** - API interfaces and business logic
3. **Data Layer** - Database operations and models
4. **External Services Layer** - Third-party integrations

### Component Structure

```
src/
├── components/        # UI components
├── contexts/          # React contexts
├── lib/               # Utilities and services
├── pages/             # Page components
└── types/             # TypeScript types
```

## Key Technical Components

### Authentication Flow

The authentication system uses a two-step token extraction process:

1. **Token Extraction**:
   - Implemented via Apify actor (`productboard-token-extractor`)
   - Uses `capture-productboard-tokens` Supabase function
   - Stores tokens in `productboard_auth_tokens` table

2. **Token Management**:
   - Implemented in `UserTokenManager.tsx`
   - Uses `check-token-validity` Supabase function
   - Automated refresh via `scheduled-token-refresh` Supabase function
   - Status visualization via `TokenStatusBadge` component

### Database Schema

The core database tables include:

- `productboard_auth_tokens` - Stores authentication tokens
- `productboard_tracked_boards` - Tracks ProductBoard boards
- `productboard_user_board_access` - Maps users to boards
- `productboard_item_rankings` - Stores feature rankings
- `productboard_hierarchy_products` - Stores product info
- `productboard_hierarchy_components` - Stores component info
- `productboard_hierarchy_features` - Stores feature info

### API Integration

#### ProductBoard API

The ProductBoard API integration is handled by:
- `ProductBoardClient.ts` - Core API client implementation
- `productBoardRankingExtractor.ts` - Rankings extraction logic
- Supabase functions for server-side operations

#### Azure DevOps API

The ADO integration is managed through:
- ADO API client in `lib/api/ado.ts`
- Mapping logic in entity mapping components
- GitHub Actions workflow for scheduled synchronization

## Serverless Functions

The application uses Supabase Edge Functions for server-side operations:

| Function                      | Purpose                                       | Key Implementation Details                   |
|-------------------------------|-----------------------------------------------|---------------------------------------------|
| `capture-productboard-tokens` | Captures user tokens via Apify                | Uses Apify API, stores tokens in database    |
| `check-token-validity`        | Validates token status                        | Checks expiration, performs test API request |
| `scheduled-token-refresh`     | Periodically refreshes tokens                 | Runs on CRON schedule via Supabase          |
| `sync-productboard-hierarchy` | Syncs hierarchy data                          | Maps ProductBoard hierarchy to database      |
| `sync-productboard-rankings`  | Syncs rankings data                          | Maps rankings to database and ADO           |

## Development Workflow

### Local Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Start development server: `npm run dev`

### Environment Variables

Key environment variables include:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APIFY_API_TOKEN=your-apify-token
VITE_ADO_ORGANIZATION=your-ado-org
VITE_ADO_PROJECT=your-ado-project
VITE_ADO_PAT=your-ado-personal-access-token
```

### Testing Changes

1. Make local changes
2. Run automated tests: `npm test`
3. For token-related changes, test with Apify locally: `node apify-token-extractor-runner.js`
4. For UI changes, test all affected components

## Extending the Application

### Adding New Features

To add a new feature to the application:

1. Create a new component in `src/components`
2. Create a new page in `src/pages` if needed
3. Add the route to `App.tsx`
4. Update types in `src/types` if needed
5. Add any necessary API methods to the appropriate service

### Adding New Integrations

To add a new third-party integration:

1. Create an API client in `src/lib/api`
2. Implement authentication if needed
3. Create UI components for configuration
4. Add mapping logic for data synchronization

## Deployment

### Frontend Deployment

The frontend is deployed to Netlify:

1. Build the frontend: `npm run build`
2. Deploy to Netlify: `netlify deploy --prod`

### Supabase Functions Deployment

For deploying Supabase functions:

1. Navigate to the function directory: `cd supabase/functions/function-name`
2. Deploy the function: `supabase functions deploy function-name`

### Apify Actors Deployment

For deploying Apify actors:

1. Navigate to the actor directory: `cd apify-project/actor-name`
2. Deploy to Apify: `apify push`

## Troubleshooting

### Common Issues

1. **Invalid Token Errors**:
   - Check token expiration date
   - Verify ProductBoard credentials
   - Check Apify logs for extraction issues

2. **Synchronization Failures**:
   - Verify mapping configurations
   - Check for ProductBoard API changes
   - Validate ADO PAT token permissions

3. **Supabase Function Errors**:
   - Check function logs in Supabase dashboard
   - Verify environment variables
   - Test function locally using Supabase CLI

## Performance Considerations

1. **Token Caching**:
   - Tokens are cached to reduce API calls
   - Refresh tokens before expiry to prevent downtime

2. **Hierarchy Rendering**:
   - Large hierarchies use virtualized rendering
   - Data is fetched incrementally to improve loading times

3. **Database Indexing**:
   - Key columns are indexed for performance
   - Use selective queries to reduce data load

## Security Practices

1. **Token Storage**:
   - Tokens are stored securely in Supabase database
   - Sensitive data is encrypted at rest

2. **API Access**:
   - API keys are stored in environment variables
   - User passwords are not stored, only used during token capture

3. **Authentication**:
   - User authentication uses Supabase Auth
   - API requests use secure HTTPS

## Code Style and Conventions

1. **TypeScript**:
   - Use explicit types for function parameters and returns
   - Prefer interfaces for object definitions
   - Use enum for defined sets of values

2. **React Components**:
   - Use functional components with hooks
   - Extract reusable logic to custom hooks
   - Organize components by feature domain

3. **File Structure**:
   - Keep related files together
   - Use index files for cleaner imports
   - Separate business logic from UI components

This technical documentation should provide developers with a comprehensive understanding of the system architecture and guide them in making modifications or extensions to the codebase.
