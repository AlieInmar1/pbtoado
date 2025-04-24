import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
// Use explicit import URL instead of relying on import map
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface IdeaInput {
  idea: string;
  domain: string;
  audience: string;
  priority: string;
  parentFeature?: string;  // Optional parent feature for context
  component?: string;     // Optional component name for context
}

interface StoryOutput {
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
}

/**
 * This function takes a simple idea and uses AI to generate a structured story
 * from it, considering the provided context like domain, audience, and priority.
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { idea, domain, audience, priority, parentFeature, component } = await req.json() as IdeaInput;
    
    // Get API Key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Check if API key is available
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          message: 'The server is not properly configured for AI story generation',
          fallbackToMock: true,
          mockStory: await generateStoryMock(idea, domain, audience, priority, component)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Input validation
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid idea input' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // In a production implementation, call the OpenAI API to generate the story
    try {
      const generatedStory = await generateStoryWithAI(
        idea, 
        domain, 
        audience, 
        priority, 
        parentFeature, 
        component,
        openaiApiKey
      );

      return new Response(
        JSON.stringify(generatedStory),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (aiError) {
      console.error('Error calling OpenAI:', aiError);
      
      // Fall back to mock if AI fails
      const mockStory = await generateStoryMock(idea, domain, audience, priority, component);
      
      return new Response(
        JSON.stringify({ 
          warning: 'AI generation failed, using fallback mock data',
          error: aiError.message,
          ...mockStory 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred processing the idea' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Generate a structured story from an idea using OpenAI
 */
