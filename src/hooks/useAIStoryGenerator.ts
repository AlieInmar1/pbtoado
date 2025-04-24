import { useState } from 'react';
import { generateStoryFromIdea, getSuggestionsForStory, StoryGenerationInput, StoryGenerationOutput } from '../lib/api/aiStoryGenerator';

interface UseAIStoryGeneratorOptions {
  onSuccess?: (data: StoryGenerationOutput) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for AI-powered story generation
 */
export function useAIStoryGenerator(options: UseAIStoryGeneratorOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<StoryGenerationOutput | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<Partial<StoryGenerationOutput> | null>(null);

  // Generate a complete story from an idea
  const generateStory = async (input: StoryGenerationInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateStoryFromIdea(input);
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get suggestions for story fields based on an idea (lighter weight)
  const getFieldSuggestions = async (input: StoryGenerationInput) => {
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    
    try {
      const result = await getSuggestionsForStory(input);
      setSuggestions(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setSuggestionsError(error);
      throw error;
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Clear all state
  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
    setSuggestionsLoading(false);
    setSuggestionsError(null);
    setSuggestions(null);
  };

  return {
    // Main story generation
    generateStory,
    loading,
    error,
    data,
    
    // Suggestions
    getFieldSuggestions,
    suggestionsLoading,
    suggestionsError,
    suggestions,
    
    // Utilities
    reset
  };
}
