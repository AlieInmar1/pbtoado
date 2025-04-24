/**
 * Story Creator API
 * Provides functions to interact with the Story Creator system
 */

import { supabase } from '../supabase';
import { 
  StoryTemplate, 
  CreateStoryTemplateRequest, 
  UpdateStoryTemplateRequest,
  AnalyzeStoryRequest,
  AIAnalysisResult,
  CreateStoryWithAIRequest,
  StoryCreationResult,
  StoryContent
} from '../../types/story-creator';

/**
 * Get all story templates for a workspace
 * @param workspaceId - The workspace ID
 * @returns Promise resolving to an array of story templates
 */
export async function getStoryTemplates(workspaceId: string): Promise<StoryTemplate[]> {
  const { data, error } = await supabase
    .from('story_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name');
    
  if (error) {
    console.error('Error fetching story templates:', error);
    throw error;
  }
  
  return data as StoryTemplate[];
}

/**
 * Get a story template by ID
 * @param templateId - The template ID
 * @returns Promise resolving to a story template
 */
export async function getStoryTemplateById(templateId: string): Promise<StoryTemplate> {
  const { data, error } = await supabase
    .from('story_templates')
    .select('*')
    .eq('id', templateId)
    .single();
    
  if (error) {
    console.error('Error fetching story template:', error);
    throw error;
  }
  
  return data as StoryTemplate;
}

/**
 * Create a new story template
 * @param template - The template to create
 * @returns Promise resolving to the created template
 */
export async function createStoryTemplate(template: CreateStoryTemplateRequest): Promise<StoryTemplate> {
  const { data, error } = await supabase
    .from('story_templates')
    .insert([template])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating story template:', error);
    throw error;
  }
  
  return data as StoryTemplate;
}

/**
 * Update a story template
 * @param template - The template updates
 * @returns Promise resolving to the updated template
 */
export async function updateStoryTemplate(template: UpdateStoryTemplateRequest): Promise<StoryTemplate> {
  const { data, error } = await supabase
    .from('story_templates')
    .update(template)
    .eq('id', template.id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating story template:', error);
    throw error;
  }
  
  return data as StoryTemplate;
}

/**
 * Delete a story template
 * @param templateId - The template ID to delete
 * @returns Promise resolving to success status
 */
export async function deleteStoryTemplate(templateId: string): Promise<boolean> {
  const { error } = await supabase
    .from('story_templates')
    .delete()
    .eq('id', templateId);
    
  if (error) {
    console.error('Error deleting story template:', error);
    throw error;
  }
  
  return true;
}

/**
 * Analyze story content and provide AI recommendations
 * @param storyData - The story data to analyze
 * @returns Promise resolving to AI analysis results
 */
export async function analyzeStoryContent(storyData: AnalyzeStoryRequest): Promise<AIAnalysisResult> {
  try {
    console.log('Getting AI suggestions for story:', storyData);
    
    // Create a minimal but structured prompt for the AI
    const promptParts = [
      "Please provide suggestions for improving this story:",
      storyData.title ? `Title: ${storyData.title}` : "Title: (none provided)",
      storyData.description ? `Description: ${storyData.description}` : "Description: (none provided)"
    ];
    
    // Add acceptance criteria if available
    if (storyData.acceptance_criteria && storyData.acceptance_criteria.length > 0) {
      promptParts.push("Acceptance Criteria:");
      storyData.acceptance_criteria.forEach((criterion, index) => {
        promptParts.push(`- ${criterion}`);
      });
    } else {
      promptParts.push("Acceptance Criteria: (none provided)");
    }
    
    // Construct a complete prompt
    const input = promptParts.join("\n\n");
    
    // Create a minimal request payload in the exact format that works with the Edge Function
    const requestPayload = {
      input: input,
      hierarchyLevel: storyData.hierarchy_level || 'story',
      componentName: storyData.component_name || ''
    };
    
    console.log('Direct fetch payload for analyze-story-content:', JSON.stringify(requestPayload));
    
    // *** APPROACH 1: Use supabase client (first attempt) ***
    try {
      // Call the Edge Function using the client
      const response = await supabase.functions.invoke('analyze-story-content', {
        body: requestPayload
      });
      
      if (response.error) {
        console.error('Edge Function client error:', response.error);
        throw new Error('Client invoke failed, trying direct fetch');
      }
      
      console.log('AI suggestion result (supabase client):', response.data);
      
      // Process the response into AIAnalysisResult format
      return processAISuggestionResponse(response.data, storyData);
    } catch (clientError) {
      console.error('Exception in supabase client invoke:', clientError);
      
      // *** APPROACH 2: Try direct fetch as fallback ***
      try {
        // Construct the URL manually
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
          ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-story-content`
          : 'https://tqzsfzhcwkhwketcbvoz.supabase.co/functions/v1/analyze-story-content';
        
        console.log('Using direct fetch to URL:', supabaseUrl);
        
        // Use the anon key directly from the environment variables
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        console.log('Anon key available:', !!anonKey);
        
        const response = await fetch(supabaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`
          },
          body: JSON.stringify(requestPayload)
        });
        
        console.log('Direct fetch response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('AI suggestion result (direct fetch):', data);
        
        // Process the response into AIAnalysisResult format
        return processAISuggestionResponse(data, storyData);
      } catch (fetchError) {
        console.error('Direct fetch also failed:', fetchError);
        // Return empty results rather than throwing
        return {};
      }
    }
  } catch (error) {
    console.error('Error getting story suggestions:', error);
    // Return empty results rather than throwing
    return {};
  }
}

