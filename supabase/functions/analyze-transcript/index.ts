import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Configuration, OpenAIApi } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface TranscriptAnalysisRequest {
  sessionId: string;
  transcript: string;
}

interface StoryUpdate {
  id: string;
  title?: string;
  description?: string;
  acceptance_criteria?: string[];
  technical_notes?: string;
  discussion_points?: string[];
  decisions?: string[];
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

    const { sessionId, transcript }: TranscriptAnalysisRequest = await req.json();

    // Get session and related stories
    const { data: session } = await supabase
      .from('grooming_sessions')
      .select(`
        *,
        grooming_session_stories (
          id,
          story_id,
          initial_state,
          status,
          stories (*)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    // Get workspace configuration for OpenAI
    const { data: config } = await supabase
      .from('configurations')
      .select('openai_api_key')
      .eq('workspace_id', session.workspace_id)
      .single();

    if (!config?.openai_api_key) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize OpenAI
    const openai = new OpenAIApi(new Configuration({ apiKey: config.openai_api_key }));

    // Analyze transcript with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze this grooming session transcript and extract:
            1. Key discussion points for each story
            2. Decisions made
            3. Technical implementation notes
            4. Suggested updates to stories (title, description, acceptance criteria)
            5. Action items and next steps

            Format the response as a JSON object with:
            {
              "summary": string,
              "story_updates": Array<{
                "id": string,
                "title"?: string,
                "description"?: string,
                "acceptance_criteria"?: string[],
                "technical_notes"?: string,
                "discussion_points": string[],
                "decisions": string[]
              }>,
              "action_items": Array<{
                "description": string,
                "assignee"?: string,
                "due_date"?: string
              }>,
              "next_steps": string[]
            }`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            session_type: session.session_type,
            stories: session.grooming_session_stories.map((gss: any) => ({
              id: gss.story_id,
              title: gss.stories.pb_title,
              description: gss.stories.description,
              acceptance_criteria: gss.stories.acceptance_criteria,
            })),
            transcript,
          }),
        },
      ],
      temperature: 0.7,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    // Update session with summary and action items
    await supabase
      .from('grooming_sessions')
      .update({
        summary: analysis.summary,
        action_items: analysis.action_items,
        next_steps: analysis.next_steps.join('\n'),
        transcript,
      })
      .eq('id', sessionId);

    // Update stories with discussion points and decisions
    for (const update of analysis.story_updates) {
      // Update grooming session story
      await supabase
        .from('grooming_session_stories')
        .update({
          discussion_points: update.discussion_points,
          decisions: update.decisions,
          technical_notes: update.technical_notes,
          final_state: {
            title: update.title,
            description: update.description,
            acceptance_criteria: update.acceptance_criteria,
          },
        })
        .eq('session_id', sessionId)
        .eq('story_id', update.id);

      // Update story if changes are suggested
      if (update.title || update.description || update.acceptance_criteria) {
        await supabase
          .from('stories')
          .update({
            pb_title: update.title,
            description: update.description,
            acceptance_criteria: update.acceptance_criteria,
            notes: `Technical Notes:\n${update.technical_notes || ''}\n\nDiscussion Points:\n${update.discussion_points.join('\n')}\n\nDecisions:\n${update.decisions.join('\n')}`,
          })
          .eq('id', update.id);
      }
    }

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
    console.error('Error analyzing transcript:', error);
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