async function generateStoryWithAI(
  idea: string,
  domain: string,
  audience: string,
  priority: string,
  parentFeature?: string,
  component?: string,
  apiKey?: string
): Promise<StoryOutput> {
  // Construct a prompt that instructs the AI to generate a structured story
  const prompt = `
  You are an expert software product manager skilled in creating structured user stories.
  
  Generate a comprehensive user story based on the following idea and context:
  
  IDEA: ${idea}
  DOMAIN: ${domain}
  TARGET AUDIENCE: ${audience}
  PRIORITY: ${priority}
  ${component ? `COMPONENT: ${component}` : ''}
  ${parentFeature ? `PARENT FEATURE: ${parentFeature}` : ''}
  
  Create a structured story with the following elements:
  
  1. A clear, concise title
  2. A detailed description explaining the functionality and value
  3. Comprehensive acceptance criteria (5-7 bullet points)
  4. An appropriate investment category
  5. RICE scoring values (reach, impact, confidence, effort on scales of 1-100 for reach/impact/confidence and 0.5-5 for effort)
  6. A realistic timeframe (Q2-Q4 2025)
  7. Relevant tags (4-6 tags)
  8. A summary of the customer need
  
  Focus on creating content that is specific, actionable, and addresses the original idea in the context provided.
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that generates structured user stories for product development.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Parse the AI response to extract the structured components
    const aiText = data.choices[0]?.message?.content;
    if (!aiText) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    // Parse the AI output to extract structured data
    return parseAIResponseToStory(aiText, idea);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Parse the AI-generated text into a structured story object
 */
function parseAIResponseToStory(aiText: string, originalIdea: string): StoryOutput {
  try {
    // Extract title (first line is typically the title)
    const lines = aiText.split('\n').filter(line => line.trim().length > 0);
    const title = lines[0]?.replace(/^title:?\s*/i, '').trim() || `Story for: ${originalIdea.substring(0, 30)}...`;
    
    // Extract description (usually starts with "Description:")
    const descriptionStart = aiText.toLowerCase().indexOf('description:');
    const acceptanceCriteriaStart = aiText.toLowerCase().indexOf('acceptance criteria:');
    let description = '';
    
    if (descriptionStart >= 0 && acceptanceCriteriaStart > descriptionStart) {
      description = aiText.substring(descriptionStart + 12, acceptanceCriteriaStart).trim();
    } else {
      // Fallback: Use the second paragraph if available
      description = lines.length > 1 ? lines[1] : `Implementation of: ${originalIdea}`;
    }
    
    // Extract acceptance criteria 
    const investmentCategoryStart = aiText.toLowerCase().indexOf('investment category:');
    let acceptanceCriteria = '';
    
    if (acceptanceCriteriaStart >= 0 && investmentCategoryStart > acceptanceCriteriaStart) {
      acceptanceCriteria = aiText.substring(acceptanceCriteriaStart + 20, investmentCategoryStart).trim();
    } else {
      // Generate default acceptance criteria 
      acceptanceCriteria = `• Feature implements "${originalIdea}" successfully\n• Implementation is tested across all supported platforms\n• User feedback is collected and integrated\n• Performance metrics show no degradation\n• Documentation is updated`;
    }
    
    // Extract investment category
    const investmentCategory = extractValue(aiText, 'investment category', 'Product Enhancement');
    
    // Extract RICE scores (with fallbacks to reasonable defaults)
    const reachScore = extractNumberValue(aiText, 'reach', 60);
    const impactScore = extractNumberValue(aiText, 'impact', 60);
    const confidenceScore = extractNumberValue(aiText, 'confidence', 80);
    const effortScore = extractFloatValue(aiText, 'effort', 2.5);
    
    // Extract timeframe
    const timeframe = extractValue(aiText, 'timeframe', 'Q3 2025');
    
    // Extract tags
    const tagsMatch = aiText.match(/tags:?\s*(.*?)(?:\.|\n|$)/i);
    const tags = tagsMatch ? 
      tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      ['enhancement', 'user-experience'];
    
    // Extract customer need
    const customerNeed = extractValue(aiText, 'customer need', `Original idea: ${originalIdea}`);
    
    return {
      title,
      description,
      acceptance_criteria: acceptanceCriteria,
      investment_category: investmentCategory,
      reach_score: reachScore,
      impact_score: impactScore,
      confidence_score: confidenceScore,
      effort_score: effortScore,
      timeframe,
      tags,
      customer_need_description: customerNeed
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Return fallback values
    return {
      title: `Story for: ${originalIdea.substring(0, 30)}...`,
      description: `Implementation of: ${originalIdea}`,
      acceptance_criteria: `• Feature implements "${originalIdea}" successfully\n• Implementation is tested across all supported platforms\n• User feedback is collected and integrated\n• Performance metrics show no degradation\n• Documentation is updated`,
      investment_category: 'Product Enhancement',
      reach_score: 60,
      impact_score: 60,
      confidence_score: 80,
      effort_score: 2.5,
      timeframe: 'Q3 2025',
      tags: ['enhancement', 'user-experience'],
      customer_need_description: `Original idea: ${originalIdea}`
    };
  }
}

// Helper functions for parsing values from the AI response
function extractValue(text: string, field: string, defaultValue: string): string {
  const regex = new RegExp(`${field}:?\\s*(.*?)(?:(?:\\n\\s*[a-z]+:)|$)`, 'is');
  const match = text.match(regex);
  return match ? match[1].trim() : defaultValue;
}

function extractNumberValue(text: string, field: string, defaultValue: number): number {
  const value = extractValue(text, field, '');
  const numberMatch = value.match(/(\d+)/);
  return numberMatch ? parseInt(numberMatch[1]) : defaultValue;
}

function extractFloatValue(text: string, field: string, defaultValue: number): number {
  const value = extractValue(text, field, '');
  const floatMatch = value.match(/(\d+\.\d+|\d+)/);
  return floatMatch ? parseFloat(floatMatch[1]) : defaultValue;
}

/**
 * Fallback mock AI story generator (simulates the behavior of a real AI model)
 */
async function generateStoryMock(
  idea: string,
  domain: string,
  audience: string,
  priority: string,
  component?: string
): Promise<StoryOutput> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate a title based on the idea and context
  const prefixes = ['Enhance', 'Improve', 'Add', 'Implement', 'Develop'];
  const features = ['user onboarding', 'data export', 'search functionality', 'notification system', 'dashboard'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const feature = features[Math.floor(Math.random() * features.length)];
  const componentName = component || 'product';

  const title = `${prefix} ${feature} for ${audience === 'enterprise' ? 'enterprise customers' : 'all users'}`;
  
  // Generate a description based on the idea
  const description = `This feature will ${idea.toLowerCase()}. It will be targeted at ${audience === 'all_users' ? 'all users' : audience} 
  and is considered a ${priority} priority. The feature will enhance the overall user experience and 
  improve satisfaction rates. Implementation will require coordination with the design and engineering teams.`;

  // Generate acceptance criteria
  const acceptanceCriteria = `• Users can ${idea.toLowerCase()} successfully within the ${componentName} component
• The system provides appropriate feedback during the process
• All user actions are properly logged for analytics
• The feature works consistently across all supported browsers and devices
• Performance impact is within acceptable parameters`;

  // Generate tags based on context
  const tags = ['enhancement', 'user-experience', domain, priority];
  if (audience !== 'all_users') {
    tags.push(audience);
  }

  // Generate RICE scoring values (0-100 scale for most, 0.5-5 for effort)
  const reach = Math.floor(Math.random() * 6) * 20; // 0, 20, 40, 60, 80, 100
  const impact = Math.floor(Math.random() * 6) * 20;
  const confidence = Math.floor(Math.random() * 6) * 20;
  const effort = Math.floor(Math.random() * 10) / 2 + 0.5; // 0.5 to 5.0 in 0.5 increments

  return {
    title,
    description,
    acceptance_criteria: acceptanceCriteria,
    investment_category: domain === 'product' ? 'Product Enhancement' : 'New Feature',
    reach_score: reach,
    impact_score: impact,
    confidence_score: confidence,
    effort_score: effort,
    timeframe: priority === 'high' ? 'Q2 2025' : 'Q3 2025',
    tags,
    customer_need_description: `Original idea: ${idea}`
  };
}
