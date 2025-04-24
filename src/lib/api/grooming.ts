/**
 * API service for the Advanced Grooming System
 * Handles communication with the Supabase backend
 */

import { supabase } from '../supabase';
import { handleSupabaseError } from '../../../grooming/lib/supabase';
import { 
  GroomingSession, 
  GroomingStory, 
  SessionStory, 
  Sprint, 
  SprintStory,
  StoryRelationship,
  SessionParticipant,
  AIAnalysis,
  SessionSprint,
  CreateSessionRequest,
  UpdateSessionRequest,
  CreateStoryRequest,
  UpdateStoryRequest,
  AddStoryToSessionRequest,
  UpdateSessionStoryRequest,
  CreateSprintRequest,
  UpdateSprintRequest,
  AddStoryToSprintRequest,
  UpdateSprintStoryRequest,
  CreateStoryRelationshipRequest,
  AddParticipantRequest,
  SplitStoryRequest,
  AnalyzeTranscriptRequest,
  AnalyzeStoryRequest,
  AssociateSessionWithSprintRequest,
  SessionFilter,
  StoryFilter,
  SprintFilter,
  PaginatedResponse
} from '../../types/grooming';

/**
 * Session Management
 */

// Get all grooming sessions with optional filtering
export async function getSessions(
  filter?: SessionFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<GroomingSession>> {
  let query = supabase
    .from('grooming_sessions')
    .select('*', { count: 'exact' });

  // Apply filters if provided
  if (filter) {
    if (filter.workspace_id) {
      query = query.eq('workspace_id', filter.workspace_id);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.session_type) {
      query = query.eq('session_type', filter.session_type);
    }
    if (filter.from_date) {
      query = query.gte('session_date', filter.from_date);
    }
    if (filter.to_date) {
      query = query.lte('session_date', filter.to_date);
    }
    if (filter.facilitator_id) {
      query = query.eq('facilitator_id', filter.facilitator_id);
    }
    // Search functionality is not in the type definition, so we'll comment it out for now
    // if (filter.search) {
    //   query = query.ilike('name', `%${filter.search}%`);
    // }
  }

  // Add pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to).order('session_date', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching grooming sessions: ${error.message}`);
  }

  return {
    data: data as GroomingSession[],
    count: count || 0,
    page,
    page_size: pageSize,
    total_pages: count ? Math.ceil(count / pageSize) : 0
  };
}

// Get a single grooming session by ID
export async function getSessionById(id: string): Promise<GroomingSession> {
  const { data, error } = await supabase
    .from('grooming_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching grooming session: ${error.message}`);
  }

  return data as GroomingSession;
}

// Create a new grooming session
export async function createSession(session: CreateSessionRequest): Promise<GroomingSession> {
  // Add default status of 'planned' since it's required by the database but not in the CreateSessionRequest type
  const sessionWithStatus = {
    ...session,
    status: 'planned'
  };

  const { data, error } = await supabase
    .from('grooming_sessions')
    .insert([sessionWithStatus])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating grooming session: ${error.message}`);
  }

  return data as GroomingSession;
}

// Update an existing grooming session
export async function updateSession(session: UpdateSessionRequest): Promise<GroomingSession> {
  const { data, error } = await supabase
    .from('grooming_sessions')
    .update(session)
    .eq('id', session.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating grooming session: ${error.message}`);
  }

  return data as GroomingSession;
}

// Delete a grooming session
export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('grooming_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting grooming session: ${error.message}`);
  }
}

