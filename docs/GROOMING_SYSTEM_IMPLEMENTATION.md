# Advanced Grooming System Implementation

This document provides an overview of the implementation of the Advanced Grooming System, including the components created, their purpose, and how they work together.

## Components Created

### 1. Database Schema

The database schema is defined in `supabase/migrations/0010_create_grooming_system_tables.sql` and includes the following tables:

- `grooming_sessions`: Stores information about grooming sessions
- `grooming_stories`: Stores user stories with their details
- `session_stories`: Join table connecting sessions and stories
- `sprints`: Stores sprint information
- `sprint_stories`: Join table connecting sprints and stories
- `story_relationships`: Tracks relationships between stories (parent-child, dependencies, etc.)
- `story_history`: Tracks changes to stories over time
- `session_participants`: Tracks participants in grooming sessions
- `ai_analyses`: Stores AI-generated analyses of transcripts and stories
- `session_sprints`: Join table connecting sessions and sprints

The schema includes appropriate indexes and RLS policies for security.

### 2. TypeScript Type Definitions

Type definitions are provided in `src/types/grooming.ts` and include interfaces for:

- Sessions, stories, and sprints
- Relationships between these entities
- Request and response types for API calls
- Filter types for querying data

Additional type definitions for ProductBoard integration are in `src/types/pb-connect.d.ts`.

### 3. API Service

The API service in `src/lib/api/grooming.ts` provides functions for:

- CRUD operations on sessions, stories, and sprints
- Managing relationships between these entities
- Analyzing transcripts and stories using AI
- Integrating with ProductBoard and Azure DevOps

### 4. React Hooks

React hooks provide a clean interface for components to interact with the API:

- `src/hooks/useGroomingSessions.ts`: Hooks for managing grooming sessions
- `src/hooks/useGroomingStories.ts`: Hooks for managing stories
- `src/hooks/useSprints.ts`: Hooks for managing sprints

These hooks use React Query for efficient data fetching and caching.

### 5. AI Analysis Functions

Supabase Edge Functions provide AI-powered analysis:

- `supabase/functions/analyze-transcript/index.ts`: Analyzes grooming session transcripts
- `supabase/functions/analyze-story/index.ts`: Analyzes and provides suggestions for improving stories

These functions use OpenAI's GPT-4 model to extract insights and provide recommendations.

## How to Use the System

### Setting Up the Database

1. Deploy the migration file to your Supabase project:

```bash
supabase db push
```

### Configuring Environment Variables

The system requires the following environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: Your OpenAI API key

For the Edge Functions, you'll also need to set:

- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Deploying Edge Functions

Deploy the Edge Functions to your Supabase project:

```bash
supabase functions deploy analyze-transcript
supabase functions deploy analyze-story
```

### Using the React Hooks

The React hooks can be used in your components like this:

```tsx
import { useGroomingSessions } from '../hooks/useGroomingSessions';
import { useGroomingStories } from '../hooks/useGroomingStories';
import { useSprints } from '../hooks/useSprints';

function GroomingDashboard() {
  const { data: sessions, isLoading: sessionsLoading } = useGroomingSessions();
  const { data: stories, isLoading: storiesLoading } = useGroomingStories();
  const { data: sprints, isLoading: sprintsLoading } = useSprints();

  if (sessionsLoading || storiesLoading || sprintsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Grooming Dashboard</h1>
      
      <h2>Sessions</h2>
      <ul>
        {sessions?.data.map(session => (
          <li key={session.id}>{session.name}</li>
        ))}
      </ul>
      
      <h2>Stories</h2>
      <ul>
        {stories?.data.map(story => (
          <li key={story.id}>{story.title}</li>
        ))}
      </ul>
      
      <h2>Sprints</h2>
      <ul>
        {sprints?.data.map(sprint => (
          <li key={sprint.id}>{sprint.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Creating a New Session

```tsx
import { useCreateSession } from '../hooks/useGroomingSessions';

function CreateSessionForm() {
  const createSession = useCreateSession();
  
  const handleSubmit = (event) => {
    event.preventDefault();
    
    createSession.mutate({
      name: 'Sprint 42 Refinement',
      session_type: 'refinement',
      session_date: new Date().toISOString(),
      duration_minutes: 60,
      workspace_id: 'your-workspace-id',
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createSession.isLoading}>
        Create Session
      </button>
    </form>
  );
}
```

### Analyzing a Transcript

```tsx
import { useUploadTranscript } from '../hooks/useGroomingSessions';

function TranscriptUploader({ sessionId }) {
  const uploadTranscript = useUploadTranscript();
  
  const handleUpload = (transcript) => {
    uploadTranscript.mutate({
      sessionId,
      transcript,
    });
  };
  
  return (
    <div>
      <textarea onChange={(e) => handleUpload(e.target.value)} />
      <button disabled={uploadTranscript.isLoading}>
        Analyze Transcript
      </button>
    </div>
  );
}
```

### Analyzing a Story

```tsx
import { useAnalyzeStory } from '../hooks/useGroomingStories';

function StoryAnalyzer({ storyId }) {
  const analyzeStory = useAnalyzeStory();
  
  const handleAnalyze = () => {
    analyzeStory.mutate({
      story_id: storyId,
    });
  };
  
  return (
    <button onClick={handleAnalyze} disabled={analyzeStory.isLoading}>
      Analyze Story
    </button>
  );
}
```

## Integration with ProductBoard and Azure DevOps

The system integrates with ProductBoard and Azure DevOps to provide a seamless workflow:

### ProductBoard Integration

- Features from ProductBoard are imported as stories
- Initiatives are imported for epic mapping
- Components are imported for feature categorization
- Users are imported for assignment
- Updates to stories can be pushed back to ProductBoard
- Prioritization from grooming can be pushed to ProductBoard

### Azure DevOps Integration

- Work items from Azure DevOps are imported as stories
- Teams are imported for assignment
- Updates to stories can be pushed to Azure DevOps work items
- Sprint information can be synced bidirectionally
- Prioritization from grooming can be pushed to Azure DevOps backlog

## Next Steps

To complete the implementation of the Advanced Grooming System, the following steps are recommended:

1. Create UI components for the grooming session workflow
2. Implement the story splitting interface
3. Create the sprint planning board
4. Implement the analytics dashboard
5. Add collaborative features for real-time editing
6. Create the knowledge repository for storing learnings

## Conclusion

The Advanced Grooming System provides a comprehensive solution for managing the agile grooming process. By integrating with ProductBoard and Azure DevOps, it creates a seamless workflow from product planning to development execution. The AI-powered analysis of transcripts and stories provides valuable insights and recommendations to improve the quality of grooming sessions and user stories.
