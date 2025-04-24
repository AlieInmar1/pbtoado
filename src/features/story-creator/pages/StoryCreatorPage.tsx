import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Story } from '../../../types/story-creator';
import { StoryCreatorWizard } from '../components/StoryCreatorWizard';
import { AIRecommendationPanel } from '../components/AIRecommendationPanel';

/**
 * StoryCreatorPage hosts the StoryCreatorWizard and handles loading 
 * existing stories for editing or creating new stories.
 */
export const StoryCreatorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  console.log("StoryCreatorPage initializing, location state:", location.state);
  console.log("Location object:", location);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize story from location state or empty object
  const initialStory = location.state?.initialStory || {};
  console.log("Initial story from location:", initialStory);
  
  const [story, setStory] = useState<Partial<Story>>(initialStory);
  const [showAIPanel, setShowAIPanel] = useState<boolean>(!!location.state?.fromIdeaGenerator);
  
  // Debug logs
  useEffect(() => {
    console.log("Story state initialized:", story);
    console.log("AI Panel visibility:", showAIPanel);
  }, [story, showAIPanel]);
  
  // Load existing story if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          setLoading(false);
          if (error) {
            console.error('Error loading story:', error);
            setError('Failed to load story. Please try again.');
          } else if (data) {
            setStory(data);
          }
        });
    }
  }, [id]);
  
  // Toggle AI recommendation panel
  const toggleAIPanel = () => {
    setShowAIPanel(prev => !prev);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner h-10 w-10 border-4 border-blue-500 border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/stories')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go back to Stories
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {/* Main content area */}
      <div className="px-4 py-8 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Story' : 'Create New Story'}
          </h1>
          <button
            type="button"
            onClick={toggleAIPanel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {showAIPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main wizard */}
          <div className={`${showAIPanel ? 'lg:w-2/3' : 'w-full'}`}>
            <StoryCreatorWizard 
              initialStory={story} 
              isEdit={!!id} 
            />
          </div>
          
          {/* AI panel - shown conditionally */}
          {showAIPanel && (
            <div className="lg:w-1/3">
              <AIRecommendationPanel 
                story={story}
                onSuggestionApply={(field, value) => {
                  setStory(prev => ({
                    ...prev,
                    [field]: value
                  }));
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
