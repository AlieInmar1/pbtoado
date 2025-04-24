// Supabase Edge Function for AI story generation
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

interface StoryGenerationRequest {
  input: string;
  hierarchyLevel?: 'epic' | 'feature' | 'story';
  componentName?: string;
}

interface StoryGenerationResponse {
  title: string;
  description: string;
  acceptanceCriteria?: string[];
}

// Create a system prompt based on the request
function createSystemPrompt(request: StoryGenerationRequest): string {
  const { hierarchyLevel = 'story', componentName } = request;
  
  let prompt = `You are an expert product manager who specializes in writing clear, concise, and effective product requirements. `;
  
  // Add formatting instructions
  prompt += `Format your response with clear section headers:
  
Title: [A concise, descriptive, action-oriented title that starts with a verb]

Description: [Description in the format "As a [user type], I want to [action], so that [benefit]", followed by any additional details]

Acceptance Criteria:
- [First criterion]
- [Second criterion]
- [Third criterion]
`;
  
  if (hierarchyLevel === 'story') {
    prompt += `You are writing a user story. The title MUST be action-oriented and start with a verb (e.g., "Implement User Authentication", "Create Password Reset Functionality"). `;
    prompt += `The description MUST follow the format "As a [user type], I want to [action], so that [benefit]". This format should be the FIRST sentence of the description, followed by any additional details. `;
    prompt += `The story should be specific, measurable, achievable, relevant, and time-bound (SMART). `;
    prompt += `Include 3-5 acceptance criteria in the format "Given [context], when [action], then [result]". `;
  } else if (hierarchyLevel === 'feature') {
    prompt += `You are writing a feature description that clearly explains what the feature does, who it's for, and why it's valuable. `;
    prompt += `The feature should be well-defined with a clear scope. `;
    prompt += `Include 3-5 acceptance criteria that define when this feature would be considered complete. `;
  } else if (hierarchyLevel === 'epic') {
    prompt += `You are writing an epic description that outlines a large body of work that can be broken down into multiple features and stories. `;
    prompt += `The epic should have a clear business objective and define the overall goal. `;
    prompt += `Include 3-5 high-level success criteria for this epic. `;
  }
  
  if (componentName) {
    prompt += `This ${hierarchyLevel} is for the "${componentName}" component of the product. `;
  }
  
  prompt += `Based on the user's input, generate a title, description, and acceptance criteria for the ${hierarchyLevel}.`;
  
  return prompt;
}

// Create a user prompt based on the request
function createUserPrompt(request: StoryGenerationRequest): string {
  const { input, hierarchyLevel = 'story' } = request;
  
  return `Please create a ${hierarchyLevel} based on the following input: "${input}"`;
}

// Parse the AI response to extract title, description, and acceptance criteria
function parseAIResponse(response: string): StoryGenerationResponse {
  // Default values
  let title = '';
  let description = '';
  let acceptanceCriteria: string[] = [];
  
  try {
    console.log('Raw AI response:', response);
    
    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(response);
      if (jsonResponse.title) title = jsonResponse.title;
      if (jsonResponse.description) description = jsonResponse.description;
      if (jsonResponse.acceptanceCriteria) acceptanceCriteria = jsonResponse.acceptanceCriteria;
      return { title, description, acceptanceCriteria };
    } catch (e) {
      // Not JSON, continue with text parsing
      console.log('Not JSON, continuing with text parsing');
    }
    
    // Clean up markdown formatting
    const cleanResponse = response.replace(/#+\s+/g, '').replace(/\*\*/g, '');
    
    // Extract title (first line or section marked with "Title:")
    const titleMatch = cleanResponse.match(/(?:Title:)(.*?)(?:\n|$)/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else {
      // Use the first line as title if no explicit title found
      const lines = cleanResponse.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        title = lines[0].trim();
      }
    }
    
    // Extract description (section marked with "Description:" or everything between title and acceptance criteria)
    const descriptionMatch = cleanResponse.match(/(?:Description:)(.*?)(?:Acceptance Criteria:|$)/is);
    if (descriptionMatch && descriptionMatch[1]) {
      description = descriptionMatch[1].trim();
    } else {
      // Use everything except the first line and acceptance criteria as description
      const lines = cleanResponse.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        const descLines = [];
        let inAcceptanceCriteria = false;
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].match(/Acceptance Criteria:/i)) {
            inAcceptanceCriteria = true;
            continue;
          }
          
          if (!inAcceptanceCriteria) {
            descLines.push(lines[i]);
          }
        }
        
        description = descLines.join('\n').trim();
      }
    }
    
    // Extract acceptance criteria (section marked with "Acceptance Criteria:" or list items after description)
    const acMatch = cleanResponse.match(/(?:Acceptance Criteria:)(.*?)$/is);
    if (acMatch && acMatch[1]) {
      // Split by list markers or numbered items
      const criteria = acMatch[1]
        .split(/\n\s*(?:-|\*|\d+\.|\s*Given\s+)/i)
        .filter(item => item.trim())
        .map(item => {
          // Add "Given" back if it was removed during splitting
          if (item.trim() && !item.trim().toLowerCase().startsWith('given')) {
            return `Given ${item.trim()}`;
          }
          return item.trim();
        });
      
      if (criteria.length > 0) {
        acceptanceCriteria = criteria;
      }
    }
    
    return { title, description, acceptanceCriteria };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return { title, description, acceptanceCriteria };
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }
  
  try {
    // Log request details for debugging
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Check if request has a body
    const hasBody = req.headers.get('content-length') && parseInt(req.headers.get('content-length') || '0') > 0;
    console.log('Has body:', hasBody);
    
    let requestData: StoryGenerationRequest;
    
    try {
      // Get request body
      requestData = await req.json() as StoryGenerationRequest;
      console.log('Request data:', requestData);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body. Make sure to send a valid JSON object.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!requestData || !requestData.input) {
      console.error('Missing input in request data:', requestData);
      return new Response(
        JSON.stringify({ error: 'Input is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Create prompts
    const systemPrompt = createSystemPrompt(requestData);
    const userPrompt = createUserPrompt(requestData);
    
    // Call OpenAI API
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }
    
    const openAIData = await openAIResponse.json();
    const aiResponseText = openAIData.choices[0]?.message?.content || '';
    
    // Parse the AI response
    const parsedResponse = parseAIResponse(aiResponseText);
    
    // Return the response
    return new Response(
      JSON.stringify(parsedResponse),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
