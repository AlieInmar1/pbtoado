import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Story, TeamReference, ProductReference, StoryReference, UserReference } from '../../../types/story-creator';
import { MainInfoSection } from './sections/MainInfoSection';
import { RICEScoringSection } from './sections/RICEScoringSection';
import { ClassificationSection } from './sections/ClassificationSection';
import { DetailedContentSection } from './sections/DetailedContentSection';
import { PlanningSection } from './sections/PlanningSection';
import { StorySubmissionStatus } from './StorySubmissionStatus';
import { supabase } from '../../../lib/supabase';
import { useUsers } from '../../../hooks/useUsers';
import { useProducts } from '../../../hooks/useProducts';
import { useFeatures } from '../../../hooks/useFeatures';

// Steps for the wizard
enum WizardStep {
  BasicInfo = 0,
  Classification = 1,
  DetailedContent = 2,
  RICEScoring = 3,
  Planning = 4,
  Review = 5
}

interface StoryCreatorWizardProps {
  initialStory: Partial<Story>;
  isEdit: boolean;
}

/**
 * StoryCreatorWizard is a multi-step form process for creating or editing stories.
 * It guides users through filling out all necessary information for a complete story.
 */
export const StoryCreatorWizard: React.FC<StoryCreatorWizardProps> = ({
  initialStory,
  isEdit
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.BasicInfo);
  
  // Debug logging for initialStory
  console.log("StoryCreatorWizard received initialStory:", initialStory);
  
  const [story, setStory] = useState<Partial<Story>>(initialStory || {});
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | undefined>(undefined);
  
  // Effect to log story state updates
  useEffect(() => {
    console.log("StoryCreatorWizard story state updated:", story);
  }, [story]);
  
  // Fetch data for dropdowns
  const { users = [], isLoading: usersLoading } = useUsers();
  const { products = [], isLoading: productsLoading } = useProducts();
  const { features = [], isLoading: featuresLoading } = useFeatures();
  
  // Convert features to references for dependencies
  const dependencies: StoryReference[] = features.map((feature: any) => ({
    id: feature.id,
    title: feature.title,
    type: 'feature'
  }));
  
  // Update story field
  const handleFieldChange = useCallback((field: keyof Story, value: any) => {
    setStory(prevStory => ({
      ...prevStory,
      [field]: value
    }));
  }, []);
  
  // Go to next step
  const handleNext = () => {
    if (currentStep < WizardStep.Review) {
      setCurrentStep(prevStep => (prevStep + 1) as WizardStep);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };
  
  // Go to previous step
  const handlePrevious = () => {
    if (currentStep > WizardStep.BasicInfo) {
      setCurrentStep(prevStep => (prevStep - 1) as WizardStep);
      window.scrollTo(0, 0);
    }
  };
  
  // Submit the story
  const handleSubmit = async () => {
    setSubmissionStatus('loading');
    setError(undefined);
    
    try {
      // Add timestamp
      const now = new Date().toISOString();
      
      // Create a copy of story data without rice_score since it's a generated column
      const { rice_score, ...storyDataWithoutRiceScore } = story;
      
      const storyData = {
        ...storyDataWithoutRiceScore,
        updated_at: now
      };
      
      if (!isEdit) {
        // Creating a new story
        storyData.created_at = now;
      }
      
      // Save to database
      let result;
      if (isEdit && story.id) {
        // Update existing story
        result = await supabase
          .from('stories')
          .update(storyData)
          .eq('id', story.id)
          .select()
          .single();
      } else {
        // Insert new story
        result = await supabase
          .from('stories')
          .insert(storyData)
          .select()
          .single();
      }
      
      // Handle result
      if (result.error) {
        throw result.error;
      }
      
      // Success!
      setStory(result.data);
      setSubmissionStatus('success');
      
      // If there's a ProductBoard integration configured, sync the story
      if (story.sync_with_productboard) {
        try {
          // Import the service here to avoid circular dependencies
          const { pushStoryToProductBoard } = await import('../../../lib/api/productBoardService');
          
          // Ensure the story has a valid ID before pushing to ProductBoard
          if (result.data && result.data.id) {
            const pbResult = await pushStoryToProductBoard(result.data as Story);
            
            if (!pbResult.success) {
              console.error('Error syncing with ProductBoard:', pbResult.message);
            } else {
              console.log('Successfully synced with ProductBoard', pbResult);
            }
          } else {
            console.error('Cannot sync with ProductBoard: Story ID is missing');
          }
        } catch (pbError) {
          console.error('Failed to sync with ProductBoard:', pbError);
          // Don't throw here - we still want to show success for the database save
        }
      }
      
    } catch (err: any) {
      console.error('Error saving story:', err);
      setError(err.message || 'An error occurred while saving the story');
      setSubmissionStatus('error');
    }
  };
  
  // Cancel and go back to stories list
  const handleCancel = () => {
    navigate('/stories');
  };
  
  // Get step completion status
  const isStepComplete = (step: WizardStep): boolean => {
    switch (step) {
      case WizardStep.BasicInfo:
        return !!story.title && !!story.description;
      case WizardStep.Classification:
        return true; // Optional section
      case WizardStep.DetailedContent:
        return true; // Optional section
      case WizardStep.RICEScoring:
        return story.reach_score !== undefined && 
               story.impact_score !== undefined &&
               story.confidence_score !== undefined &&
               story.effort_score !== undefined;
      case WizardStep.Planning:
        return true; // Optional section
      default:
        return true;
    }
  };
  
  // Get step display name
  const getStepName = (step: WizardStep): string => {
    switch (step) {
      case WizardStep.BasicInfo:
        return 'Basic Information';
      case WizardStep.Classification:
        return 'Classification';
      case WizardStep.DetailedContent:
        return 'Content & Requirements';
      case WizardStep.RICEScoring:
        return 'RICE Scoring';
      case WizardStep.Planning:
        return 'Planning';
      case WizardStep.Review:
        return 'Review & Submit';
      default:
        return '';
    }
  };
  
  // If submission is success or error, show status
  if (submissionStatus === 'success' || submissionStatus === 'error') {
    return (
      <StorySubmissionStatus
        status={submissionStatus}
        story={story as Story}
        error={error}
        onRetry={() => setSubmissionStatus('idle')}
      />
    );
  }
  
  // Data is loading
  if (usersLoading || productsLoading || featuresLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner h-10 w-10 border-4 border-blue-500 border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }
  
  // Progress bar calculation
  const progressPercentage = (currentStep / WizardStep.Review) * 100;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header with steps */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {isEdit ? 'Edit Story' : 'Create New Story'}
          </h1>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Steps */}
          <div className="flex justify-between mt-2 overflow-x-auto">
            {Object.values(WizardStep)
              .filter(step => typeof step === 'number')
              .map(step => (
                <button
                  key={step}
                  type="button"
                  onClick={() => Number(step) <= currentStep && setCurrentStep(Number(step) as WizardStep)}
                  disabled={Number(step) > currentStep}
                  className={`text-xs font-medium transition-colors duration-200 px-2 py-1 rounded ${
                    Number(step) === currentStep
                      ? 'text-blue-600 bg-blue-50'
                      : Number(step) < currentStep
                        ? 'text-gray-600 hover:text-blue-600'
                        : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {Number(step) + 1}. {getStepName(Number(step) as WizardStep)}
                </button>
              ))}
          </div>
        </div>
        
        {/* Main content */}
        <div className="p-6">
          {submissionStatus === 'loading' ? (
            <div className="flex justify-center items-center py-10">
              <div className="text-center">
                <div className="spinner h-12 w-12 border-4 border-blue-500 border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Saving story...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Step content */}
              <div className="mb-6">
                {currentStep === WizardStep.BasicInfo && (
                  <MainInfoSection
                    story={story}
                    onChange={handleFieldChange}
                    users={users}
                    teams={[]} // This would come from the team service
                  />
                )}
                
                {currentStep === WizardStep.Classification && (
                  <ClassificationSection
                    story={story}
                    onChange={handleFieldChange}
                    products={products.map((p: any) => ({
                      id: String(p.id),
                      name: p.name
                    })) as ProductReference[]}
                  />
                )}
                
                {currentStep === WizardStep.DetailedContent && (
                  <DetailedContentSection
                    story={story}
                    onChange={handleFieldChange}
                  />
                )}
                
                {currentStep === WizardStep.RICEScoring && (
                  <RICEScoringSection
                    story={story}
                    onChange={handleFieldChange}
                  />
                )}
                
                {currentStep === WizardStep.Planning && (
                  <PlanningSection
                    story={story}
                    onChange={handleFieldChange}
                    allStories={features.map((f: any) => ({ 
                      id: f.id, 
                      title: f.title || f.name || `Feature ${f.id}` 
                    })) as Partial<Story>[]}
                    dependencies={dependencies}
                  />
                )}
                
                {currentStep === WizardStep.Review && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Review Your Story</h2>
                      <p className="text-gray-500 text-sm">
                        Review the information below before submitting your story.
                      </p>
                    </div>
                    
                    {/* Basic info summary */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Title</div>
                          <div className="text-sm font-medium">{story.title || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Owner</div>
                          <div className="text-sm">{story.owner_name || 'Not assigned'}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-xs text-gray-500">Description</div>
                        <div className="text-sm whitespace-pre-wrap">{story.description || 'No description provided'}</div>
                      </div>
                    </div>
                    
                    {/* Classification summary */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Classification</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Investment Category</div>
                          <div className="text-sm">{story.investment_category || 'Not specified'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Commitment Status</div>
                          <div className="text-sm">{story.commitment_status || 'Not specified'}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* RICE summary */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">RICE Scoring</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Reach</div>
                          <div className="text-sm font-medium">{story.reach_score || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Impact</div>
                          <div className="text-sm font-medium">{story.impact_score || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Confidence</div>
                          <div className="text-sm font-medium">{story.confidence_score || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Effort</div>
                          <div className="text-sm font-medium">{story.effort_score || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">RICE Score</div>
                          <div className="text-lg font-bold text-blue-600">{story.rice_score || '-'}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Planning summary */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Planning</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Timeframe</div>
                          <div className="text-sm">{story.timeframe || 'Not specified'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">T-Shirt Size</div>
                          <div className="text-sm">{story.t_shirt_sizing || 'Not specified'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation buttons */}
              <div className="mt-8 flex justify-between">
                <div>
                  {currentStep > WizardStep.BasicInfo && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Previous
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepComplete(currentStep)}
                    className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      !isStepComplete(currentStep) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {currentStep < WizardStep.Review ? 'Next' : isEdit ? 'Save Changes' : 'Create Story'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
