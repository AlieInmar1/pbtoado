import { supabase } from '../supabase';

// Interface matching the expected input for the AI story generator
export interface StoryGenerationInput {
  idea: string;
  domain: string;
  audience: string;
  priority: string;
  parentFeature?: string;
  component?: string;
}

// Interface matching the expected output from the AI story generator
export interface StoryGenerationOutput {
  title: string;
  description: string;
  acceptance_criteria: string;
  investment_category: string;
  reach_score: number;
  impact_score: number;
  confidence_score: number;
  effort_score: number;
  timeframe: string;
  tags: string[];
  customer_need_description: string;
  warning?: string; // Optional warning if AI generation failed and fallback to mock
  error?: string;  // Optional error message
}

/**
 * Generates a story from a simple idea using AI
 * Calls the Supabase Edge Function that performs the AI processing
 */
export async function generateStoryFromIdea(input: StoryGenerationInput): Promise<StoryGenerationOutput> {
  try {
    // Call the Edge Function with our input
    const { data, error } = await supabase.functions.invoke('generate-story-from-idea', {
      body: JSON.stringify(input),
    });
    
    if (error) {
      console.error('Error calling AI story generator function:', error);
      throw new Error(`Failed to generate story: ${error.message}`);
    }
    
    return data as StoryGenerationOutput;
  } catch (error) {
    console.error('Error in generateStoryFromIdea:', error);
    
    // Return a basic fallback story if the function call fails completely
    return {
      title: `Story for: ${input.idea.substring(0, 30)}...`,
      description: `Implementation of: ${input.idea}`,
      acceptance_criteria: `• Feature implements "${input.idea}" successfully\n• Implementation meets requirements\n• Thoroughly tested before release`,
      investment_category: 'Product Enhancement',
      reach_score: 50,
      impact_score: 50,
      confidence_score: 70,
      effort_score: 2.0,
      timeframe: 'Q3 2025',
      tags: ['enhancement', input.domain, input.audience, input.priority],
      customer_need_description: `Original idea: ${input.idea}`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Gets suggestions for story content fields based on the original idea
 * and other available context.
 * 
 * This is a simplified version that calls the main story generator and
 * extracts specific fields.
 */
export async function getSuggestionsForStory(input: StoryGenerationInput): Promise<Partial<StoryGenerationOutput>> {
  try {
    // Reuse the main story generator
    const fullStory = await generateStoryFromIdea(input);
    
    // Return just the fields we need for suggestions
    return {
      title: fullStory.title,
      description: fullStory.description,
      acceptance_criteria: fullStory.acceptance_criteria,
      tags: fullStory.tags,
      customer_need_description: fullStory.customer_need_description
    };
  } catch (error) {
    console.error('Error in getSuggestionsForStory:', error);
    return {
      title: `Story for ${input.idea.substring(0, 20)}...`,
      description: `Implement functionality for: ${input.idea}`,
      tags: ['enhancement']
    };
  }
}
