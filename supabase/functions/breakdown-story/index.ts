import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Configuration, OpenAIApi } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface StoryBreakdownRequest {
  workspaceId: string;
  storyData: {
    title: string;
    description: string;
    level: 'feature' | 'story';
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

    const { workspaceId, storyData }: StoryBreakdownRequest = await req.json();

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

    // Get historical story data for context
    const { data: historicalStories } = await supabase
      .from('stories')
      .select('level, story_points, acceptance_criteria')
      .eq('workspace_id', workspaceId)
      .limit(50);

    // Analyze story with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: storyData.level === 'feature'
            ? `Break down this feature into smaller, implementable stories. Consider:
               1. User flows and interactions
               2. Technical components
               3. Data requirements
               4. Testing scenarios
               5. Dependencies and risks
               
               Format each story with:
               - Clear title
               - Detailed description
               - Specific acceptance criteria
               - Story point estimate
               - Technical implementation notes`
            : `Enhance this story with implementation details. Include:
               1. Technical requirements
               2. Dependencies
               3. Potential risks
               4. Testing scenarios
               5. Story point estimate
               
               Structure the response with:
               - Refined title and description
               - Detailed acceptance criteria
               - Technical notes
               - Dependencies list
               - Risk assessment`,
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

    const result = JSON.parse(completion.choices[0].message.content);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
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