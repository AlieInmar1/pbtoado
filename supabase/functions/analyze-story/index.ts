import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Configuration, OpenAIApi } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface StoryAnalysisRequest {
  workspaceId: string;
  storyData: {
    level: 'feature' | 'story';
    title: string;
    description: string;
    acceptanceCriteria?: string[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { workspaceId, storyData }: StoryAnalysisRequest = await req.json();

    // Get workspace configuration
    const { data: config } = await supabase
      .from('configurations')
      .select('openai_api_key')
      .eq('workspace_id', workspaceId)
      .single();

    if (!config?.openai_api_key) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize OpenAI
    const openai = new OpenAIApi(new Configuration({ apiKey: config.openai_api_key }));

    // Get historical stories for context
    const { data: historicalStories } = await supabase
      .from('stories')
      .select('pb_title, description, level, story_points')
      .eq('workspace_id', workspaceId)
      .limit(10);

    // Analyze story with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: storyData.level === 'story' 
            ? `Analyze this user story and determine if it's sprintable or needs to be broken down.
               Consider:
               1. Size and complexity
               2. Dependencies and prerequisites
               3. Clear boundaries and scope
               4. Technical feasibility
               5. Business value clarity

               Return a JSON object with:
               {
                 "isSprintable": boolean,
                 "reasons": string[],
                 "suggestions": string[],
                 "improvements": {
                   "title": string | null,
                   "description": string | null,
                   "acceptanceCriteria": string[] | null
                 }
               }

               If not sprintable, provide specific reasons why and suggestions for breaking it down.
               If sprintable but could be improved, provide suggestions in the improvements object.`
            : `Analyze this feature and provide suggestions for improvement.
               Consider:
               1. Scope clarity
               2. Value proposition
               3. Technical feasibility
               4. Dependencies
               5. Potential breakdown points

               Return a JSON object with:
               {
                 "improvements": {
                   "title": string | null,
                   "description": string | null
                 },
                 "breakdownSuggestions": string[]
               }`
        },
        {
          role: 'user',
          content: JSON.stringify({
            story: storyData,
            historicalContext: historicalStories,
          }),
        },
      ],
      temperature: 0.7,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    return new Response(
      JSON.stringify(analysis),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in analyze-story:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});