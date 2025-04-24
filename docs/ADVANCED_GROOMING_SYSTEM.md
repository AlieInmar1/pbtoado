# Advanced Grooming System: Architecture & Implementation Plan

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Component Architecture](#component-architecture)
4. [Integration Points](#integration-points)
5. [AI Capabilities](#ai-capabilities)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Technical Specifications](#technical-specifications)
8. [User Workflows](#user-workflows)
9. [Appendix: Database Migrations](#appendix-database-migrations)

## System Overview

The Advanced Grooming System is a comprehensive solution designed to enhance the agile grooming process by providing sophisticated story management, cross-session continuity, and AI-powered analysis. The system integrates with both ProductBoard and Azure DevOps to create a seamless workflow from product planning to development execution.

### Core Capabilities

- **Multi-type Session Management**: Support for product, technical, and refinement grooming sessions
- **Advanced Story Management**: Story splitting, linking, and cross-session tracking
- **Sprint Integration**: Connect grooming sessions to sprints for end-to-end planning
- **Transcript Analysis**: Upload and analyze meeting transcripts for insights
- **AI-Powered Assistance**: Intelligent suggestions for story improvement and session insights
- **Bi-directional Integration**: Sync with ProductBoard and Azure DevOps

### System Architecture Diagram

```mermaid
graph TD
    A[Grooming System] --> B[Session Management]
    A --> C[Story Management]
    A --> D[Sprint Management]
    A --> E[AI Analysis Engine]
    A --> F[Integration Hub]
    
    B --> B1[Product Grooming]
    B --> B2[Technical Grooming]
    B --> B3[Refinement]
    
    C --> C1[Story Creation]
    C --> C2[Story Splitting]
    C --> C3[Story Linking]
    C --> C4[Story History]
    
    D --> D1[Sprint Planning]
    D --> D2[Sprint Review]
    D --> D3[Sprint Analytics]
    
    E --> E1[Transcript Analysis]
    E --> E2[Story Improvement]
    E --> E3[Session Insights]
    
    F --> F1[ProductBoard Sync]
    F --> F2[Azure DevOps Sync]
```

## Database Schema

The database schema is designed to support all aspects of the grooming system while maintaining relationships with existing ProductBoard and Azure DevOps data.

### Existing Tables

The system will integrate with the following existing tables:

| Table Name | Description | Relevant Fields |
|------------|-------------|-----------------|
| `productboard_features` | Features from ProductBoard | id, title, description, owner_email, metadata |
| `productboard_initiatives` | Initiatives from ProductBoard | id, name, description |
| `productboard_components` | Components from ProductBoard | id, name, description |
| `productboard_users` | Users from ProductBoard | id, email, name |
| `productboard_products` | Products from ProductBoard | id, name, description |
| `ado_work_items` | Work items from Azure DevOps | id, title, type, state, area_path |
| `ado_teams` | Teams from Azure DevOps | id, name |
| `hierarchy_mappings` | Mappings between PB and ADO hierarchies | id, name, pb_to_ado_mappings, area_path_mappings |

### New Tables

The following new tables will be created to support the grooming system:

#### Core Tables

```sql
-- Grooming sessions
CREATE TABLE grooming_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('product', 'technical', 'refinement')),
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed')),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  facilitator_id UUID REFERENCES auth.users(id),
  transcript TEXT,
  transcript_uploaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories (extends productboard_features with grooming-specific data)
CREATE TABLE grooming_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pb_feature_id TEXT REFERENCES productboard_features(id),
  ado_work_item_id INTEGER REFERENCES ado_work_items(id),
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria JSONB DEFAULT '[]'::JSONB,
  level TEXT CHECK (level IN ('epic', 'feature', 'story')),
  status TEXT NOT NULL DEFAULT 'new',
  story_points INTEGER,
  complexity INTEGER,
  business_value INTEGER,
  parent_story_id UUID REFERENCES grooming_stories(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session stories (join table between sessions and stories)
CREATE TABLE session_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'discussed', 'deferred', 'split', 'rejected')),
  discussion_order INTEGER,
  discussion_points JSONB DEFAULT '[]'::JSONB,
  complexity_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, story_id)
);

-- Sprints
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  capacity INTEGER,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  retrospective_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sprint stories (join table between sprints and stories)
CREATE TABLE sprint_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  priority INTEGER,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done')),
  assignee_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sprint_id, story_id)
);
```

#### Supporting Tables

```sql
-- Story relationships (for tracking splits, dependencies, etc.)
CREATE TABLE story_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  target_story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent_child', 'split', 'depends_on', 'related_to')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE(source_story_id, target_story_id, relationship_type)
);

-- Story history (for tracking changes to stories)
CREATE TABLE story_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  session_id UUID REFERENCES grooming_sessions(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('facilitator', 'participant', 'observer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- AI analysis results
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  story_id UUID REFERENCES grooming_stories(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  key_points JSONB DEFAULT '[]'::JSONB,
  action_items JSONB DEFAULT '[]'::JSONB,
  decisions JSONB DEFAULT '[]'::JSONB,
  risks JSONB DEFAULT '[]'::JSONB,
  suggestions JSONB DEFAULT '[]'::JSONB,
  sentiment_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_analysis JSONB DEFAULT '{}'::JSONB
);

-- Session sprint association
CREATE TABLE session_sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, sprint_id)
);
```

### Entity Relationship Diagram

```mermaid
erDiagram
    GROOMING_SESSIONS ||--o{ SESSION_STORIES : contains
    GROOMING_SESSIONS ||--o{ SESSION_PARTICIPANTS : has
    GROOMING_SESSIONS ||--o{ AI_ANALYSES : analyzed_by
    GROOMING_SESSIONS ||--o{ SESSION_SPRINTS : associated_with
    
    GROOMING_STORIES ||--o{ SESSION_STORIES : included_in
    GROOMING_STORIES ||--o{ SPRINT_STORIES : planned_in
    GROOMING_STORIES ||--o{ STORY_RELATIONSHIPS : has
    GROOMING_STORIES ||--o{ STORY_HISTORY : tracks
    GROOMING_STORIES ||--o{ AI_ANALYSES : analyzed_by
    
    SPRINTS ||--o{ SPRINT_STORIES : contains
    SPRINTS ||--o{ SESSION_SPRINTS : includes
    SPRINTS ||--o{ AI_ANALYSES : analyzed_by
    
    PRODUCTBOARD_FEATURES ||--o{ GROOMING_STORIES : source_for
    ADO_WORK_ITEMS ||--o{ GROOMING_STORIES : linked_to
    
    USERS ||--o{ SESSION_PARTICIPANTS : participates
    USERS ||--o{ GROOMING_SESSIONS : facilitates
    USERS ||--o{ SPRINT_STORIES : assigned_to
    USERS ||--o{ STORY_HISTORY : changes
    USERS ||--o{ STORY_RELATIONSHIPS : creates
```

## Component Architecture

The system is built using a modular component architecture that separates concerns and promotes reusability.

### Frontend Architecture

```mermaid
graph TD
    A[App] --> B[Router]
    B --> C[MainLayout]
    
    C --> D[Dashboard]
    C --> E[GroomingModule]
    C --> F[SprintModule]
    C --> G[StoryModule]
    C --> H[AnalyticsModule]
    
    E --> E1[SessionList]
    E --> E2[SessionDetail]
    E --> E3[SessionCreation]
    
    E2 --> E2a[SessionHeader]
    E2 --> E2b[StoryList]
    E2 --> E2c[TranscriptPanel]
    E2 --> E2d[AIAssistant]
    
    G --> G1[StoryExplorer]
    G --> G2[StoryDetail]
    G --> G3[StorySplitter]
    G --> G4[StoryHistory]
    
    F --> F1[SprintPlanning]
    F --> F2[SprintDetail]
    F --> F3[SprintReview]
    
    H --> H1[TeamMetrics]
    H --> H2[StoryMetrics]
    H --> H3[SessionMetrics]
```

### Backend Architecture

```mermaid
graph TD
    A[API Layer] --> B[Authentication]
    A --> C[Data Access]
    A --> D[Integration]
    A --> E[AI Processing]
    
    C --> C1[Session Repository]
    C --> C2[Story Repository]
    C --> C3[Sprint Repository]
    
    D --> D1[ProductBoard Client]
    D --> D2[Azure DevOps Client]
    
    E --> E1[Transcript Analyzer]
    E --> E2[Story Analyzer]
    E --> E3[Session Analyzer]
    E --> E4[Sprint Analyzer]
```

## Integration Points

The system integrates with both ProductBoard and Azure DevOps to provide a seamless workflow.

### ProductBoard Integration

| Integration Point | Direction | Description | Implementation |
|-------------------|-----------|-------------|----------------|
| Feature Import | PB → System | Import features as stories | Scheduled sync using existing `pb-connect` module |
| Initiative Import | PB → System | Import initiatives for epic mapping | Scheduled sync using existing `pb-connect` module |
| Component Import | PB → System | Import components for feature categorization | Scheduled sync using existing `pb-connect` module |
| User Import | PB → System | Import users for assignment | Scheduled sync using existing `pb-connect` module |
| Story Updates | System → PB | Push story updates back to ProductBoard | API calls via `productBoard.ts` |
| Prioritization | System → PB | Push prioritization from grooming to ProductBoard | API calls via `productBoard.ts` |

### Azure DevOps Integration

| Integration Point | Direction | Description | Implementation |
|-------------------|-----------|-------------|----------------|
| Work Item Import | ADO → System | Import work items as stories | Scheduled sync using existing ADO cache |
| Team Import | ADO → System | Import teams for assignment | Scheduled sync using existing ADO cache |
| Work Item Updates | System → ADO | Push story updates to ADO work items | API calls via `azureDevOps.ts` |
| Sprint Sync | Bi-directional | Sync sprint information | API calls via `azureDevOps.ts` |
| Backlog Order | System → ADO | Push prioritization to ADO backlog | API calls via `azureDevOps.ts` |

### Integration Architecture

```mermaid
graph TD
    A[Grooming System] --> B[Integration Layer]
    
    B --> C[ProductBoard Integration]
    B --> D[Azure DevOps Integration]
    
    C --> C1[pb-connect Module]
    C --> C2[ProductBoard API Client]
    
    D --> D1[ADO Cache]
    D --> D2[Azure DevOps API Client]
    
    C1 --> E[Supabase Database]
    D1 --> E
    
    C2 --> F[ProductBoard API]
    D2 --> G[Azure DevOps API]
```

## AI Capabilities

The system leverages AI to provide intelligent assistance throughout the grooming process.

### Transcript Analysis

The system can analyze meeting transcripts to extract key information:

1. **Upload & Processing**:
   - Support for text and audio transcripts
   - Automatic speech-to-text conversion
   - Transcript segmentation and speaker identification

2. **Information Extraction**:
   - Key point identification
   - Action item extraction
   - Decision recognition
   - Risk identification

3. **Implementation**:
   - Supabase Edge Function for processing
   - OpenAI API integration
   - Custom NLP pipeline

### Story Enhancement

AI-powered story improvement suggestions:

1. **Quality Assessment**:
   - Acceptance criteria completeness
   - Description clarity
   - Testability evaluation
   - Independence verification

2. **Improvement Suggestions**:
   - Acceptance criteria refinement
   - Description enhancement
   - Edge case identification
   - Dependency recognition

3. **Implementation**:
   - Story analysis service
   - Historical pattern recognition
   - Team-specific learning application

### Session Intelligence

AI insights for grooming sessions:

1. **Real-time Assistance**:
   - Discussion facilitation
   - Question prompting
   - Information gap identification
   - Time management suggestions

2. **Post-session Analysis**:
   - Session effectiveness evaluation
   - Participation balance assessment
   - Decision quality analysis
   - Follow-up recommendation

3. **Implementation**:
   - Real-time analysis service
   - Session metrics calculation
   - Historical comparison engine

### AI Processing Pipeline

```mermaid
graph TD
    A[Input] --> B[Preprocessing]
    B --> C[Feature Extraction]
    C --> D[Model Processing]
    D --> E[Post-processing]
    E --> F[Result Storage]
    
    A --> A1[Transcript]
    A --> A2[Story Data]
    A --> A3[Session Data]
    
    D --> D1[OpenAI API]
    D --> D2[Custom Models]
    
    F --> F1[AI Analyses Table]
    F --> F2[Story Updates]
    F --> F3[Session Insights]
```

## Implementation Roadmap

The implementation is divided into four phases, each building on the previous one.

### Phase 1: Foundation (Weeks 1-4)

| Week | Focus | Tasks | Dependencies |
|------|-------|-------|--------------|
| 1 | Database Setup | Create database schema, Set up migrations | None |
| 2 | API Layer | Implement data access layer, Set up authentication | Database Schema |
| 3 | Basic UI | Create core UI components, Implement layouts | None |
| 4 | Session Management | Implement basic session CRUD, Session type handling | API Layer, Basic UI |

### Phase 2: Core Functionality (Weeks 5-8)

| Week | Focus | Tasks | Dependencies |
|------|-------|-------|--------------|
| 5 | Story Management | Story CRUD, Story selection, Basic splitting | Phase 1 |
| 6 | Session Workflow | Session preparation, In-session management | Story Management |
| 7 | Sprint Integration | Sprint CRUD, Session-sprint association | Session Workflow |
| 8 | Transcript Management | Transcript upload, Basic parsing | Session Workflow |

### Phase 3: AI & Integration (Weeks 9-12)

| Week | Focus | Tasks | Dependencies |
|------|-------|-------|--------------|
| 9-10 | AI Analysis Engine | Transcript analysis, Story improvement, Session insights | Phase 2 |
| 11 | ProductBoard Integration | Feature sync, Initiative sync, Prioritization | Phase 2 |
| 12 | Azure DevOps Integration | Work item sync, Sprint sync, Backlog order | Phase 2 |

### Phase 4: Advanced Features (Weeks 13-16)

| Week | Focus | Tasks | Dependencies |
|------|-------|-------|--------------|
| 13 | Advanced Story Splitting | Visual split editor, Split tracking, AI suggestions | Phase 3 |
| 14 | Session Intelligence | Pattern recognition, Team analytics, Quality metrics | Phase 3 |
| 15 | Collaborative Features | Real-time editing, Voting tools, Remote participation | Phase 3 |
| 16 | Knowledge Repository | Decision database, Learning categorization, Best practices | Phase 3 |

### Implementation Timeline

```mermaid
gantt
    title Grooming System Implementation
    dateFormat  YYYY-MM-DD
    section Foundation
    Database Schema           :a1, 2025-05-01, 1w
    API Layer                 :a2, after a1, 1w
    Basic UI                  :a3, 2025-05-01, 2w
    Session Management        :a4, after a2, 2w
    
    section Core Functionality
    Story Management          :b1, after a4, 1w
    Session Workflow          :b2, after b1, 1w
    Sprint Integration        :b3, after b2, 1w
    Transcript Management     :b4, after b3, 1w
    
    section AI & Integration
    AI Analysis Engine        :c1, after b4, 2w
    ProductBoard Integration  :c2, after b4, 1w
    Azure DevOps Integration  :c3, after c2, 1w
    
    section Advanced Features
    Advanced Story Splitting  :d1, after c1 c3, 1w
    Session Intelligence      :d2, after d1, 1w
    Collaborative Features    :d3, after d2, 1w
    Knowledge Repository      :d4, after d3, 1w
```

## Technical Specifications

### Frontend Stack

- **Framework**: React with TypeScript
- **State Management**: React Query + Context API
- **UI Components**: Shadcn UI + Custom components
- **Form Handling**: React Hook Form + Zod validation
- **Routing**: React Router
- **API Client**: Axios + custom request hooks

### Backend Stack

- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Serverless Functions**: Supabase Edge Functions
- **API**: RESTful endpoints + RPC functions

### AI Integration

- **Primary AI Provider**: OpenAI
- **API Integration**: GPT-4 for analysis, DALL-E for visualization
- **Custom Models**: Fine-tuned models for domain-specific tasks
- **Processing Pipeline**: Serverless functions for preprocessing and postprocessing

### Development Tools

- **Build System**: Vite
- **Testing**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint + Prettier
- **Documentation**: Storybook + Markdown

## User Workflows

### Grooming Session Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant S as System
    participant AI as AI Assistant
    participant PB as ProductBoard
    participant ADO as Azure DevOps
    
    U->>S: Create grooming session
    S->>PB: Fetch latest features
    PB-->>S: Feature data
    S->>U: Display session setup
    
    U->>S: Select stories for grooming
    S->>U: Display session workspace
    
    loop During Session
        U->>S: Discuss story
        S->>AI: Process discussion
        AI-->>S: Suggestions & insights
        S->>U: Display AI assistance
        
        alt Story needs splitting
            U->>S: Initiate story split
            S->>AI: Generate split suggestions
            AI-->>S: Split recommendations
            S->>U: Display split interface
            U->>S: Confirm split
            S->>S: Create child stories
        end
        
        U->>S: Update story status
        S->>S: Record discussion points
    end
    
    U->>S: Complete session
    S->>AI: Generate session summary
    AI-->>S: Session insights
    S->>U: Display session summary
    
    U->>S: Push updates to external systems
    S->>PB: Update features
    S->>ADO: Update work items
```

### Story Splitting Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant S as System
    participant AI as AI Assistant
    
    U->>S: Select story to split
    S->>U: Display split interface
    
    opt AI Assistance
        U->>S: Request split suggestions
        S->>AI: Analyze story
        AI-->>S: Split recommendations
        S->>U: Display suggestions
    end
    
    U->>S: Define split boundaries
    U->>S: Distribute acceptance criteria
    U->>S: Provide split rationale
    U->>S: Confirm split
    
    S->>S: Create child stories
    S->>S: Establish relationships
    S->>S: Update parent story
    S->>U: Display updated stories
```

### Sprint Planning Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant S as System
    participant AI as AI Assistant
    participant ADO as Azure DevOps
    
    U->>S: Create sprint
    S->>U: Display sprint setup
    
    U->>S: Associate grooming sessions
    S->>S: Import groomed stories
    
    U->>S: Prioritize stories
    S->>AI: Request capacity optimization
    AI-->>S: Capacity recommendations
    S->>U: Display recommendations
    
    U->>S: Finalize sprint backlog
    S->>ADO: Sync sprint to Azure DevOps
    ADO-->>S: Confirmation
    S->>U: Display sync status
```

## Appendix: Database Migrations

### Migration 0010: Create Grooming System Tables

```sql
-- Migration file: supabase/migrations/0010_create_grooming_system_tables.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grooming sessions
CREATE TABLE grooming_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('product', 'technical', 'refinement')),
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed')),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  facilitator_id UUID REFERENCES auth.users(id),
  transcript TEXT,
  transcript_uploaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories (extends productboard_features with grooming-specific data)
CREATE TABLE grooming_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pb_feature_id TEXT REFERENCES productboard_features(id),
  ado_work_item_id INTEGER REFERENCES ado_work_items(id),
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria JSONB DEFAULT '[]'::JSONB,
  level TEXT CHECK (level IN ('epic', 'feature', 'story')),
  status TEXT NOT NULL DEFAULT 'new',
  story_points INTEGER,
  complexity INTEGER,
  business_value INTEGER,
  parent_story_id UUID REFERENCES grooming_stories(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session stories (join table between sessions and stories)
CREATE TABLE session_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'discussed', 'deferred', 'split', 'rejected')),
  discussion_order INTEGER,
  discussion_points JSONB DEFAULT '[]'::JSONB,
  complexity_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, story_id)
);

-- Sprints
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  capacity INTEGER,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  retrospective_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sprint stories (join table between sprints and stories)
CREATE TABLE sprint_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  priority INTEGER,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done')),
  assignee_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sprint_id, story_id)
);

-- Story relationships (for tracking splits, dependencies, etc.)
CREATE TABLE story_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  target_story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent_child', 'split', 'depends_on', 'related_to')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE(source_story_id, target_story_id, relationship_type)
);

-- Story history (for tracking changes to stories)
CREATE TABLE story_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  session_id UUID REFERENCES grooming_sessions(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('facilitator', 'participant', 'observer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- AI analysis results
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  story_id UUID REFERENCES grooming_stories(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  key_points JSONB DEFAULT '[]'::JSONB,
  action_items JSONB DEFAULT '[]'::JSONB,
  decisions JSONB DEFAULT '[]'::JSONB,
  risks JSONB DEFAULT '[]'::JSONB,
  suggestions JSONB DEFAULT '[]'::JSONB,
  sentiment_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_analysis JSONB DEFAULT '{}'::JSONB
);

-- Session sprint association
CREATE TABLE session_sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, sprint_id)
);

-- Create indexes for performance
CREATE INDEX idx_grooming_stories_pb_feature_id ON grooming_stories(pb_feature_id);
CREATE INDEX idx_grooming_stories_ado_work_item_id ON grooming_stories(ado_work_item_i
