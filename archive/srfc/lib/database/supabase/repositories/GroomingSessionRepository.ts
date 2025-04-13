import { SupabaseClient } from '@supabase/supabase-js';
import type { GroomingSession, GroomingSessionStory, GroomingSessionParticipant, Story } from '../../../../types/database';
import type { GroomingSessionRepository } from '../../types';

export class SupabaseGroomingSessionRepository implements GroomingSessionRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(workspaceId: string): Promise<GroomingSession[]> {
    const { data, error } = await this.client
      .from('grooming_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<GroomingSession | null> {
    const { data, error } = await this.client
      .from('grooming_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: Partial<GroomingSession>): Promise<GroomingSession> {
    const { data: session, error } = await this.client
      .from('grooming_sessions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return session;
  }

  async update(id: string, data: Partial<GroomingSession>): Promise<GroomingSession> {
    const { data: session, error } = await this.client
      .from('grooming_sessions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return session;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('grooming_sessions')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getUpcoming(): Promise<GroomingSession[]> {
    const { data, error } = await this.client
      .from('grooming_sessions')
      .select('*')
      .gt('session_date', new Date().toISOString())
      .order('session_date');

    if (error) throw error;
    return data || [];
  }

  async getByStatus(status: string): Promise<GroomingSession[]> {
    const { data, error } = await this.client
      .from('grooming_sessions')
      .select('*')
      .eq('status', status)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateTranscript(id: string, transcript: string): Promise<void> {
    const { error } = await this.client
      .from('grooming_sessions')
      .update({ transcript })
      .eq('id', id);

    if (error) throw error;
  }

  // Session stories methods
  async getSessionStories(sessionId: string): Promise<(GroomingSessionStory & { story: Story })[]> {
    const { data, error } = await this.client
      .from('grooming_session_stories')
      .select(`
        *,
        story:stories!story_id(*)
      `)
      .eq('session_id', sessionId);

    if (error) throw error;
    return data || [];
  }

  async addStoryToSession(sessionId: string, storyId: string): Promise<GroomingSessionStory> {
    try {
      // First, get the story data to use for initial_state
      const { data: storyData, error: storyError } = await this.client
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) {
        console.error('Error fetching story data:', storyError);
        throw storyError;
      }

      if (!storyData) {
        throw new Error(`Story with ID ${storyId} not found`);
      }

      // Get the current count of stories to set the discussion_order
      const { count, error: countError } = await this.client
        .from('grooming_session_stories')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (countError) throw countError;

      // Create the base session story data
      const sessionStoryData: Partial<GroomingSessionStory> = {
        session_id: sessionId,
        story_id: storyId,
        status: 'pending',
        discussion_points: [],
        decisions: [],
        // Set initial_state to the current story data
        initial_state: storyData,
      };

      // Try to add the discussion_order field if it exists in the schema
      try {
        sessionStoryData.discussion_order = count || 0;
        
        const { data, error } = await this.client
          .from('grooming_session_stories')
          .insert(sessionStoryData)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error: any) {
        // If the error is related to the discussion_order column not existing,
        // try again without that field
        if (error.message?.includes('discussion_order') || 
            error.code === 'PGRST204' || 
            error.details?.includes('discussion_order')) {
          
          console.warn('discussion_order column not found in schema, trying without it');
          
          // Remove the discussion_order field and try again
          delete sessionStoryData.discussion_order;
          
          const { data, error: retryError } = await this.client
            .from('grooming_session_stories')
            .insert(sessionStoryData)
            .select()
            .single();

          if (retryError) throw retryError;
          return data;
        } else {
          // If it's a different error, rethrow it
          throw error;
        }
      }
    } catch (error) {
      console.error('Error adding story to session:', error);
      throw error;
    }
  }

  async removeStoryFromSession(sessionStoryId: string): Promise<boolean> {
    const { error } = await this.client
      .from('grooming_session_stories')
      .delete()
      .eq('id', sessionStoryId);

    return !error;
  }

  async updateSessionStory(sessionStoryId: string, data: Partial<GroomingSessionStory>): Promise<GroomingSessionStory> {
    const { data: sessionStory, error } = await this.client
      .from('grooming_session_stories')
      .update(data)
      .eq('id', sessionStoryId)
      .select()
      .single();

    if (error) throw error;
    return sessionStory;
  }

  // Session participants methods
  async getSessionParticipants(sessionId: string): Promise<GroomingSessionParticipant[]> {
    const { data, error } = await this.client
      .from('grooming_session_participants')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data || [];
  }

  async addParticipant(sessionId: string, participant: Partial<GroomingSessionParticipant>): Promise<GroomingSessionParticipant> {
    const participantData = {
      ...participant,
      session_id: sessionId,
    };

    const { data, error } = await this.client
      .from('grooming_session_participants')
      .insert(participantData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeParticipant(participantId: string): Promise<boolean> {
    const { error } = await this.client
      .from('grooming_session_participants')
      .delete()
      .eq('id', participantId);

    return !error;
  }

  async updateParticipant(participantId: string, data: Partial<GroomingSessionParticipant>): Promise<GroomingSessionParticipant> {
    const { data: participant, error } = await this.client
      .from('grooming_session_participants')
      .update(data)
      .eq('id', participantId)
      .select()
      .single();

    if (error) throw error;
    return participant;
  }
}