// Upload a transcript for a session
export async function uploadTranscript(sessionId: string, transcript: string): Promise<GroomingSession> {
  const { data, error } = await supabase
    .from('grooming_sessions')
    .update({
      transcript,
      transcript_uploaded_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error uploading transcript: ${error.message}`);
  }

  return data as GroomingSession;
}

/**
 * Story Management
 */

// Get all grooming stories with optional filtering
export async function getStories(
  filter?: StoryFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<GroomingStory>> {
  let query = supabase
    .from('grooming_stories')
    .select('*', { count: 'exact' });

  // Apply filters if provided
  if (filter) {
    if (filter.workspace_id) {
      query = query.eq('workspace_id', filter.workspace_id);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.level) {
      query = query.eq('level', filter.level);
    }
    if (filter.parent_story_id) {
      query = query.eq('parent_story_id', filter.parent_story_id);
    }
    if (filter.pb_feature_id) {
      query = query.eq('pb_feature_id', filter.pb_feature_id);
    }
    if (filter.ado_work_item_id) {
      query = query.eq('ado_work_item_id', filter.ado_work_item_id);
    }
    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }
  }

  // Add pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to).order('updated_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching grooming stories: ${error.message}`);
  }

  return {
    data: data as GroomingStory[],
    count: count || 0,
    page,
    page_size: pageSize,
    total_pages: count ? Math.ceil(count / pageSize) : 0
  };
}

// Get a single grooming story by ID
export async function getStoryById(id: string): Promise<GroomingStory> {
  const { data, error } = await supabase
    .from('grooming_stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching grooming story: ${error.message}`);
  }

  return data as GroomingStory;
}

// Create a new grooming story
export async function createStory(story: CreateStoryRequest): Promise<GroomingStory> {
  const { data, error } = await supabase
    .from('grooming_stories')
    .insert([story])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating grooming story: ${error.message}`);
  }

  return data as GroomingStory;
}

// Update an existing grooming story
export async function updateStory(story: UpdateStoryRequest): Promise<GroomingStory> {
  const { data, error } = await supabase
    .from('grooming_stories')
    .update(story)
    .eq('id', story.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating grooming story: ${error.message}`);
  }

  return data as GroomingStory;
}

// Delete a grooming story
export async function deleteStory(id: string): Promise<void> {
  const { error } = await supabase
    .from('grooming_stories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting grooming story: ${error.message}`);
  }
}

// Split a story into multiple stories
export async function splitStory(request: SplitStoryRequest): Promise<GroomingStory[]> {
  // This is a complex operation that requires a transaction
  // We'll implement it as an RPC function in Supabase
  const { data, error } = await supabase
    .rpc('split_story', request);

  if (error) {
    throw new Error(`Error splitting story: ${error.message}`);
  }

  return data as GroomingStory[];
}

/**
 * Session Story Management
 */

// Get all stories for a session
export async function getSessionStories(sessionId: string): Promise<SessionStory[]> {
  try {
    const { data, error } = await supabase
      .from('session_stories')
      .select(`
        *,
        story:grooming_stories(*)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Error fetching session stories: ${error.message}`);
    }

    return data as SessionStory[];
  } catch (error) {
    console.error('Error in getSessionStories:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}

// Add a story to a session
export async function addStoryToSession(request: AddStoryToSessionRequest): Promise<SessionStory> {
  const { data, error } = await supabase
    .from('session_stories')
    .insert([request])
    .select(`
      *,
      story:grooming_stories(*)
    `)
    .single();

  if (error) {
    throw new Error(`Error adding story to session: ${error.message}`);
  }

  return data as SessionStory;
}

// Update a session story
export async function updateSessionStory(request: UpdateSessionStoryRequest & { id: string }): Promise<SessionStory> {
  const { id, ...updateData } = request;
  
  const { data, error } = await supabase
    .from('session_stories')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      story:grooming_stories(*)
    `)
    .single();

  if (error) {
    throw new Error(`Error updating session story: ${error.message}`);
  }

  return data as SessionStory;
}

// Remove a story from a session
export async function removeStoryFromSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('session_stories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error removing story from session: ${error.message}`);
  }
}

/**
 * Sprint Management
 */

