import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Configuration, OpenAIApi } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface StoryAnalysisRequest {
  storyId: string;
  workspaceId: string;
}

interface CompletenessAnalysis {
  scores: {
    description: number;
    acceptance: number;
    scope: number;
    dependencies: number;
    value: number;
  };
  suggestions: {
    description?: string;
    acceptance?: string;
    scope?: string;
    dependencies?: string;
    value?: string;
  };
  totalScore: number;
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

    const { storyId, workspaceId }: StoryAnalysisRequest = await req.json();

    // Get workspace configuration
    const { data: config } = await supabase
      .from('configurations')
      .select('openai_api_key')
      .eq('workspace_id', workspaceId)
      .single();

    if (!config?.openai_api_key) {
      throw new Error('OpenAI API key not configured');
    }

    // Get story data
    const { data: story } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (!story) {
      throw new Error('Story not found');
    }

    // Initialize OpenAI
    const openai = new OpenAIApi(new Configuration({ apiKey: config.openai_api_key }));

    // Analyze story with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze the user story and provide a detailed completeness assessment with scores and suggestions for improvement. Focus on:

1. Description Quality (0-100):
   - Clarity and specificity
   - Problem/need statement
   - Expected outcome
   - Technical context

2. Acceptance Criteria (0-100):
   - Testability
   - Coverage
   - Clarity
   - Edge cases

3. Scope Definition (0-100):
   - Clear boundaries
   - Appropriate size
   - Technical feasibility
   - Implementation path

4. Dependencies (0-100):
   - Technical dependencies
   - Business dependencies
   - Integration points
   - Risks identified

5. Business Value (0-100):
   - Clear value proposition
   - User benefit
   - Business impact
   - Success metrics

For each category:
- Provide a numerical score (0-100)
- Give specific suggestions for improvement
- Keep suggestions actionable and concise

Return the analysis in JSON format with 'scores' and 'suggestions' objects.`
        },
        {
          role: 'user',
          content: JSON.stringify({
            title: story.pb_title,
            description: story.description,
            acceptanceCriteria: story.acceptance_criteria,
            notes: story.notes,
          }),
        },
      ],
      temperature: 0.7,
    });

    // Ensure we have a valid response
    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    let analysis: CompletenessAnalysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', completion.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    // Validate the analysis structure
    if (!analysis.scores || !analysis.suggestions) {
      throw new Error('Invalid analysis format from OpenAI');
    }

    // Update story with new completeness score and AI suggestions
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        completeness_score: analysis.totalScore,
        ai_suggestions: analysis.suggestions,
      })
      .eq('id', storyId);

    if (updateError) throw updateError;

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
    console.error('Error in analyze-completeness:', error);
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