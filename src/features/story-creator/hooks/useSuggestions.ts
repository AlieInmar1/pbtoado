import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Story, ScoreValue } from '../../../types/story-creator';

interface SuggestionResult {
  [key: string]: {
    value?: ScoreValue | number | string;
    explanation?: string;
    content?: string;
    rationale?: string;
    id?: string;
    name?: string;
  };
}

/**
 * Hook for generating AI-powered suggestions for story fields
 * based on current context and story content
 */
export const useSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Generate suggestions for a story based on section context
   * @param story Current story data
   * @param section Current section being edited
   * @returns Promise resolving to suggestion data
   */
  const generateSuggestions = async (
    story: Partial<Story>,
    section: string
  ): Promise<SuggestionResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build a prompt based on the current section and story data
      const prompt = buildContextualPrompt(story, section);
      
      // Call the Supabase Edge Function for AI suggestions
      const { data, error } = await supabase.functions.invoke('get-story-suggestions', {
        body: {
          prompt,
          story,
          section
        }
      });
      
      if (error) {
        throw new Error(`Error calling AI suggestions: ${error.message}`);
      }
      
      // Process results based on section
      // This is where we'd format the raw AI response into structured suggestions
      const processedResults = processResults(data, section);
      
      return processedResults;
    } catch (err: any) {
      console.error('Error generating suggestions:', err);
      setError(err.message || 'Failed to generate suggestions');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Build a contextual prompt based on the section and story data
   */
  const buildContextualPrompt = (story: Partial<Story>, section: string): string => {
    const basePrompt = `Analyze this story and provide suggestions for the ${section} section.`;
    
    switch (section) {
      case 'rice':
        return `${basePrompt}
        
        Please suggest RICE+ scores using the following standardized scale:
        - Reach: 0, 20, 40, 60, 80, or 100
        - Impact: 0, 20, 40, 60, 80, or 100
        - Confidence: 0, 20, 40, 60, 80, or 100
        - Effort: Use person-months (0.5 for anything less than 1, otherwise use whole numbers or .5 increments)
        - OS Compatibility: 0, 20, 40, 60, 80, or 100
        
        Story Title: ${story.title || ''}
        Story Description: ${story.description || ''}
        
        For each score, provide a brief explanation of your reasoning.`;
        
      case 'content':
        return `${basePrompt}
        
        Based on the story description, suggest detailed acceptance criteria that would provide clear Definition of Done.
        Format as a bullet-point list of testable criteria.
        
        Story Title: ${story.title || ''}
        Story Description: ${story.description || ''}`;
        
      case 'planning':
        return `${basePrompt}
        
        Suggest an appropriate timeframe, dependencies, and implementation strategy.
        
        Story Title: ${story.title || ''}
        Story Description: ${story.description || ''}
        Investment Category: ${story.investment_category || ''}
        RICE Scores:
        - Reach: ${story.reach_score || 'Not set'}
        - Impact: ${story.impact_score || 'Not set'}
        - Confidence: ${story.confidence_score || 'Not set'}
        - Effort: ${story.effort_score || 'Not set'}`;
        
      case 'main':
        return `${basePrompt}
        
        Based on the story description, suggest any improvements to the title and description.
        If this appears to be a sub-feature, suggest an appropriate parent feature relationship.
        
        Story Title: ${story.title || ''}
        Story Description: ${story.description || ''}`;
        
      default:
        return `${basePrompt}
        
        Story Title: ${story.title || ''}
        Story Description: ${story.description || ''}`;
    }
  };
  
  /**
   * Process the raw results from the AI service into structured suggestions
   */
  const processResults = (data: any, section: string): SuggestionResult => {
    // This is a simplified implementation that could be expanded
    // In a production environment, you'd have more sophisticated processing
    
    if (!data || !data.suggestions) {
      // If no real data, return simulated suggestions for development purposes
      return generateSimulatedSuggestions(section);
    }
    
    return data.suggestions;
  };
  
  /**
   * Generate simulated suggestions for development
   * This would be removed in production and replaced with actual API calls
   */
  const generateSimulatedSuggestions = (section: string): SuggestionResult => {
    switch (section) {
      case 'rice':
        return {
          reach: {
            value: 60,
            explanation: 'This feature would impact approximately 5,000-10,000 users based on the current user base and feature adoption patterns.'
          },
          impact: {
            value: 80,
            explanation: 'This represents a major workflow improvement that would save users significant time and reduce errors.'
          },
          confidence: {
            value: 60,
            explanation: 'We have good qualitative data from multiple customer interviews, though we lack quantitative data.'
          },
          effort: {
            value: 2.5,
            explanation: 'Estimated at 2.5 person-months based on similar features and the described scope.'
          },
          osCompatibility: {
            value: 80,
            explanation: 'Strong alignment with HealthcareOS strategy and scalable across the platform.'
          }
        };
        
      case 'content':
        return {
          acceptanceCriteria: {
            content: `• User can successfully create a story with all required fields
• RICE scoring values are validated according to the standardized scale
• Parent-child relationships are correctly established in ProductBoard
• All form sections are accessible and navigable
• Error messages are displayed when validation fails
• Story can be saved as draft before completion
• Completed story is properly formatted for ProductBoard sync`,
            rationale: 'These criteria ensure the feature meets functional and quality requirements while providing a clear definition of done.'
          }
        };
        
      case 'planning':
        return {
          timeframe: {
            content: 'Q3 2025',
            rationale: 'Based on the effort estimate and current roadmap priorities.'
          }
        };
        
      case 'main':
        return {
          parentFeature: {
            id: 'PB-12345',
            name: 'Enhanced Story Management',
            explanation: 'This story appears to be related to the Enhancement Story Management initiative based on its focus and description.'
          }
        };
        
      default:
        return {};
    }
  };
  
  return {
    generateSuggestions,
    isLoading,
    error
  };
};