// Get all sprints with optional filtering
export async function getSprints(
  filter?: SprintFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Sprint>> {
  let query = supabase
    .from('sprints')
    .select('*', { count: 'exact' });

  // Apply filters if provided
  if (filter) {
    if (filter.workspace_id) {
      query = query.eq('workspace_id', filter.workspace_id);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.from_date) {
      query = query.gte('start_date', filter.from_date);
    }
    if (filter.to_date) {
      query = query.lte('end_date', filter.to_date);
    }
    if (filter.search) {
      query = query.ilike('name', `%${filter.search}%`);
    }
  }

  // Add pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to).order('start_date', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching sprints: ${error.message}`);
  }

  return {
    data: data as Sprint[],
    count: count || 0,
    page,
    page_size: pageSize,
    total_pages: count ? Math.ceil(count / pageSize) : 0
  };
}

// Get a single sprint by ID
export async function getSprintById(id: string): Promise<Sprint> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching sprint: ${error.message}`);
  }

  return data as Sprint;
}

// Create a new sprint
export async function createSprint(sprint: CreateSprintRequest): Promise<Sprint> {
  const { data, error } = await supabase
    .from('sprints')
    .insert([sprint])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating sprint: ${error.message}`);
  }

  return data as Sprint;
}

// Update an existing sprint
export async function updateSprint(sprint: UpdateSprintRequest & { id: string }): Promise<Sprint> {
  const { id, ...updateData } = sprint;
  
  const { data, error } = await supabase
    .from('sprints')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating sprint: ${error.message}`);
  }

  return data as Sprint;
}

// Delete a sprint
export async function deleteSprint(id: string): Promise<void> {
  const { error } = await supabase
    .from('sprints')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting sprint: ${error.message}`);
  }
}

/**
 * Sprint Story Management
 */

// Get all stories for a sprint
export async function getSprintStories(sprintId: string): Promise<SprintStory[]> {
  const { data, error } = await supabase
    .from('sprint_stories')
    .select(`
      *,
      story:grooming_stories(*),
      assignee:users(*)
    `)
    .eq('sprint_id', sprintId)
    .order('priority', { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Error fetching sprint stories: ${error.message}`);
  }

  return data as SprintStory[];
}

// Add a story to a sprint
export async function addStoryToSprint(request: AddStoryToSprintRequest): Promise<SprintStory> {
  const { data, error } = await supabase
    .from('sprint_stories')
    .insert([request])
    .select(`
      *,
      story:grooming_stories(*),
      assignee:users(*)
    `)
    .single();

  if (error) {
    throw new Error(`Error adding story to sprint: ${error.message}`);
  }

  return data as SprintStory;
}

// Update a sprint story
export async function updateSprintStory(request: UpdateSprintStoryRequest & { id: string }): Promise<SprintStory> {
  const { id, ...updateData } = request;
  
  const { data, error } = await supabase
    .from('sprint_stories')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      story:grooming_stories(*),
      assignee:users(*)
    `)
    .single();

  if (error) {
    throw new Error(`Error updating sprint story: ${error.message}`);
  }

  return data as SprintStory;
}

// Remove a story from a sprint
export async function removeStoryFromSprint(id: string): Promise<void> {
  const { error } = await supabase
    .from('sprint_stories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error removing story from sprint: ${error.message}`);
  }
}

/**
 * Story Relationship Management
 */

// Get all relationships for a story
export async function getStoryRelationships(storyId: string): Promise<StoryRelationship[]> {
  const { data, error } = await supabase
    .from('story_relationships')
    .select(`
      *,
      source_story:grooming_stories!source_story_id(*),
      target_story:grooming_stories!target_story_id(*)
    `)
    .or(`source_story_id.eq.${storyId},target_story_id.eq.${storyId}`);

  if (error) {
    throw new Error(`Error fetching story relationships: ${error.message}`);
  }

  return data as StoryRelationship[];
}

// Create a new story relationship
export async function createStoryRelationship(relationship: CreateStoryRelationshipRequest): Promise<StoryRelationship> {
  const { data, error } = await supabase
    .from('story_relationships')
    .insert([{
      ...relationship,
      created_by: (await supabase.auth.getUser()).data.user?.id
    }])
    .select(`
      *,
      source_story:grooming_stories!source_story_id(*),
      target_story:grooming_stories!target_story_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Error creating story relationship: ${error.message}`);
  }

  return data as StoryRelationship;
}

