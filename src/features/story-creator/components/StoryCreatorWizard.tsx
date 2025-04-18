import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { useStoryCreator } from '../../../hooks/useStoryCreator';
import { StoryTemplate, StoryContent, AIAnalysisResult, StoryCreationResult } from '../../../types/story-creator';
import { supabase } from '../../../lib/supabase';
import TemplateSelector from './TemplateSelector';
import StoryCreatorForm from './StoryCreatorForm';
import AIRecommendationPanel from './AIRecommendationPanel';
import StoryPreview from './StoryPreview';
import StorySubmissionStatus from './StorySubmissionStatus';

enum WizardStep {
  SelectTemplate = 0,
  EnterDetails = 1,
  ReviewAndSubmit = 2,
  Submitted = 3
}

interface StoryCreatorWizardProps {
  parentId?: string;
  onComplete?: (storyId: string) => void;
  onCancel?: () => void;
}

const StoryCreatorWizard: React.FC<StoryCreatorWizardProps> = ({
  parentId,
  onComplete,
  onCancel
}) => {
  const { currentWorkspace } = useWorkspace();
  const { 
    templates, 
    templatesLoading, 
    analyzeStory, 
    analyzing, 
    analysisResult,
    createStory,
    isCreatingStory,
    createStoryError
  } = useStoryCreator();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.SelectTemplate);
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFreehand, setIsFreehand] = useState<boolean>(false);
  
  // Default template for freehand stories
  const freehandTemplate: StoryTemplate = {
    id: 'freehand',
    name: 'Freehand Story',
    type: 'feature',
    description: 'Create a story from scratch without using a template',
    default_content: {
      title: '',
      description: '',
      acceptance_criteria: [],
      parent_feature_id: '',
      component_id: '',
      hierarchy_level: 'feature'
    },
    required_fields: ['title', 'hierarchy_level'],
    suggested_acceptance_criteria: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    workspace_id: currentWorkspace?.id || ''
  };
  
  // Initialize story content when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setStoryContent({
        ...selectedTemplate.default_content,
        parent_id: parentId
      });
    }
  }, [selectedTemplate, parentId]);
  
  // Handle template selection
  const handleTemplateSelect = (template: StoryTemplate) => {
    setSelectedTemplate(template);
    setIsFreehand(false);
    setCurrentStep(WizardStep.EnterDetails);
  };
  
  // Handle freehand selection
  const handleFreehandSelect = () => {
    setSelectedTemplate(freehandTemplate);
    setIsFreehand(true);
    setCurrentStep(WizardStep.EnterDetails);
  };
  
  // Handle content change
  const handleContentChange = (field: string, value: any) => {
    if (!storyContent) return;
    
    setStoryContent({
      ...storyContent,
      [field]: value
    });
  };
  
  // Handle AI analysis
  const handleAnalyze = async () => {
    if (!storyContent || !currentWorkspace) return;
    
    try {
      await analyzeStory({
        ...storyContent,
        parent_id: parentId,
        workspace_id: currentWorkspace.id
      });
    } catch (err) {
      setError('Failed to analyze story. Please try again.');
    }
  };
  
  // Apply AI suggestion
  const handleApplySuggestion = (field: string, value: any) => {
    handleContentChange(field, value);
  };
  
  // Move to next step
  const handleNext = () => {
    if (currentStep < WizardStep.Submitted) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Move to previous step
  const handleBack = () => {
    if (currentStep > WizardStep.SelectTemplate) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Submit story
  const handleSubmit = async () => {
    if (!storyContent || !selectedTemplate || !currentWorkspace) return;
    
    try {
      // For freehand stories, we create directly in the database
      if (isFreehand) {
        // Get the hierarchy level from the content
        const hierarchyLevel = storyContent.hierarchy_level || 'feature';
        
        // Get component ID for all hierarchy levels
        const componentId = storyContent.component_id || null;
        
        // Only stories have parent features
        let parentStoryId = null;
        if (hierarchyLevel === 'story') {
          parentStoryId = storyContent.parent_feature_id || null;
        }
        
        const { data, error: dbError } = await supabase
          .from('grooming_stories')
          .insert([{
            title: storyContent.title,
            description: storyContent.description || '',
            acceptance_criteria: storyContent.acceptance_criteria || [],
            parent_story_id: parentStoryId,
            component_id: componentId,
            workspace_id: currentWorkspace.id,
            status: 'new',
            complexity: storyContent.complexity || 1,
            story_type: hierarchyLevel // Use the hierarchy level as the story type
          }])
          .select()
          .single();
          
        if (dbError) {
          throw dbError;
        }
        
        setCreatedStoryId(data.id);
        setCurrentStep(WizardStep.Submitted);
        if (onComplete) {
          onComplete(data.id);
        }
      } else {
      // For template-based stories, use the existing API
      createStory({
        template_id: selectedTemplate.id,
        content: storyContent,
        parent_id: parentId,
        workspace_id: currentWorkspace.id
      }, {
        onSuccess: (result: StoryCreationResult) => {
          if (result.success) {
            setCreatedStoryId(result.story_id);
            setCurrentStep(WizardStep.Submitted);
            if (onComplete) {
              onComplete(result.story_id);
            }
          } else {
            setError(result.error || 'Failed to create story');
          }
        },
        onError: (err: Error) => {
          setError(err.message || 'Failed to create story');
        }
      });
      }
    } catch (err) {
      setError('An error occurred while creating the story');
      console.error('Error creating story:', err);
    }
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.SelectTemplate:
        return (
          <TemplateSelector
            templates={templates}
            isLoading={templatesLoading}
            onSelect={handleTemplateSelect}
            onFreehandSelect={handleFreehandSelect}
          />
        );
        
      case WizardStep.EnterDetails:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <StoryCreatorForm
                template={selectedTemplate}
                content={storyContent}
                onChange={handleContentChange}
                onAnalyze={handleAnalyze}
                isAnalyzing={analyzing}
              />
            </div>
            <div>
              <AIRecommendationPanel
                analysisResult={analysisResult}
                onApplySuggestion={handleApplySuggestion}
                isLoading={analyzing}
              />
            </div>
          </div>
        );
        
      case WizardStep.ReviewAndSubmit:
        return (
          <StoryPreview
            template={selectedTemplate}
            content={storyContent}
            analysisResult={analysisResult}
          />
        );
        
      case WizardStep.Submitted:
        return (
          <StorySubmissionStatus
            success={!!createdStoryId}
            storyId={createdStoryId}
            error={error}
          />
        );
        
      default:
        return null;
    }
  };
  
  // Render navigation buttons
  const renderNavigation = () => {
    if (currentStep === WizardStep.Submitted) {
      return (
        <div className="flex justify-end mt-6">
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      );
    }
    
    return (
      <div className="flex justify-between mt-6">
        <div>
          {currentStep > WizardStep.SelectTemplate && (
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={handleBack}
            >
              Back
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          
          {currentStep < WizardStep.ReviewAndSubmit ? (
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              onClick={handleNext}
              disabled={
                (currentStep === WizardStep.SelectTemplate && !selectedTemplate) ||
                (currentStep === WizardStep.EnterDetails && !storyContent)
              }
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={isCreatingStory}
            >
              {isCreatingStory ? 'Creating...' : 'Create Story'}
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Story</h2>
        <p className="text-gray-600">
          {currentStep === WizardStep.SelectTemplate && 'Select a template or create a freehand story'}
          {currentStep === WizardStep.EnterDetails && 'Fill in the details for your story'}
          {currentStep === WizardStep.ReviewAndSubmit && 'Review your story before submitting'}
          {currentStep === WizardStep.Submitted && 'Your story has been created'}
        </p>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center">
          {[
            'Select Template',
            'Enter Details',
            'Review & Submit',
            'Complete'
          ].map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? (
                    '✓'
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="ml-2">
                  <div className="text-sm font-medium text-gray-900">{step}</div>
                </div>
              </div>
              {index < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {renderStepContent()}
      {renderNavigation()}
    </div>
  );
};

export default StoryCreatorWizard;
