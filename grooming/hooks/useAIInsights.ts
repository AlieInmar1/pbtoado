import { useState, useEffect } from 'react';
import { AIInsight, ActionItem, Risk, Suggestion } from '../types';
import { supabase } from '../../src/lib/supabase';

/**
 * Custom hook to fetch and process AI insights for sessions or stories
 * @param sessionId Optional ID of the grooming session
 * @param storyId Optional ID of the story
 * @returns Object containing insights, action items, risks, suggestions, loading state, and error
 */
export function useAIInsights(sessionId?: string, storyId?: string) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAIInsights = async () => {
      if (!sessionId && !storyId) {
        setIsLoading(false);
        return;
      }

      try {
        let analysisData;
        
        if (sessionId) {
          // First check if we already have an analysis for this session
          const { data: existingAnalysis, error: fetchError } = await supabase
            .from('ai_analyses')
            .select('*')
            .eq('session_id', sessionId)
            .eq('analysis_type', 'transcript')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw fetchError;
          }
          
          if (existingAnalysis) {
            // Use existing analysis
            analysisData = existingAnalysis;
          } else {
            // Get session transcript
            const { data: sessionData, error: sessionError } = await supabase
              .from('grooming_sessions')
              .select('transcript')
              .eq('id', sessionId)
              .single();
              
            if (sessionError) {
              throw sessionError;
            }
            
            if (!sessionData.transcript) {
              // No transcript available yet
              setIsLoading(false);
              return;
            }
            
            // Call the analyze-transcript function
            const { data, error } = await supabase.functions.invoke('analyze-transcript', {
              body: { 
                session_id: sessionId,
                transcript: sessionData.transcript
              }
            });
            
            if (error) {
              console.error('Error calling analyze-transcript function:', error);
              // Fall back to mock data if the function call fails
              setInsights(getMockSessionInsights());
              setActionItems(getMockSessionActionItems());
              setRisks(getMockSessionRisks());
              setSuggestions(getMockSessionSuggestions());
              setIsLoading(false);
              return;
            }
            
            analysisData = data;
          }
        } else if (storyId) {
          // First check if we already have an analysis for this story
          const { data: existingAnalysis, error: fetchError } = await supabase
            .from('ai_analyses')
            .select('*')
            .eq('story_id', storyId)
            .eq('analysis_type', 'story')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw fetchError;
          }
          
          if (existingAnalysis) {
            // Use existing analysis
            analysisData = existingAnalysis;
          } else {
            // Call the analyze-story function
            const { data, error } = await supabase.functions.invoke('analyze-story', {
              body: { 
                story_id: storyId
              }
            });
            
            if (error) {
              console.error('Error calling analyze-story function:', error);
              // Fall back to mock data if the function call fails
              setInsights(getMockStoryInsights());
              setActionItems(getMockStoryActionItems());
              setRisks(getMockStoryRisks());
              setSuggestions(getMockStorySuggestions());
              setIsLoading(false);
              return;
            }
            
            analysisData = data;
          }
        }
        
        // Set the data from the analysis
        if (analysisData) {
          setInsights(analysisData.key_points || []);
          setActionItems(analysisData.action_items || []);
          setRisks(analysisData.risks || []);
          setSuggestions(analysisData.suggestions || []);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching AI insights:', err);
        setError(err as Error);
        
        // Fall back to mock data if there's an error
        if (sessionId) {
          setInsights(getMockSessionInsights());
          setActionItems(getMockSessionActionItems());
          setRisks(getMockSessionRisks());
          setSuggestions(getMockSessionSuggestions());
        } else if (storyId) {
          setInsights(getMockStoryInsights());
          setActionItems(getMockStoryActionItems());
          setRisks(getMockStoryRisks());
          setSuggestions(getMockStorySuggestions());
        }
        
        setIsLoading(false);
      }
    };

    fetchAIInsights();
  }, [sessionId, storyId]);

  return { insights, actionItems, risks, suggestions, isLoading, error };
}

