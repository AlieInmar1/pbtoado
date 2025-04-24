// Supabase Edge Function for analyzing and improving grooming stories
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0';

interface AnalyzeStoryRequest {
  story_id: string;
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

interface GroomingStory {
  id: string;
  title: string;
  description?: string;
  acceptance_criteria?: any[];
  level?: string;
  status: string;
  story_points?: number;
  complexity?: number;
  business_value?: number;
  parent_story_id?: string;
  workspace_id: string;
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

// Get story by ID
async function getStory(storyId: string): Promise<GroomingStory> {
  const { data, error } = await supabase
    .from('grooming_stories')
    .select('*')
    .eq('id', storyId)
    .single();

  if (error) {
    console.error('Error fetching story:', error);
    throw error;
  }

  return data as GroomingStory;
}

// Get parent story if exists
async function getParentStory(parentId?: string): Promise<GroomingStory | null> {
  if (!parentId) return null;

  const { data, error } = await supabase
    .from('grooming_stories')
    .select('*')
    .eq('id', parentId)
    .single();

  if (error) {
    console.error('Error fetching parent story:', error);
    return null;
  }

  return data as GroomingStory;
}

// Get child stories if any
async function getChildStories(storyId: string): Promise<GroomingStory[]> {
  const { data, error } = await supabase
    .from('grooming_stories')
    .select('*')
    .eq('parent_story_id', storyId);

  if (error) {
    console.error('Error fetching child stories:', error);
    return [];
  }

  return data as GroomingStory[];
}

// Main function to analyze story
async function analyzeStory(story: GroomingStory, parentStory: GroomingStory | null, childStories: GroomingStory[]): Promise<AIAnalysisResult> {
  // Prepare the story data for analysis
  const storyData = {
    id: story.id,
    title: story.title,
    description: story.description || '',
    acceptance_criteria: story.acceptance_criteria || [],
    level: story.level || 'story',
    status: story.status,
    story_points: story.story_points,
    complexity: story.complexity,
    business_value: story.business_value,
    parent: parentStory ? {
      id: parentStory.id,
      title: parentStory.title,
      level: parentStory.level,
    } : null,
    children: childStories.map(child => ({
      id: child.id,
      title: child.title,
      level: child.level,
    })),
  };

  // Prepare the prompt for OpenAI
  const prompt = `
    Analyze the following user story and provide feedback to improve it. Consider the following aspects:
    
    1. Clarity: Is the story clear and understandable?
    2. Completeness: Does it have all necessary information?
    3. Testability: Can it be easily tested?
    4. Size: Is it appropriately sized or should it be split?
    5. Value: Is the business value clear?
    6. Dependencies: Are there any dependencies that should be addressed?
    
    Also identify any risks or issues that might affect the implementation of this story.
    
    Format your response as a JSON object with the following structure:
    {
      "key_points": [
        { "text": "...", "confidence": 0.9, "source_text": "..." }
      ],
      "action_items": [
        { "text": "...", "status": "open", "priority": "high" }
      ],
      "decisions": [
        { "text": "..." }
      ],
      "risks": [
        { "text": "...", "impact": "high", "likelihood": "medium", "mitigation_strategy": "..." }
      ],
      "suggestions": [
        { "text": "...", "category": "improvement", "confidence": 0.8 }
      ],
      "sentiment_score": 0.7
    }
    
    Story Data:
    ${JSON.stringify(storyData, null, 2)}
  `;

  try {
    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an AI assistant that analyzes user stories and provides feedback to improve them.' },
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
    console.error('Error analyzing story:', error);
    throw error;
  }
}

// Save analysis to database
async function saveAnalysis(storyId: string, analysis: AIAnalysisResult): Promise<string> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .insert([{
      story_id: storyId,
      analysis_type: 'story',
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
    const { story_id } = await req.json() as AnalyzeStoryRequest;

    if (!story_id) {
      return new Response(
        JSON.stringify({ error: 'story_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get story data
    const story = await getStory(story_id);
    const parentStory = await getParentStory(story.parent_story_id);
    const childStories = await getChildStories(story_id);

    // Analyze story
    const analysis = await analyzeStory(story, parentStory, childStories);

    // Save analysis to database
    const analysisId = await saveAnalysis(story_id, analysis);

    // Return analysis
    return new Response(
      JSON.stringify({
        id: analysisId,
        story_id,
        analysis_type: 'story',
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
