import React, { useState } from 'react';
import { 
  useSessionStories, 
  useRemoveStoryFromSession, 
  useUpdateSessionStory, 
  useAddProductBoardFeatureToSession,
  useUpdateDiscussionPoints,
  useUpdateDecisions,
  useUpdateQuestions
} from '../../../hooks/useSessionStories';
import { SessionStoryList } from '../../../../grooming/SessionStoryList';
import { ProductBoardStorySelector } from '../../../../grooming/ProductBoardStorySelector';
import { GroomingStoryDetail } from '../../../../grooming/GroomingStoryDetail';
import { StorySplittingModal } from '../../../../grooming/StorySplittingModal';
import { toast } from '../../../../grooming/lib/sonner';
import { GroomingStory, SessionStory } from '../../../types/grooming';

interface StoriesTabProps {
  sessionId: string;
  sessionStatus: 'planned' | 'in_progress' | 'completed';
  onSessionUpdated: () => void;
}

export const StoriesTab: React.FC<StoriesTabProps> = ({
  sessionId,
  sessionStatus,
  onSessionUpdated
}) => {
  // State for modals
  const [isAddStoryModalOpen, setIsAddStoryModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [storyToSplit, setStoryToSplit] = useState<any | null>(null);
  
  // Fetch session stories
  const { 
    data: sessionStories = [], 
    isLoading, 
    error,
    refetch: refetchStories
  } = useSessionStories(sessionId);
  
  // Mutations
  const removeStoryMutation = useRemoveStoryFromSession();
  const updateStoryMutation = useUpdateSessionStory();
  const updateDiscussionPointsMutation = useUpdateDiscussionPoints();
  const updateDecisionsMutation = useUpdateDecisions();
  const updateQuestionsMutation = useUpdateQuestions();
  const { addFeatureToSession, isLoading: isAddingFeature } = useAddProductBoardFeatureToSession(sessionId);
  
  // Handle adding a story to the session
  const handleAddStoryClick = () => {
    setIsAddStoryModalOpen(true);
  };
  
  // Handle removing a story from the session
  const handleRemoveStory = async (sessionStoryId: string) => {
    try {
      await removeStoryMutation.mutateAsync(sessionStoryId);
      toast.success('Story removed from session');
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing story from session:', error);
      toast.error('Failed to remove story from session');
      return Promise.reject(error);
    }
  };
  
  // Handle reordering a story in the session
  const handleReorderStory = async (sessionStoryId: string, newOrder: number) => {
    try {
      await updateStoryMutation.mutateAsync({
        id: sessionStoryId,
        // Use discussion_notes as a workaround since discussion_order doesn't exist in the type
        // In a real implementation, the API would support updating the order
        discussion_notes: `Order: ${newOrder}`
      });
      return Promise.resolve();
    } catch (error) {
      console.error('Error reordering story:', error);
      toast.error('Failed to reorder story');
      return Promise.reject(error);
    }
  };
  
  // Handle clicking on a story to view details
  const handleStoryClick = (sessionStory: any) => {
    setSelectedStory(sessionStory);
  };
  
  // Handle splitting a story
  const handleSplitStory = (sessionStory: any) => {
    setStoryToSplit(sessionStory);
  };
  
  // Handle adding a ProductBoard feature to the session
  const handleAddFeature = async (feature: any) => {
    try {
      await addFeatureToSession(feature);
      refetchStories();
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding feature to session:', error);
      toast.error('Failed to add feature to session');
      return Promise.reject(error);
    }
  };
  
  // Handle updating discussion points
  const handleUpdateDiscussionPoints = async (points: string[]) => {
    if (!selectedStory) return Promise.reject('No story selected');
    
    try {
      await updateDiscussionPointsMutation.mutateAsync({
        id: selectedStory.id,
        points
      });
      toast.success('Discussion points updated');
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating discussion points:', error);
      toast.error('Failed to update discussion points');
      return Promise.reject(error);
    }
  };
  
  // Handle updating decisions
  const handleUpdateDecisions = async (decisions: string[]) => {
    if (!selectedStory) return Promise.reject('No story selected');
    
    try {
      await updateDecisionsMutation.mutateAsync({
        id: selectedStory.id,
        decisions
      });
      toast.success('Decisions updated');
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating decisions:', error);
      toast.error('Failed to update decisions');
      return Promise.reject(error);
    }
  };
  
  // Handle updating questions
  const handleUpdateQuestions = async (questions: string[]) => {
    if (!selectedStory) return Promise.reject('No story selected');
    
    try {
      await updateQuestionsMutation.mutateAsync({
        id: selectedStory.id,
        questions
      });
      toast.success('Questions updated');
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating questions:', error);
      toast.error('Failed to update questions');
      return Promise.reject(error);
    }
  };
  
  // Handle story detail close
  const handleStoryDetailClose = () => {
    setSelectedStory(null);
    refetchStories();
  };
  
  // Handle story split completion
  const handleStorySplitComplete = () => {
    setStoryToSplit(null);
    refetchStories();
    onSessionUpdated();
  };
  
  // Convert a story to GroomingStory type for the StorySplittingModal
  const convertToGroomingStory = (story: any): GroomingStory => {
    return {
      id: story.id,
      session_id: sessionId,
      story_id: story.id,
      title: story.pb_title || story.title,
      description: story.description,
      status: story.status || 'pending',
      complexity_rating: story.complexity_rating,
      risk_rating: story.risk_rating,
      discussion_duration_minutes: story.discussion_duration_minutes,
      discussion_notes: story.discussion_notes,
      acceptance_criteria: story.acceptance_criteria?.map((text: string, index: number) => ({
        id: `criterion-${index}`,
        description: text,
        status: 'pending'
      })) || [],
      story_points: story.story_points,
      complexity: story.complexity || 2, // Default to medium (2) if not provided
      pb_feature_id: story.pb_feature_id,
      created_at: story.created_at || new Date().toISOString(),
      updated_at: story.updated_at || new Date().toISOString()
    };
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading session stories</p>
      </div>
    );
  }
  
  // Filter out any session stories that don't have a story property
  const validSessionStories = sessionStories.filter((story): story is SessionStory & { story: GroomingStory } => 
    story !== null && typeof story === 'object' && 'story' in story && story.story !== null
  );

  return (
    <>
      <SessionStoryList
        sessionStories={validSessionStories}
        onAddStoryClick={handleAddStoryClick}
        onRemoveStory={handleRemoveStory}
        onReorderStory={handleReorderStory}
        onStoryClick={handleStoryClick}
        onSplitStory={handleSplitStory}
        sessionStatus={sessionStatus}
      />
      
      {/* Add Story Modal */}
      {isAddStoryModalOpen && (
        <ProductBoardStorySelector
          sessionId={sessionId}
          onAddFeature={handleAddFeature}
          onClose={() => setIsAddStoryModalOpen(false)}
        />
      )}
      
      {/* Story Detail Modal */}
      {selectedStory && (
        <GroomingStoryDetail
          sessionStory={selectedStory}
          onClose={handleStoryDetailClose}
          onUpdateStatus={async () => Promise.resolve()} // Mock implementation
          onAddDiscussionPoint={async () => Promise.resolve()} // Mock implementation
          onUpdateDiscussionPoints={handleUpdateDiscussionPoints}
          onAddDecision={async () => Promise.resolve()} // Mock implementation
          onUpdateDecisions={handleUpdateDecisions}
          onAddQuestion={async () => Promise.resolve()} // Mock implementation
          onUpdateQuestions={handleUpdateQuestions}
          onUpdateTechnicalNotes={async () => Promise.resolve()} // Mock implementation
          onUpdateRiskRating={async () => Promise.resolve()} // Mock implementation
          onUpdateComplexityRating={async () => Promise.resolve()} // Mock implementation
          sessionStatus={sessionStatus}
          onStorySplit={() => {}} // Mock implementation
        />
      )}
      
      {/* Story Splitting Modal */}
      {storyToSplit && (
        <StorySplittingModal
          originalStory={convertToGroomingStory(storyToSplit.story)}
          onClose={() => setStoryToSplit(null)}
          onSuccess={handleStorySplitComplete}
        />
      )}
    </>
  );
};