// Delete a story relationship
export async function deleteStoryRelationship(id: string): Promise<void> {
  const { error } = await supabase
    .from('story_relationships')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting story relationship: ${error.message}`);
  }
}

/**
 * Session Participant Management
 */

// Get all participants for a session
export async function getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
  const { data, error } = await supabase
    .from('session_participants')
    .select(`
      *,
      user:users(*)
    `)
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Error fetching session participants: ${error.message}`);
  }

  return data as SessionParticipant[];
}

// Add a participant to a session
export async function addParticipant(request: AddParticipantRequest): Promise<SessionParticipant> {
  const { data, error } = await supabase
    .from('session_participants')
    .insert([request])
    .select(`
      *,
      user:users(*)
    `)
    .single();

  if (error) {
    throw new Error(`Error adding participant: ${error.message}`);
  }

  return data as SessionParticipant;
}

// Remove a participant from a session
export async function removeParticipant(id: string): Promise<void> {
  const { error } = await supabase
    .from('session_participants')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error removing participant: ${error.message}`);
  }
}

/**
 * AI Analysis
 */

// Analyze a transcript
export async function analyzeTranscript(request: AnalyzeTranscriptRequest): Promise<AIAnalysis> {
  // This would typically call a Supabase Edge Function
  const { data, error } = await supabase
    .functions.invoke('analyze-transcript', {
      body: request
    });

  if (error) {
    throw new Error(`Error analyzing transcript: ${error.message}`);
  }

  return data as AIAnalysis;
}

// Analyze a story
export async function analyzeStory(request: AnalyzeStoryRequest): Promise<AIAnalysis> {
  // This would typically call a Supabase Edge Function
  const { data, error } = await supabase
    .functions.invoke('analyze-story', {
      body: request
    });

  if (error) {
    throw new Error(`Error analyzing story: ${error.message}`);
  }

  return data as AIAnalysis;
}

// Get AI analyses for a session
export async function getSessionAnalyses(sessionId: string): Promise<AIAnalysis[]> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching session analyses: ${error.message}`);
  }

  return data as AIAnalysis[];
}

// Get AI analyses for a story
export async function getStoryAnalyses(storyId: string): Promise<AIAnalysis[]> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching story analyses: ${error.message}`);
  }

  return data as AIAnalysis[];
}

/**
 * Session Sprint Association
 */

// Associate a session with a sprint
export async function associateSessionWithSprint(request: AssociateSessionWithSprintRequest): Promise<SessionSprint> {
  const { data, error } = await supabase
    .from('session_sprints')
    .insert([request])
    .select(`
      *,
      session:grooming_sessions(*),
      sprint:sprints(*)
    `)
    .single();

  if (error) {
    throw new Error(`Error associating session with sprint: ${error.message}`);
  }

  return data as SessionSprint;
}

// Get all sessions for a sprint
export async function getSprintSessions(sprintId: string): Promise<SessionSprint[]> {
  const { data, error } = await supabase
    .from('session_sprints')
    .select(`
      *,
      session:grooming_sessions(*),
      sprint:sprints(*)
    `)
    .eq('sprint_id', sprintId);

  if (error) {
    throw new Error(`Error fetching sprint sessions: ${error.message}`);
  }

  return data as SessionSprint[];
}

// Remove a session from a sprint
export async function removeSessionFromSprint(id: string): Promise<void> {
  const { error } = await supabase
    .from('session_sprints')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error removing session from sprint: ${error.message}`);
  }
}
