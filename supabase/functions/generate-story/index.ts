import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Configuration, OpenAIApi } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface StoryPrompt {
  type: 'user_need' | 'feature_idea' | 'pain_point' | 'business_objective';
  prompt: string;
  workspaceId: string;
}

interface StoryResponse {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  riceScore: {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
  };
  sprintable: boolean;
  completenessScore: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get request data
    const { type, prompt, workspaceId }: StoryPrompt = await req.json();

    // Get workspace configuration
    const { data: config } = await supabase
      .from('configurations')
      .select('openai_api_key')
      .eq('workspace_id', workspaceId)
      .single();

    if (!config?.openai_api_key) {
      throw new Error('OpenAI API key not configured for workspace');
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: config.openai_api_key,
    });
    const openai = new OpenAIApi(configuration);

    // Get prompt template
    const { data: promptTemplate } = await supabase
      .from('ai_prompts')
      .select('prompt_template')
      .eq('category', type)
      .eq('workspace_id', workspaceId)
      .single();

    if (!promptTemplate?.prompt_template) {
      throw new Error(`No prompt template found for category: ${type}`);
    }

    // Generate story using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: promptTemplate.prompt_template,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Parse the response
    const response = JSON.parse(completion.choices[0].message.content) as StoryResponse;

    return new Response(
      JSON.stringify(response),
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