// Mock data functions
function getMockSessionInsights(): AIInsight[] {
  return [
    {
      id: '1',
      text: 'The team spent significant time discussing authentication requirements',
      confidence: 0.92,
      category: 'discussion_focus',
      source: 'transcript'
    },
    {
      id: '2',
      text: 'Multiple concerns were raised about the API rate limits',
      confidence: 0.87,
      category: 'concern',
      source: 'transcript'
    },
    {
      id: '3',
      text: 'The team agreed that mobile support should be prioritized over desktop',
      confidence: 0.95,
      category: 'decision',
      source: 'transcript'
    }
  ];
}

function getMockSessionActionItems(): ActionItem[] {
  return [
    {
      id: '1',
      text: 'Research authentication providers and prepare comparison',
      assignee: 'Alex',
      priority: 'high',
      status: 'open'
    },
    {
      id: '2',
      text: 'Contact API provider about enterprise rate limits',
      assignee: 'Jordan',
      priority: 'medium',
      status: 'in_progress'
    },
    {
      id: '3',
      text: 'Create mobile-first wireframes for approval',
      assignee: 'Taylor',
      priority: 'high',
      status: 'open'
    }
  ];
}

function getMockSessionRisks(): Risk[] {
  return [
    {
      id: '1',
      text: 'API rate limits may impact performance during peak usage',
      impact: 'high',
      likelihood: 'medium',
      mitigation: 'Implement caching and request batching'
    },
    {
      id: '2',
      text: 'Mobile-first approach may delay desktop feature parity',
      impact: 'medium',
      likelihood: 'high',
      mitigation: 'Create shared component library that works across platforms'
    }
  ];
}

function getMockSessionSuggestions(): Suggestion[] {
  return [
    {
      id: '1',
      text: 'Consider breaking the authentication story into separate stories for each provider',
      category: 'improvement',
      confidence: 0.85
    },
    {
      id: '2',
      text: 'The API integration story should include explicit rate limit handling',
      category: 'clarification',
      confidence: 0.92
    },
    {
      id: '3',
      text: 'Mobile testing should be included as acceptance criteria for all UI stories',
      category: 'improvement',
      confidence: 0.78
    }
  ];
}

function getMockStoryInsights(): AIInsight[] {
  return [
    {
      id: '1',
      text: 'This story has unclear acceptance criteria',
      confidence: 0.89,
      category: 'quality',
      source: 'analysis'
    },
    {
      id: '2',
      text: 'The story scope appears to be too large for a single sprint',
      confidence: 0.76,
      category: 'scope',
      source: 'analysis'
    }
  ];
}

function getMockStoryActionItems(): ActionItem[] {
  return [
    {
      id: '1',
      text: 'Refine acceptance criteria to be more specific and testable',
      priority: 'high',
      status: 'open'
    },
    {
      id: '2',
      text: 'Consider splitting story into smaller, more manageable pieces',
      priority: 'medium',
      status: 'open'
    }
  ];
}

function getMockStoryRisks(): Risk[] {
  return [
    {
      id: '1',
      text: 'Story may not be completable within a single sprint',
      impact: 'medium',
      likelihood: 'high',
      mitigation: 'Split into smaller stories or extend across multiple sprints'
    },
    {
      id: '2',
      text: 'Unclear acceptance criteria may lead to implementation issues',
      impact: 'high',
      likelihood: 'medium',
      mitigation: 'Refine criteria with product owner before development'
    }
  ];
}

function getMockStorySuggestions(): Suggestion[] {
  return [
    {
      id: '1',
      text: 'Add specific performance criteria to the acceptance criteria',
      category: 'improvement',
      confidence: 0.82
    },
    {
      id: '2',
      text: 'Consider splitting this story into UI and API integration components',
      category: 'alternative',
      confidence: 0.91
    },
    {
      id: '3',
      text: 'The current approach may cause performance issues on mobile devices',
      category: 'warning',
      confidence: 0.68
    }
  ];
}
