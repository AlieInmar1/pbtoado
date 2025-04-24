// Supabase Edge Function for analyzing grooming session transcripts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0';

interface AnalyzeTranscriptRequest {
  session_id: string;
  transcript: string;
}

interface KeyPoint {
  id: string;
  text: string;
  confidence: number;
  source_text?: string;
}

interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  due_date?: string;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface Decision {
  id: string;
  text: string;
  rationale?: string;
  made_by?: string;
  made_at?: string;
}

interface Risk {
  id: string;
  text: string;
  impact: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  mitigation_strategy?: string;
}

interface Suggestion {
  id: string;
  text: string;
  category: 'improvement' | 'clarification' | 'alternative' | 'warning';
  confidence: number;
}

interface AIAnalysisResult {
  key_points: KeyPoint[];
  action_items: ActionItem[];
  decisions: Decision[];
  risks: Risk[];
  suggestions: Suggestion[];
  sentiment_score: number;
}

// Initialize OpenAI
const openAiKey = Deno.env.get('OPENAI_API_KEY');
if (!openAiKey) {
  throw new Error('OPENAI_API_KEY is required');
}

const configuration = new Configuration({
  apiKey: openAiKey,
});
const openai = new OpenAIApi(configuration);

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a UUID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Main function to analyze transcript
async function analyzeTranscript(transcript: string): Promise<AIAnalysisResult> {
  // Prepare the prompt for OpenAI
  const prompt = `
    Analyze the following transcript from a grooming session. Extract key information and organize it into the following categories:
    
    1. Key Points: Important information discussed during the session
    2. Action Items: Tasks that need to be completed, with assignees if mentioned
    3. Decisions: Decisions made during the session
    4. Risks: Potential risks or issues identified
    5. Suggestions: Suggestions for improvement
    
    Also provide a sentiment score from 0 to 1, where 0 is very negative and 1 is very positive.
    
    Format your response as a JSON object with the following structure:
    {
      "key_points": [
        { "text": "...", "confidence": 0.9, "source_text": "..." }
      ],
      "action_items": [
        { "text": "...", "assignee": "...", "status": "open", "priority": "high" }
      ],
      "decisions": [
        { "text": "...", "rationale": "..." }
      ],
      "risks": [
        { "text": "...", "impact": "high", "likelihood": "medium", "mitigation_strategy": "..." }
      ],
      "suggestions": [
        { "text": "...", "category": "improvement", "confidence": 0.8 }
      ],
      "sentiment_score": 0.7
    }
    
    Transcript:
    ${transcript}
  `;

  try {
    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an AI assistant that analyzes grooming session transcripts and extracts structured information.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    // Parse the response
    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Extract the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const analysisResult = JSON.parse(jsonMatch[0]) as AIAnalysisResult;

    // Add IDs to each item
    analysisResult.key_points = analysisResult.key_points.map(point => ({
      ...point,
      id: generateUUID(),
    }));

    analysisResult.action_items = analysisResult.action_items.map(item => ({
      ...item,
      id: generateUUID(),
    }));

    analysisResult.decisions = analysisResult.decisions.map(decision => ({
      ...decision,
      id: generateUUID(),
    }));

    analysisResult.risks = analysisResult.risks.map(risk => ({
      ...risk,
      id: generateUUID(),
    }));

    analysisResult.suggestions = analysisResult.suggestions.map(suggestion => ({
      ...suggestion,
      id: generateUUID(),
    }));

    return analysisResult;
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    throw error;
  }
}

// Save analysis to database
async function saveAnalysis(sessionId: string, analysis: AIAnalysisResult): Promise<string> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .insert([{
      session_id: sessionId,
      analysis_type: 'transcript',
      key_points: analysis.key_points,
      action_items: analysis.action_items,
      decisions: analysis.decisions,
      risks: analysis.risks,
      suggestions: analysis.suggestions,
      sentiment_score: analysis.sentiment_score,
      raw_analysis: analysis,
    }])
    .select('id')
    .single();

  if (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }

  return data.id;
}

// Main handler
serve(async (req) => {
  try {
    // Parse request
    const { session_id, transcript } = await req.json() as AnalyzeTranscriptRequest;

    if (!session_id || !transcript) {
      return new Response(
        JSON.stringify({ error: 'session_id and transcript are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Analyze transcript
    const analysis = await analyzeTranscript(transcript);

    // Save analysis to database
    const analysisId = await saveAnalysis(session_id, analysis);

    // Update session with transcript
    const { error: updateError } = await supabase
      .from('grooming_sessions')
      .update({
        transcript,
        transcript_uploaded_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      throw updateError;
    }

    // Return analysis
    return new Response(
      JSON.stringify({
        id: analysisId,
        session_id,
        analysis_type: 'transcript',
        ...analysis,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
