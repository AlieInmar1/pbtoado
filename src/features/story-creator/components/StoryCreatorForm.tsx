import React, { useState, useEffect } from 'react';
import { Story, TeamReference, UserReference, ProductReference } from '../../../types/story-creator';
import { MainInfoSection } from './sections/MainInfoSection';
import { RICEScoringSection } from './sections/RICEScoringSection';
import { ClassificationSection } from './sections/ClassificationSection';
import { PlanningSection } from './sections/PlanningSection';
import { DetailedContentSection } from './sections/DetailedContentSection';
import { pushStoryToProductBoard } from '../../../lib/api/productBoardService';
import { supabase } from '../../../lib/supabase';

interface StoryCreatorFormProps {
  initialStory?: Partial<Story>;
  onSave: (story: Story) => void;
  onCancel?: () => void;
}

/**
 * StoryCreatorForm is the main form component for creating or editing stories
 * with full ProductBoard field integration.
 * 
 * It provides a tabbed interface to organize the many input fields into logical sections.
 */
export const StoryCreatorForm: React.FC<StoryCreatorFormProps> = ({
  initialStory,
  onSave,
  onCancel
}) => {
  // Component state
  const [activeTab, setActiveTab] = useState<string>('main');
  const [story, setStory] = useState<Partial<Story>>(initialStory || {
    // Default values for a new story
    reach_score: 20, // Using standardized scoring with 20-point increments
    impact_score: 20, // Using standardized scoring with 20-point increments
    confidence_score: 40, // Using standardized scoring with 20-point increments
    effort_score: 0.5, // Starting with minimum person-months
    os_compatibility: 40, // Using standardized scoring with 20-point increments
    teams: [],
    tags: [],
    dependencies: [],
    product_line: [],
    products: []
  });
  
  // Data sources
  const [users, setUsers] = useState<UserReference[]>([]);
  const [teams, setTeams] = useState<TeamReference[]>([]);
  const [products, setProducts] = useState<ProductReference[]>([]);
  const [allStories, setAllStories] = useState<Partial<Story>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name');
        
        if (usersError) throw usersError;
        setUsers(usersData || []);
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name');
        
        if (teamsError) throw teamsError;
        setTeams(teamsData || []);
        
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name');
        
        if (productsError) throw productsError;
        setProducts(productsData || []);
        
        // Fetch all stories (for dependencies)
        const { data: storiesData, error: storiesError } = await supabase
          .from('stories')
          .select('id, title');
        
        if (storiesError) throw storiesError;
        setAllStories(storiesData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load required data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Field change handler
  const handleFieldChange = (field: keyof Story, value: any) => {
    setStory(prev => ({ ...prev, [field]: value }));
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!story.title || !story.description) {
      setActiveTab('main');
      setError('Title and description are required');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Save story to database
      let result: Story;
      
      if (story.id) {
        // Update existing story
        const { data, error } = await supabase
          .from('stories')
          .update({
            ...story,
            updated_at: new Date().toISOString()
          })
          .eq('id', story.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data as Story;
      } else {
        // Create new story
        const { data, error } = await supabase
          .from('stories')
          .insert({
            ...story,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data as Story;
      }
      
      // Sync with ProductBoard if needed
      if (story.sync_with_productboard) {
        try {
          const pbResult = await pushStoryToProductBoard(result);
          
          if (pbResult.success && pbResult.productboardId) {
            // Update story with ProductBoard ID
            await supabase
              .from('stories')
              .update({
                productboard_id: pbResult.productboardId,
                last_synced_at: new Date().toISOString()
              })
              .eq('id', result.id);
              
            result.productboard_id = pbResult.productboardId;
            result.last_synced_at = new Date().toISOString();
          } else {
            console.error('ProductBoard sync failed:', pbResult.message);
            setError(`Saved to database but ProductBoard sync failed: ${pbResult.message}`);
          }
        } catch (syncError) {
          console.error('Error syncing with ProductBoard:', syncError);
          // Continue anyway, we've saved to our DB
        }
      }
      
      // Call the onSave callback with the saved story
      onSave(result);
    } catch (error) {
      console.error('Error saving story:', error);
      setError('Failed to save story. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // If still loading data, show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 border-blue-500 border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Form header with tabs */}
      <div className="border-b border-gray-200">
        <div className="px-4 sm:px-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            <button
              type="button"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'main'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('main')}
            >
              Main Information
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rice'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('rice')}
            >
              RICE Scoring
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'classification'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('classification')}
            >
              Classification
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'planning'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('planning')}
            >
              Planning
            </button>
            <button
              type="button"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('content')}
            >
              Detailed Content
            </button>
          </nav>
        </div>
      </div>
      
      {/* Form content */}
      <div className="px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        
        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'main' && (
            <MainInfoSection
              story={story}
              onChange={handleFieldChange}
              users={users}
              teams={teams}
            />
          )}
          
          {activeTab === 'rice' && (
            <RICEScoringSection
              story={story}
              onChange={handleFieldChange}
            />
          )}
          
          {activeTab === 'classification' && (
            <ClassificationSection
              story={story}
              onChange={handleFieldChange}
              products={products}
            />
          )}
          
          {activeTab === 'planning' && (
            <PlanningSection
              story={story}
              onChange={handleFieldChange}
              allStories={allStories}
            />
          )}
          
          {activeTab === 'content' && (
            <DetailedContentSection
              story={story}
              onChange={handleFieldChange}
            />
          )}
        </div>
        
        {/* Sync with ProductBoard option */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <input
              id="sync-with-productboard"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={story.sync_with_productboard || false}
              onChange={(e) => handleFieldChange('sync_with_productboard', e.target.checked)}
            />
            <label htmlFor="sync-with-productboard" className="ml-2 block text-sm text-gray-900">
              Sync with ProductBoard
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            When enabled, this story will be pushed to ProductBoard after saving.
          </p>
        </div>
      </div>
      
      {/* Form actions */}
      <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSaving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : story.id ? 'Update Story' : 'Create Story'}
        </button>
      </div>
    </form>
  );
};
