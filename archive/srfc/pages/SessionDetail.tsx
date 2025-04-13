import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { toast } from 'sonner';
import { ProductBoardClient } from '../lib/api/productboard';
import type { Configuration } from '../types/database';
import { SessionDetailHeader } from '../components/grooming/SessionDetailHeader';
import { SessionStatusToggle } from '../components/grooming/SessionStatusToggle';
import { SessionParticipantList } from '../components/grooming/SessionParticipantList';
import { SessionActionItems } from '../components/grooming/SessionActionItems';
import { SessionStoryList } from '../components/grooming/SessionStoryList';
import { StorySelector } from '../components/grooming/StorySelector';
import { StoryDiscussionCard } from '../components/grooming/StoryDiscussionCard';
import { TranscriptUploadModal } from '../components/grooming/TranscriptUploadModal';
import type { GroomingSession, GroomingSessionParticipant, GroomingSessionStory, Story } from '../types/database';
import type { ProductBoardFeature } from '../lib/api/productboard';

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { db } = useDatabase();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<GroomingSession | null>(null);
  const [sessionStories, setSessionStories] = useState<(GroomingSessionStory & { story: Story })[]>([]);
  const [participants, setParticipants] = useState<GroomingSessionParticipant[]>([]);
  const [config, setConfig] = useState<Configuration | null>(null);
  
  const [showStorySelector, setShowStorySelector] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<(GroomingSessionStory & { story: Story }) | null>(null);
  
  // Load session data and configuration
  useEffect(() => {
    if (!sessionId || !db || !currentWorkspace) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Load session
        const sessionData = await db.groomingSessions.getById(sessionId);
        if (!sessionData) {
          toast.error('Session not found');
          navigate('/grooming-sessions');
          return;
        }
        setSession(sessionData);
        
        // Load session stories with their story data
        const storiesData = await db.groomingSessions.getSessionStories(sessionId);
        setSessionStories(storiesData);
        
        // Load participants
        const participantsData = await db.groomingSessions.getSessionParticipants(sessionId);
        setParticipants(participantsData);
        
        // Load configuration
        const configData = await db.configurations.getByWorkspace(currentWorkspace.id);
        setConfig(configData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [sessionId, db, currentWorkspace, navigate]);
  
  // Session status management
  const handleStatusChange = async (newStatus: 'planned' | 'in_progress' | 'completed') => {
    if (!session || !db) return;
    
    try {
      const updates: Partial<GroomingSession> = { status: newStatus };
      
      // If starting session, record start time
      if (newStatus === 'in_progress' && session.status === 'planned') {
        updates.start_time = new Date().toISOString();
      }
      
      // If completing session, record end time and update metrics
      if (newStatus === 'completed' && session.status === 'in_progress') {
        updates.end_time = new Date().toISOString();
        
        // Calculate metrics
        const storiesDiscussed = sessionStories.length;
        const storiesCompleted = sessionStories.filter(s => s.status === 'discussed').length;
        const storiesDeferred = sessionStories.filter(s => s.status === 'deferred').length;
        const storiesSplit = sessionStories.filter(s => s.status === 'split').length;
        
        updates.stories_discussed = storiesDiscussed;
        updates.stories_completed = storiesCompleted;
        updates.stories_deferred = storiesDeferred;
        updates.stories_split = storiesSplit;
      }
      
      if (sessionId) {
        await db.groomingSessions.update(sessionId, updates);
      }
      
      // Update local state
      setSession(prev => prev ? { ...prev, ...updates } : null);
      
      toast.success(`Session ${newStatus === 'in_progress' ? 'started' : newStatus === 'completed' ? 'completed' : 'updated'}`);
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error('Failed to update session status');
    }
  };
  
  // Participant management
  const handleAddParticipant = async (participant: Partial<GroomingSessionParticipant>) => {
    if (!db || !sessionId) return;
    
    try {
      const newParticipant = await db.groomingSessions.addParticipant(sessionId, participant);
      setParticipants(prev => [...prev, newParticipant]);
      toast.success('Participant added');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
      throw error;
    }
  };
  
  const handleRemoveParticipant = async (participantId: string) => {
    if (!db) return;
    
    try {
      await db.groomingSessions.removeParticipant(participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      toast.success('Participant removed');
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error('Failed to remove participant');
      throw error;
    }
  };
  
  const handleUpdateParticipant = async (participantId: string, data: Partial<GroomingSessionParticipant>) => {
    if (!db) return;
    
    try {
      await db.groomingSessions.updateParticipant(participantId, data);
      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, ...data } : p)
      );
      toast.success('Participant updated');
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Failed to update participant');
      throw error;
    }
  };
  
  // Action items management
  const handleUpdateActionItems = async (actionItems: any[]) => {
    if (!db || !sessionId || !session) return;
    
    try {
      await db.groomingSessions.update(sessionId, { action_items: actionItems });
      setSession(prev => prev ? { ...prev, action_items: actionItems } : null);
      toast.success('Action items updated');
    } catch (error) {
      console.error('Error updating action items:', error);
      toast.error('Failed to update action items');
      throw error;
    }
  };
  
  // Story management
  const handleAddStory = async (story: Story) => {
    if (!db || !sessionId) return;
    
    try {
      console.log('Adding story to session:', story);
      
      // Check if the story exists in the database
      let storyId = story.id;
      let existingStory: Story | null = null;
      
      try {
        existingStory = await db.stories.getById(storyId);
      } catch (error) {
        console.log('Error checking if story exists:', error);
      }
      
      // If the story is from ProductBoard and doesn't exist in the database yet, create it
      if (!existingStory) {
        console.log('Story not found in database, creating it first:', storyId);
        
        try {
          // Create the story in the database first
          const newStory = await db.stories.create(story);
          storyId = newStory.id;
          console.log('Created new story with ID:', storyId);
        } catch (createError) {
          console.error('Error creating story:', createError);
          throw createError;
        }
      }
      
      // Now add the story to the session
      const newSessionStory = await db.groomingSessions.addStoryToSession(sessionId, storyId);
      
      // Fetch the full story data to include with the session story
      const updatedSessionStories = await db.groomingSessions.getSessionStories(sessionId);
      setSessionStories(updatedSessionStories);
      
      toast.success('Story added to session');
    } catch (error) {
      console.error('Error adding story to session:', error);
      toast.error(`Failed to add story to session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  const handleRemoveStory = async (sessionStoryId: string) => {
    if (!db) return;
    
    try {
      await db.groomingSessions.removeStoryFromSession(sessionStoryId);
      setSessionStories(prev => prev.filter(ss => ss.id !== sessionStoryId));
      toast.success('Story removed from session');
    } catch (error) {
      console.error('Error removing story from session:', error);
      toast.error('Failed to remove story from session');
      throw error;
    }
  };
  
  const handleReorderStory = async (sessionStoryId: string, newOrder: number) => {
    if (!db) return;
    
    try {
      await db.groomingSessions.updateSessionStory(sessionStoryId, { discussion_order: newOrder });
      
      // Update local state
      setSessionStories(prev => 
        prev.map(ss => {
          if (ss.id === sessionStoryId) {
            return { ...ss, discussion_order: newOrder };
          }
          // If this story has the target order, swap its order
          if (ss.discussion_order === newOrder) {
            const targetStory = prev.find(s => s.id === sessionStoryId);
            return { ...ss, discussion_order: targetStory?.discussion_order ?? null };
          }
          return ss;
        })
      );
    } catch (error) {
      console.error('Error reordering story:', error);
      toast.error('Failed to reorder story');
      throw error;
    }
  };
  
  // Story discussion management
  const handleUpdateStoryStatus = async (status: 'pending' | 'discussed' | 'deferred' | 'split' | 'rejected') => {
    if (!db || !selectedStory) return;
    
    try {
      await db.groomingSessions.updateSessionStory(selectedStory.id, { status });
      
      // Update local state
      setSessionStories(prev => 
        prev.map(ss => ss.id === selectedStory.id ? { ...ss, status } : ss)
      );
      
      // Also update the selected story if it's open
      setSelectedStory(prev => prev ? { ...prev, status } : null);
      
      toast.success(`Story marked as ${status}`);
    } catch (error) {
      console.error('Error updating story status:', error);
      toast.error('Failed to update story status');
      throw error;
    }
  };
  
  const handleAddDiscussionPoint = async (point: string) => {
    if (!db || !selectedStory) return;
    
    try {
      const updatedPoints = [...(selectedStory.discussion_points || []), point];
      await db.groomingSessions.updateSessionStory(selectedStory.id, { discussion_points: updatedPoints });
      
      // Update local state
      setSessionStories(prev => 
        prev.map(ss => ss.id === selectedStory.id ? { ...ss, discussion_points: updatedPoints } : ss)
      );
      
      // Also update the selected story if it's open
      setSelectedStory(prev => prev ? { ...prev, discussion_points: updatedPoints } : null);
    } catch (error) {
      console.error('Error adding discussion point:', error);
      toast.error('Failed to add discussion point');
      throw error;
    }
  };
  
  const handleAddDecision = async (decision: string) => {
    if (!db || !selectedStory) return;
    
    try {
      const updatedDecisions = [...(selectedStory.decisions || []), decision];
      await db.groomingSessions.updateSessionStory(selectedStory.id, { decisions: updatedDecisions });
      
      // Update local state
      setSessionStories(prev => 
        prev.map(ss => ss.id === selectedStory.id ? { ...ss, decisions: updatedDecisions } : ss)
      );
      
      // Also update the selected story if it's open
      setSelectedStory(prev => prev ? { ...prev, decisions: updatedDecisions } : null);
    } catch (error) {
      console.error('Error adding decision:', error);
      toast.error('Failed to add decision');
      throw error;
    }
  };
  
  const handleAddQuestion = async (question: string) => {
    if (!db || !selectedStory) return;
    
    try {
      const updatedQuestions = [...(selectedStory.questions || []), question];
      await db.groomingSessions.updateSessionStory(selectedStory.id, { questions: updatedQuestions });
      
      // Update local state
      setSessionStories(prev => 
        prev.map(ss => ss.id === selectedStory.id ? { ...ss, questions: updatedQuestions } : ss)
      );
      
      // Also update the selected story if it's open
      setSelectedStory(prev => prev ? { ...prev, questions: updatedQuestions } : null);
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
      throw error;
    }
  };
  
  const handleUpdateTechnicalNotes = async (notes: string) => {
    if (!db || !selectedStory) return;
    
    try {
      await db.groomingSessions.updateSessionStory(selectedStory.id, { technical_notes: notes });
      
      // Update local state
      setSessionStories(prev => 
        prev.map(ss => ss.id === selectedStory.id ? { ...ss, technical_notes: notes } : ss)
      );
      
      // Also update the selected story if it's open
      setSelectedStory(prev => prev ? { ...prev, technical_notes: notes } : null);
    } catch (error) {
      console.error('Error updating technical notes:', error);
      toast.error('Failed to update technical notes');
      throw error;
    }
  };
  
  const handleUpdateRiskRating = async (rating: number) => {
    if (!db || !selectedStory) return;
    
    try {
      await db.groomingSessions.updateSessionStory(selectedStory.id, { risk_rating: rating });
      
      // Update local state
      setSessionStories(prev => 
        prev.map(ss => ss.id === selectedStory.id ? { ...ss, risk_rating: rating } : ss)
      );
      
      // Also update the selected story if it's open
      setSelectedStory(prev => prev ? { ...prev, risk_rating: rating } : null);
    } catch (error) {
      console.error('Error updating risk rating:', error);
      toast.error('Failed to update risk rating');
      throw error;
    }
  };
  
  const handleUpdateComplexityRating = async (rating: number) => {
    if (!db || !selectedStory) return;
    
    try {
      await db.groomingSessions.updateSessionStory(selectedStory.id, { complexity_rating: rating });
      
      // Update local state
      setSessionStories(prev => 
        prev.map(ss => ss.id === selectedStory.id ? { ...ss, complexity_rating: rating } : ss)
      );
      
      // Also update the selected story if it's open
      setSelectedStory(prev => prev ? { ...prev, complexity_rating: rating } : null);
    } catch (error) {
      console.error('Error updating complexity rating:', error);
      toast.error('Failed to update complexity rating');
      throw error;
    }
  };
  
  const handleSplitStory = () => {
    if (!selectedStory) return;
    
    // TODO: Implement story splitting functionality
    // This would typically open a modal to create new stories from the selected one
    toast.info('Story splitting functionality coming soon');
  };
  
  // Transcript upload handling
  const handleTranscriptUploaded = async () => {
    if (!sessionId || !db) return;
    
    try {
      // Reload session data after transcript is processed
      const sessionData = await db.groomingSessions.getById(sessionId);
      if (sessionData) {
        setSession(sessionData);
      }
      
      // Reload session stories
      const storiesData = await db.groomingSessions.getSessionStories(sessionId);
      setSessionStories(storiesData);
      
      toast.success('Transcript processed successfully');
    } catch (error) {
      console.error('Error reloading session data after transcript upload:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-lg font-medium text-gray-900">Session not found</h3>
        <p className="mt-1 text-gray-500">The session you're looking for doesn't exist or you don't have access to it.</p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/grooming-sessions')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Session header */}
      <SessionDetailHeader 
        session={session}
        onEdit={() => toast.info('Edit functionality coming soon')}
        onDelete={() => toast.info('Delete functionality coming soon')}
        onRefresh={() => window.location.reload()}
      />
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session status */}
          <SessionStatusToggle 
            session={session}
            onStatusChange={handleStatusChange}
          />
          
          {/* Stories list */}
          <SessionStoryList 
            sessionStories={sessionStories}
            onAddStoryClick={() => setShowStorySelector(true)}
            onRemoveStory={handleRemoveStory}
            onReorderStory={handleReorderStory}
            onStoryClick={(story) => setSelectedStory(story)}
            onSplitStory={(story) => {
              setSelectedStory(story);
              handleSplitStory();
            }}
            sessionStatus={session.status}
          />
          
          {/* Action items */}
          <SessionActionItems 
            session={session}
            onUpdateActionItems={handleUpdateActionItems}
            disabled={session.status === 'completed'}
          />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          {/* Participants */}
          <SessionParticipantList 
            participants={participants}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            disabled={session.status === 'completed'}
          />
          
          {/* Transcript upload button */}
          {session.status === 'completed' && !session.transcript && (
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Transcript</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a transcript of this session to automatically extract discussion points, decisions, and action items.
              </p>
              <button
                onClick={() => setShowTranscriptModal(true)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Upload Transcript
              </button>
            </div>
          )}
          
          {/* Session summary */}
          {session.summary && (
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Session Summary</h3>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{session.summary}</p>
            </div>
          )}
          
          {/* Next steps */}
          {session.next_steps && (
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Next Steps</h3>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{session.next_steps}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {showStorySelector && sessionId && currentWorkspace && (
        <StorySelector 
          workspaceId={currentWorkspace.id}
          sessionId={sessionId}
          existingSessionStories={sessionStories}
          onAddStory={handleAddStory}
          onClose={() => setShowStorySelector(false)}
          getStoriesForWorkspace={async (workspaceId) => {
            try {
              console.log('Getting stories for workspace:', workspaceId);
              console.log('Config:', config ? 'Available' : 'Not available');
              console.log('ProductBoard API key:', config?.productboard_api_key ? 'Available' : 'Not available');
              
              if (config?.productboard_api_key) {
                console.log('Using ProductBoard API to fetch stories');
                // Create a ProductBoard client using the API key from the configuration
                const pbClient = new ProductBoardClient(config.productboard_api_key);
                
                // Test connection to ProductBoard
                const connectionTest = await pbClient.testConnection();
                console.log('ProductBoard connection test:', connectionTest ? 'Success' : 'Failed');
                
                if (!connectionTest) {
                  throw new Error('Failed to connect to ProductBoard API');
                }
                
                // Fetch features from ProductBoard
                console.log('Fetching features from ProductBoard');
                const features = await pbClient.getFeatures();
                console.log('Features fetched:', features.length);
                
                // Convert ProductBoard features to the Story format expected by the component
                const stories = features.map((feature: ProductBoardFeature) => {
                  console.log('Processing feature:', feature.id, feature.name);
                  
                  // Determine the level based on feature.parent
                  let level: 'story' | 'feature' | 'epic' | undefined;
                  if (feature.parent) {
                    level = 'story';
                  } else {
                    level = 'feature';
                  }
                  
                  // Map ProductBoard status to a valid database status
                  let validStatus = 'open'; // Default to 'open'
                  
                  // Map ProductBoard status to our valid statuses
                  if (feature.status) {
                    const pbStatus = feature.status.toLowerCase();
                    if (pbStatus.includes('done') || pbStatus.includes('complete')) {
                      validStatus = 'done';
                    } else if (pbStatus.includes('progress') || pbStatus.includes('working')) {
                      validStatus = 'in_progress';
                    } else if (pbStatus.includes('archive')) {
                      validStatus = 'archived';
                    } else if (pbStatus.includes('draft')) {
                      validStatus = 'draft';
                    }
                    // Otherwise keep the default 'open'
                  }
                  
                  console.log(`Mapping ProductBoard status "${feature.status}" to "${validStatus}"`);
                  
                  return {
                    id: feature.id,
                    workspace_id: workspaceId,
                    pb_id: feature.id,
                    pb_title: feature.name,
                    ado_id: null,
                    ado_title: null,
                    description: feature.description || null,
                    status: validStatus, // Use our mapped valid status
                    story_points: null,
                    completion_percentage: 0,
                    sync_status: 'synced',
                    needs_split: false,
                    rice_score: null,
                    sprintable: null,
                    completeness_score: null,
                    notes: null,
                    created_at: feature.created_at || new Date().toISOString(),
                    updated_at: feature.updated_at || new Date().toISOString(),
                    level,
                    parent_id: feature.parent?.id || undefined,
                  } as Story; // Cast to Story type to ensure compatibility
                });
                
                console.log('Converted stories:', stories.length);
                return stories;
              } else {
                // Fallback to using the database if no ProductBoard API key is available
                console.log('No ProductBoard API key found, falling back to database');
                const stories = await db!.stories.getAll(workspaceId);
                console.log('Stories from database:', stories.length);
                return stories;
              }
            } catch (error) {
              console.error('Error fetching stories:', error);
              toast.error(`Failed to fetch stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
              
              // Fallback to using the database if there's an error with ProductBoard
              console.log('Error with ProductBoard API, falling back to database');
              try {
                const stories = await db!.stories.getAll(workspaceId);
                console.log('Stories from database (fallback):', stories.length);
                return stories;
              } catch (dbError) {
                console.error('Error fetching stories from database:', dbError);
                toast.error('Failed to fetch stories from database');
                return [];
              }
            }
          }}
        />
      )}
      
      {selectedStory && (
        <StoryDiscussionCard 
          sessionStory={selectedStory}
          onClose={() => setSelectedStory(null)}
          onUpdateStatus={handleUpdateStoryStatus}
          onAddDiscussionPoint={handleAddDiscussionPoint}
          onAddDecision={handleAddDecision}
          onAddQuestion={handleAddQuestion}
          onUpdateTechnicalNotes={handleUpdateTechnicalNotes}
          onUpdateRiskRating={handleUpdateRiskRating}
          onUpdateComplexityRating={handleUpdateComplexityRating}
          onSplitStory={handleSplitStory}
          sessionStatus={session.status}
        />
      )}
      
      {showTranscriptModal && (
        <TranscriptUploadModal 
          session={session}
          onClose={() => setShowTranscriptModal(false)}
          onUploaded={handleTranscriptUploaded}
        />
      )}
    </div>
  );
}