/**
 * Process the AI response into the AIAnalysisResult format
 * @param data - The response from the AI
 * @param originalStory - The original story data
 * @returns AIAnalysisResult
 */
function processAISuggestionResponse(data: any, originalStory: AnalyzeStoryRequest): AIAnalysisResult {
  // Initialize empty result
  const result: AIAnalysisResult = {};
  
  try {
    // If we have a title from the AI, assume it's a suggestion for improving the title
    if (data.title && data.title !== originalStory.title) {
      result.title_suggestions = [data.title];
    }
    
    // If we have a description from the AI, assume it's a suggestion for improving the description
    if (data.description && data.description !== originalStory.description) {
      result.description_suggestions = [data.description];
    }
    
    // If we have acceptance criteria from the AI, compare with original and include different ones
    if (data.acceptanceCriteria && Array.isArray(data.acceptanceCriteria)) {
      const originalCriteria = originalStory.acceptance_criteria || [];
      const newCriteria = data.acceptanceCriteria.filter(
        (ac: string) => !originalCriteria.some(oc => oc === ac)
      );
      
      if (newCriteria.length > 0) {
        result.acceptance_criteria = newCriteria;
      }
    }
    
    // Extract technical considerations from description (if any)
    if (data.description && typeof data.description === 'string') {
      const techMatch = data.description.match(/Technical considerations:?([\s\S]*?)(?:\n\n|$)/i);
      if (techMatch && techMatch[1]) {
        const techConsiderations = techMatch[1]
          .split(/\n-|\n\*/)
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0);
          
        if (techConsiderations.length > 0) {
          result.technical_considerations = techConsiderations;
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error processing AI suggestion response:', error);
    return result;
  }
}

/**
 * Create a story with AI assistance
 * @param request - The story creation request
 * @returns Promise resolving to the creation result
 */
export async function createStoryWithAI(request: CreateStoryWithAIRequest): Promise<StoryCreationResult> {
  try {
    // First get the template
    const template = await getStoryTemplateById(request.template_id);
    
    // Merge template default content with provided content
    const mergedContent: StoryContent = {
      ...template.default_content,
      ...request.content
    };
    
    // If content is missing required fields, analyze with AI to fill gaps
    const missingFields = template.required_fields.filter(field => 
      !mergedContent[field] || 
      (Array.isArray(mergedContent[field]) && mergedContent[field].length === 0)
    );
    
    if (missingFields.length > 0) {
      // Use AI to fill in missing fields
      const aiAnalysis = await analyzeStoryContent({
        ...mergedContent,
        parent_id: request.parent_id,
        workspace_id: request.workspace_id
      });
      
      // Apply AI suggestions for missing fields
      missingFields.forEach(field => {
        if (field === 'title' && aiAnalysis.title_suggestions?.length) {
          mergedContent.title = aiAnalysis.title_suggestions[0];
        } else if (field === 'description' && aiAnalysis.description_suggestions?.length) {
          mergedContent.description = aiAnalysis.description_suggestions[0];
        } else if (field === 'acceptance_criteria' && aiAnalysis.acceptance_criteria?.length) {
          mergedContent.acceptance_criteria = aiAnalysis.acceptance_criteria;
        }
      });
    }
    
    // Create the story in the database
    const { data, error } = await supabase
      .from('grooming_stories')
      .insert([{
        title: mergedContent.title,
        description: mergedContent.description,
        acceptance_criteria: mergedContent.acceptance_criteria,
        parent_story_id: request.parent_id,
        workspace_id: request.workspace_id,
        status: 'new',
        complexity: mergedContent.complexity || 1,
        story_type: template.type
      }])
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Return the result
    return {
      story_id: data.id,
      title: data.title,
      success: true
    };
  } catch (error) {
    console.error('Error creating story with AI:', error);
    return {
      story_id: '',
      title: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Track AI suggestion acceptance
 * @param storyId - The story ID
 * @param fieldName - The field name that received the suggestion
 * @param suggestion - The suggestion text
 * @param confidence - The confidence level
 * @param accepted - Whether the suggestion was accepted
 * @param workspaceId - The workspace ID
 * @returns Promise resolving to success status
 */
export async function trackAISuggestion(
  storyId: string,
  fieldName: string,
  suggestion: string,
  confidence: number,
  accepted: boolean,
  workspaceId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('ai_suggestions')
    .insert([{
      story_id: storyId,
      field_name: fieldName,
      suggestion,
      confidence,
      accepted,
      workspace_id: workspaceId
    }]);
    
  if (error) {
    console.error('Error tracking AI suggestion:', error);
    throw error;
  }
  
  return true;
}
