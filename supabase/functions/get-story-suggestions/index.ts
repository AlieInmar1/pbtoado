import { serve } from 'http/server';
import { corsHeaders } from '../_shared/cors.ts';

interface StoryData {
  title?: string;
  description?: string;
  [key: string]: any;
}

interface RequestBody {
  prompt: string;
  story: StoryData;
  section: string;
}

/**
 * Supabase Edge Function to generate AI-powered suggestions for stories
 * based on context and section being edited
 */
serve(async (req) => {
  // Handle CORS pre-flight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { prompt, story, section } = await req.json() as RequestBody;
    
    // Log the request for debugging
    console.log(`Processing suggestion request for section: ${section}`);
    
    // In a production environment, this would call an LLM service like OpenAI
    // For this implementation, we'll return predefined suggestions based on section
    
    const suggestions = generateSuggestions(section, story);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        message: 'Suggestions generated successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );
  } catch (error) {
    // Log and return error
    console.error('Error generating suggestions:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unknown error occurred',
        message: 'Failed to generate suggestions'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});

/**
 * Generate predefined suggestions based on section
 * In a production environment, this would call an AI service
 */
function generateSuggestions(section: string, story: StoryData): Record<string, any> {
  // Generate recommendations based on the section
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
}
