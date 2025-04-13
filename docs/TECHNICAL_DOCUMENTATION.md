# ProductBoard to ADO Integration: Technical Documentation

This technical documentation provides comprehensive information for developers, administrators, and technical stakeholders about the ProductBoard to ADO Integration system.

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Code Organization](#3-code-organization)
4. [API References](#4-api-references)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Synchronization Mechanisms](#7-synchronization-mechanisms)
8. [Error Handling](#8-error-handling)
9. [Performance Considerations](#9-performance-considerations)
10. [Security Considerations](#10-security-considerations)
11. [Deployment Guide](#11-deployment-guide)
12. [Development Setup](#12-development-setup)
13. [Monitoring and Logging](#13-monitoring-and-logging)
14. [Testing](#14-testing)
15. [Third-Party Integrations](#15-third-party-integrations)

---

## 1. System Architecture

The ProductBoard to ADO Integration system follows a modular architecture with several key components:

### 1.1 High-Level Architecture

```
┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
│                   │         │                   │         │                   │
│   React Frontend  │◄───────►│  Supabase Backend │◄───────►│ Synchronization   │
│                   │         │                   │         │ Modules           │
└───────────────────┘         └───────────────────┘         └───────────────────┘
                                       ▲                             ▲
                                       │                             │
                                       ▼                             ▼
                              ┌───────────────────┐         ┌───────────────────┐
                              │                   │         │                   │
                              │  ProductBoard API │         │   Azure DevOps    │
                              │                   │         │       API         │
                              └───────────────────┘         └───────────────────┘
```

### 1.2 Component Overview

- **Frontend**: React-based SPA for user interaction and visualization
- **Supabase Backend**: Handles data storage and serverless functions
- **Synchronization Modules**: Manages data flow between ProductBoard and ADO
- **API Integrations**: Connects to ProductBoard and ADO APIs

### 1.3 Key Services

- **Token Management Service**: Handles ProductBoard authentication
- **Hierarchy Sync Service**: Synchronizes product hierarchy data
- **Rankings Sync Service**: Synchronizes feature rankings
- **ADO Sync Service**: Pushes data to ADO and handles bidirectional updates

### 1.4 Communication Flow

1. Frontend communicates with Supabase via client libraries
2. Supabase Edge Functions communicate with external APIs
3. Synchronization modules orchestrate data flow between systems
4. GitHub workflows trigger scheduled synchronization tasks

## 2. Technology Stack

### 2.1 Frontend

- **React**: UI library for component-based development
- **TypeScript**: For type-safe code
- **Tailwind CSS**: For styling (inferred from file structure)
- **Vite**: Development server and build tool

### 2.2 Backend

- **Supabase**: Backend-as-a-Service platform
  - PostgreSQL: Database storage
  - Edge Functions: Serverless function execution
  - Row-Level Security: Data access control

### 2.3 Third-Party Services

- **Apify**: For web scraping and automation
- **GitHub Actions**: For workflow automation

### 2.4 Languages

- **TypeScript**: Frontend and some backend functions
- **JavaScript**: Synchronization modules and utilities
- **SQL**: Database schema and queries
- **Deno**: Runtime for Supabase Edge Functions

## 3. Code Organization

### 3.1 Frontend Structure

```
/src
  /components           # UI components
    /productboard       # ProductBoard-specific components
    /ui                 # Reusable UI components
  /lib                  # Utility libraries
  /pages                # Page components
  /types                # TypeScript type definitions
  App.tsx               # Main application entry point
```

### 3.2 Backend Structure

```
/supabase
  /functions            # Edge Functions
    /sync-productboard-hierarchy
    /sync-productboard-rankings
    /check-token-validity
    /scheduled-token-refresh
  /migrations           # Database schema migrations
```

### 3.3 Synchronization Modules

```
/pb-connect             # ADO integration module
  /lib                  # Core libraries
    api.js              # ADO API client
    db.js               # Database operations
    sync.js             # Synchronization logic
    transformer.js      # Data transformation

/pb-sync                # ProductBoard integration module
  api.js                # ProductBoard API client
  db.js                 # Database operations
  sync.js               # Synchronization engine
  cli.js                # Command-line interface
```

### 3.4 Third-Party Integration

```
/apify-project          # Apify actors
  /productboard-ranking-extractor
  /productboard-token-extractor
```

## 4. API References

### 4.1 ProductBoard API

The system interacts with the ProductBoard API through multiple clients:

#### 4.1.1 Authentication

```javascript
// ProductBoard authentication
const authenticate = async (token) => {
  return {
    headers: {
      'X-Session-Token': token,
      'Content-Type': 'application/json'
    }
  };
};
```

#### 4.1.2 ProductBoard Endpoints

- **Features API**: `/api/v1/features`
- **Objectives API**: `/api/v1/objectives`
- **Initiatives API**: `/api/v1/initiatives`
- **Relationships API**: `/api/v1/relationships`

#### 4.1.3 Error Handling

```javascript
try {
  // API call
} catch (error) {
  if (error.response) {
    // Handle API error
    if (error.response.status === 401) {
      // Handle authentication error
    }
  } else if (error.request) {
    // Handle network error
  } else {
    // Handle unexpected error
  }
}
```

### 4.2 Azure DevOps API

#### 4.2.1 Authentication

```javascript
// ADO authentication
const authenticate = (organization, token) => {
  const auth = Buffer.from(`:${token}`).toString('base64');
  return {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  };
};
```

#### 4.2.2 ADO Endpoints

- **Work Items API**: `/api/wit/workitems`
- **Relationships API**: `/api/wit/links`
- **Projects API**: `/api/projects`

### 4.3 Supabase Client

```typescript
// Supabase client setup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 5. Database Schema

### 5.1 Authentication Tables

```sql
-- Token storage
CREATE TABLE pb_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL,
  encrypted_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT TRUE
);

-- User-specific tokens
CREATE TABLE pb_user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  token_id UUID REFERENCES pb_tokens,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token refresh tracking
CREATE TABLE pb_token_refresh_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID REFERENCES pb_tokens,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### 5.2 ProductBoard Data Tables

```sql
-- Features table
CREATE TABLE pb_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pb_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Objectives table
CREATE TABLE pb_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pb_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initiatives table
CREATE TABLE pb_initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pb_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.3 Relationship Tables

```sql
-- Feature-initiative relationships
CREATE TABLE pb_feature_initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID REFERENCES pb_features ON DELETE CASCADE,
  initiative_id UUID REFERENCES pb_initiatives ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_id, initiative_id)
);

-- Initiative-objective relationships
CREATE TABLE pb_initiative_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES pb_initiatives ON DELETE CASCADE,
  objective_id UUID REFERENCES pb_objectives ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(initiative_id, objective_id)
);
```

### 5.4 Sync State Tables

```sql
-- Sync history
CREATE TABLE pb_sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'in_progress',
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_deleted INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Sync errors
CREATE TABLE pb_sync_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_id UUID REFERENCES pb_sync_history,
  error_message TEXT,
  error_stack TEXT,
  entity_id TEXT,
  entity_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6. Authentication & Authorization

### 6.1 ProductBoard Authentication

The system uses session tokens from ProductBoard for authentication:

1. **Token Acquisition**: 
   - Users provide tokens via the UI
   - Bookmarklet extracts tokens from browser sessions
   - Tokens are captured and stored securely

2. **Token Storage**:
   - Tokens are encrypted before storage
   - Stored in Supabase database with access controls
   - Associated with specific users

3. **Token Refresh**:
   - Scheduled function checks token validity
   - Attempts automated refresh for tokens nearing expiration
   - Notifies users of token expiration

### 6.2 ADO Authentication

ADO authentication uses Personal Access Tokens:

1. **Token Configuration**:
   - PAT stored in environment variables
   - Basic authentication header constructed

2. **Permission Scope**:
   - Required scopes: `work_write`, `work_read`, `project_read`
   - Minimal permissions for security

### 6.3 Supabase Authorization

Row-Level Security (RLS) policies control data access:

```sql
-- Example RLS policy
CREATE POLICY "Users can only view their own tokens"
ON pb_user_tokens
FOR SELECT
USING (auth.uid() = user_id);
```

## 7. Synchronization Mechanisms

### 7.1 ProductBoard Data Extraction

#### 7.1.1 Hierarchy Extraction

```javascript
// Pseudo-code for hierarchy extraction
async function extractHierarchy(token) {
  // Get objectives
  const objectives = await fetchObjectives(token);
  
  // Get initiatives
  const initiatives = await fetchInitiatives(token);
  
  // Get relationships
  const relationships = await fetchRelationships(token);
  
  // Build hierarchy
  const hierarchy = buildHierarchy(objectives, initiatives, relationships);
  
  return hierarchy;
}
```

#### 7.1.2 Rankings Extraction

```javascript
// Pseudo-code for rankings extraction
async function extractRankings(token) {
  // Get rankings data
  const rawRankings = await fetchRankings(token);
  
  // Process rankings
  const processedRankings = processRankings(rawRankings);
  
  return processedRankings;
}
```

### 7.2 Data Transformation

```javascript
// Pseudo-code for data transformation
function transformProductBoardToADO(pbEntity) {
  return {
    // ADO work item fields
    'System.Title': pbEntity.name,
    'System.Description': pbEntity.description,
    'System.State': mapStatus(pbEntity.status),
    // Custom fields
    'Custom.ProductBoardID': pbEntity.id
  };
}
```

### 7.3 Synchronization Process

1. **Fetch Data**: Extract data from ProductBoard
2. **Transform Data**: Convert to ADO format
3. **Compare State**: Identify changes since last sync
4. **Create/Update/Delete**: Apply changes to ADO
5. **Store State**: Update sync state in database
6. **Log Results**: Record sync operation details

### 7.4 Incremental Synchronization

```javascript
// Pseudo-code for incremental sync
async function incrementalSync() {
  // Get last sync timestamp
  const lastSync = await getLastSuccessfulSync();
  
  // Get changes since last sync
  const changes = await getChangesSince(lastSync);
  
  // Apply only the changes
  await applyChanges(changes);
  
  // Update sync timestamp
  await updateLastSuccessfulSync();
}
```

## 8. Error Handling

### 8.1 API Error Handling

```javascript
// API error handling
try {
  const response = await api.get('/endpoint');
  // Process response
} catch (error) {
  if (error.response) {
    // Handle API errors
    logger.error(`API error: ${error.response.status}`, {
      status: error.response.status,
      data: error.response.data
    });
    
    // Handle rate limiting
    if (error.response.status === 429) {
      // Implement backoff strategy
      await delay(calculateBackoff(error.response.headers['retry-after']));
      return retry();
    }
  } else if (error.request) {
    // Handle network errors
    logger.error('Network error', { error });
  } else {
    // Handle unexpected errors
    logger.error('Unexpected error', { error });
  }
  
  // Store error for troubleshooting
  await storeError(error);
}
```

### 8.2 Synchronization Error Handling

```javascript
// Synchronization error handling
async function syncWithErrorHandling() {
  const syncRecord = await createSyncRecord();
  
  try {
    // Perform synchronization
    const result = await performSync();
    
    // Update sync record with success
    await updateSyncRecord(syncRecord.id, {
      status: 'completed',
      completed_at: new Date(),
      ...result
    });
    
    return result;
  } catch (error) {
    // Update sync record with failure
    await updateSyncRecord(syncRecord.id, {
      status: 'failed',
      completed_at: new Date(),
      error_message: error.message
    });
    
    // Store detailed error information
    await storeSyncError(syncRecord.id, error);
    
    throw error;
  }
}
```

### 8.3 Transaction Management

```javascript
// Database transaction for consistency
const { data, error } = await supabase.rpc('sync_feature_with_transaction', {
  feature_data: feature,
  relationships: relationships
});

if (error) {
  // Handle transaction error
  console.error('Transaction failed:', error);
}
```

## 9. Performance Considerations

### 9.1 Pagination and Batching

```javascript
// Paginated data fetching
async function fetchAllPages(endpoint, token) {
  let allData = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`${endpoint}?page=${page}&per_page=100`, {
      headers: { 'X-Session-Token': token }
    });
    
    const data = await response.json();
    allData = [...allData, ...data.items];
    
    hasMore = data.items.length === 100;
    page += 1;
  }
  
  return allData;
}
```

### 9.2 Batch Processing

```javascript
// Process items in batches
async function processBatches(items, batchSize = 50) {
  const batches = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  const results = [];
  
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### 9.3 Caching

```javascript
// In-memory cache
const cache = new Map();

function getFromCache(key) {
  if (cache.has(key)) {
    const { value, expiry } = cache.get(key);
    if (expiry > Date.now()) {
      return value;
    }
    cache.delete(key); // Expired
  }
  return null;
}

function setInCache(key, value, ttlSeconds = 300) {
  cache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
}
```

## 10. Security Considerations

### 10.1 Token Security

- Tokens are stored with encryption
- Access controls prevent unauthorized use
- Token rotation minimizes exposure risk

```javascript
// Token encryption example
const encrypt = (text, key) => {
  // Implementation of secure encryption
};

const decrypt = (encryptedText, key) => {
  // Implementation of secure decryption
};
```

### 10.2 Data Handling

- Sensitive data is encrypted at rest
- Secure communication channels for all operations
- Minimal data retention policies

### 10.3 Access Control

```sql
-- Row-Level Security example
ALTER TABLE pb_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tokens are accessible only by owners"
ON pb_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM pb_user_tokens
    WHERE pb_user_tokens.token_id = pb_tokens.id
    AND pb_user_tokens.user_id = auth.uid()
  )
);
```

## 11. Deployment Guide

### 11.1 Prerequisites

- Supabase account and project
- Node.js environment
- Azure DevOps organization and project
- ProductBoard access

### 11.2 Environment Configuration

```bash
# Frontend environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-key
ADO_ORGANIZATION=your-organization
ADO_PROJECT=your-project
ADO_TOKEN=your-pat
ADO_API_VERSION=6.0
PB_API_URL=https://api.productboard.com
```

### 11.3 Deployment Steps

1. **Database Setup**:
   ```bash
   # Run migrations
   npx supabase db push
   ```

2. **Edge Functions Deployment**:
   ```bash
   # Deploy edge functions
   npx supabase functions deploy sync-productboard-hierarchy
   npx supabase functions deploy sync-productboard-rankings
   npx supabase functions deploy check-token-validity
   npx supabase functions deploy scheduled-token-refresh
   ```

3. **Frontend Deployment**:
   ```bash
   # Build frontend
   npm run build
   
   # Deploy to hosting service
   # Example for Netlify
   npx netlify deploy --prod
   ```

### 11.4 Post-Deployment Setup

1. **Configure Scheduled Tasks**:
   ```
   # Set up GitHub workflow triggers
   # See .github/workflows/sync-productboard-rankings.yml
   ```

2. **Initial Data Synchronization**:
   ```bash
   # Run initial synchronization
   node pb-sync/cli.js --full-sync
   ```

## 12. Development Setup

### 12.1 Local Environment Setup

```bash
# Clone repository
git clone https://repository-url.git
cd project-directory

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### 12.2 Supabase Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Start Supabase locally
supabase start

# Run migrations
supabase db reset

# Start edge functions locally
supabase functions serve sync-productboard-hierarchy --env-file .env
```

### 12.3 Development Workflow

1. Make changes to code
2. Run tests: `npm test`
3. Lint code: `npm run lint`
4. Commit changes with meaningful messages
5. Create pull request

## 13. Monitoring and Logging

### 13.1 Logging Strategy

```javascript
// Logging utility
const logger = {
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  },
  
  error: (message, data = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  }
};
```

### 13.2 Metrics Tracking

```javascript
// Sync metrics tracking
async function trackSyncMetrics(syncId, metrics) {
  await supabase
    .from('pb_sync_history')
    .update({
      items_processed: metrics.processed,
      items_created: metrics.created,
      items_updated: metrics.updated,
      items_deleted: metrics.deleted,
      completed_at: new Date().toISOString(),
      status: 'completed'
    })
    .eq('id', syncId);
}
```

### 13.3 Alert Configuration

Configure alerts for:
- Failed synchronization operations
- Token expiration
- API rate limit approaches
- Database connection issues

## 14. Testing

### 14.1 Testing Strategy

- **Unit Tests**: For individual functions and components
- **Integration Tests**: For API clients and data transformation
- **End-to-End Tests**: For complete sync workflows

### 14.2 Test Setup

```javascript
// Example test setup
import { describe, it, beforeEach, afterEach } from 'vitest';
import { expect } from 'chai';
import sinon from 'sinon';

describe('Synchronization', () => {
  let apiClient;
  let dbClient;
  
  beforeEach(() => {
    apiClient = sinon.stub();
    dbClient = sinon.stub();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should process items correctly', async () => {
    // Test implementation
  });
});
```

### 14.3 Mocking External Dependencies

```javascript
// Mocking API responses
const mockProductBoardAPI = {
  getFeatures: sinon.stub().resolves([
    { id: 'feature-1', name: 'Feature 1' },
    { id: 'feature-2', name: 'Feature 2' }
  ]),
  
  getObjectives: sinon.stub().resolves([
    { id: 'objective-1', name: 'Objective 1' }
  ])
};
```

## 15. Third-Party Integrations

### 15.1 Apify Integration

```javascript
// Apify actor execution
const runApifyActor = async (actorId, input) => {
  const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
  });
  
  const run = await client.actor(actorId).call(input);
  const dataset = await client.dataset(run.defaultDatasetId).listItems();
  
  return dataset.items;
};
```

### 15.2 GitHub Workflows

```yaml
# Example GitHub workflow
name: Sync ProductBoard Rankings

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run sync
        run: node pb-sync/cli.js --sync-rankings
        env:
          PB_API_TOKEN: ${{ secrets.PB_API_TOKEN }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

---

This technical documentation provides a comprehensive guide to the ProductBoard to ADO Integration system. For additional details, refer to the code comments and module-specific documentation in the codebase.
