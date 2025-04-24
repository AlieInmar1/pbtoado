import React, { useState } from 'react';
import { StoryDiscussionCard } from './StoryDiscussionCard';
import { StorySplittingModal } from './StorySplittingModal';
import { useSplitStory } from '../src/hooks/useGroomingStories';
import { toast } from 'sonner';
import type { GroomingStory, SessionStory as GroomingSessionStory } from '../src/types/grooming';

// Define the Story type based on what's used in StoryDiscussionCard
interface Story {
  id: string;
  pb_title: string;
  description?: string;
  acceptance_criteria?: string[];
  level?: string;
  status?: string;
  story_points?: number;
  complexity?: number;
  business_value?: number;
  parent_story_id?: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  pb_feature_id?: string;
  ado_work_item_id?: number;
}

// Define a custom type for the session story that matches what StoryDiscussionCard expects
interface CustomGroomingSessionStory {
  id: string;
  session_id: string;
  story_id: string;
  status: 'pending' | 'discussed' | 'deferred' | 'split' | 'rejected';
  discussion_order?: number;
  discussion_points?: string[];
  decisions?: string[];
  questions?: string[];
  technical_notes?: string;
  risk_rating?: number;
  complexity_rating?: number;
  story: Story;
}

interface GroomingStoryDetailProps {
  sessionStory: CustomGroomingSessionStory;
  onClose: () => void;
  onUpdateStatus: (status: 'pending' | 'discussed' | 'deferred' | 'split' | 'rejected') => Promise<void>;
  onAddDiscussionPoint: (point: string) => Promise<void>;
  onUpdateDiscussionPoints?: (points: string[]) => Promise<void>;
  onAddDecision: (decision: string) => Promise<void>;
  onUpdateDecisions?: (decisions: string[]) => Promise<void>;
  onAddQuestion: (question: string) => Promise<void>;
  onUpdateQuestions?: (questions: string[]) => Promise<void>;
  onUpdateTechnicalNotes: (notes: string) => Promise<void>;
  onUpdateRiskRating: (rating: number) => Promise<void>;
  onUpdateComplexityRating: (rating: number) => Promise<void>;
  sessionStatus: 'planned' | 'in_progress' | 'completed';
  onStorySplit: () => void; // Callback to refresh the session stories after a split
}

export function GroomingStoryDetail({
  sessionStory,
  onClose,
  onUpdateStatus,
  onAddDiscussionPoint,
  onUpdateDiscussionPoints,
  onAddDecision,
  onUpdateDecisions,
  onAddQuestion,
  onUpdateQuestions,
  onUpdateTechnicalNotes,
  onUpdateRiskRating,
  onUpdateComplexityRating,
  sessionStatus,
  onStorySplit
}: GroomingStoryDetailProps) {
  const [showSplitModal, setShowSplitModal] = useState(false);
  
  // Convert the Story type to GroomingStory type for the StorySplittingModal
  const convertToGroomingStory = (): GroomingStory => {
    return {
      id: sessionStory.story.id,
      title: sessionStory.story.pb_title,
      description: sessionStory.story.description,
      acceptance_criteria: sessionStory.story.acceptance_criteria?.map((text, index) => ({
        id: `criterion-${index}`,
        description: text,
        status: 'pending'
      })) || [],
      status: sessionStory.story.status as any,
      story_points: sessionStory.story.story_points,
      complexity: sessionStory.story.complexity || 2, // Default to medium (2) if not provided
      created_at: sessionStory.story.created_at,
      updated_at: sessionStory.story.updated_at,
      pb_feature_id: sessionStory.story.pb_feature_id,
      session_id: sessionStory.session_id,
      story_id: sessionStory.story_id
    };
  };

  const handleSplitStory = () => {
    setShowSplitModal(true);
  };

  const handleSplitSuccess = () => {
    // Update the session story status to 'split'
    onUpdateStatus('split')
      .then(() => {
        // Call the callback to refresh the session stories
        onStorySplit();
        // Close the split modal
        setShowSplitModal(false);
      })
      .catch((error) => {
        console.error('Error updating story status:', error);
        toast.error('Failed to update story status');
      });
  };

  return (
    <>
      <StoryDiscussionCard
        sessionStory={sessionStory}
        onClose={onClose}
        onUpdateStatus={onUpdateStatus}
        onAddDiscussionPoint={onAddDiscussionPoint}
        onUpdateDiscussionPoints={onUpdateDiscussionPoints}
        onAddDecision={onAddDecision}
        onUpdateDecisions={onUpdateDecisions}
        onAddQuestion={onAddQuestion}
        onUpdateQuestions={onUpdateQuestions}
        onUpdateTechnicalNotes={onUpdateTechnicalNotes}
        onUpdateRiskRating={onUpdateRiskRating}
        onUpdateComplexityRating={onUpdateComplexityRating}
        onSplitStory={handleSplitStory}
        sessionStatus={sessionStatus}
      />

      {showSplitModal && (
        <StorySplittingModal
          originalStory={convertToGroomingStory()}
          onClose={() => setShowSplitModal(false)}
          onSuccess={handleSplitSuccess}
        />
      )}
    </>
  );
}
