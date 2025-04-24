import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  getStoryTemplates,
  getStoryTemplateById,
  createStoryTemplate,
  updateStoryTemplate,
  deleteStoryTemplate,
  analyzeStoryContent,
  createStoryWithAI,
  trackAISuggestion
} from '../lib/api/storyCreator';
import {
  StoryTemplate,
  CreateStoryTemplateRequest,
  UpdateStoryTemplateRequest,
  AnalyzeStoryRequest,
  AIAnalysisResult,
  CreateStoryWithAIRequest,
  StoryCreationResult
} from '../types/story-creator';

/**
 * Custom hook for story creator functionality
 */
export function useStoryCreator() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  
  // Get all templates
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates
  } = useQuery({
    queryKey: ['storyTemplates', currentWorkspace?.id],
    queryFn: () => currentWorkspace ? getStoryTemplates(currentWorkspace.id) : Promise.resolve([]),
    enabled: !!currentWorkspace,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get template by ID
  const getTemplate = useCallback((templateId: string) => {
    return queryClient.fetchQuery({
      queryKey: ['storyTemplate', templateId],
      queryFn: () => getStoryTemplateById(templateId)
    });
  }, [queryClient]);
  
  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (template: CreateStoryTemplateRequest) => createStoryTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storyTemplates'] });
    }
  });
  
  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: (template: UpdateStoryTemplateRequest) => updateStoryTemplate(template),
    onSuccess: (data: StoryTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['storyTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['storyTemplate', data.id] });
    }
  });
  
  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => deleteStoryTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storyTemplates'] });
    }
  });
  
  // Analyze story content
  const analyzeStory = useCallback(async (storyData: AnalyzeStoryRequest) => {
    if (!currentWorkspace) return null;
    
    setAnalyzing(true);
    try {
      const result = await analyzeStoryContent({
        ...storyData,
        workspace_id: currentWorkspace.id
      });
      setAnalysisResult(result);
      return result;
    } catch (error) {
      console.error('Error analyzing story:', error);
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [currentWorkspace]);
  
  // Create story with AI mutation
  const createStoryMutation = useMutation({
    mutationFn: (request: CreateStoryWithAIRequest) => createStoryWithAI(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grooming_stories'] });
    }
  });
  
  // Track AI suggestion
  const trackSuggestion = useCallback(async (
    storyId: string,
    fieldName: string,
    suggestion: string,
    confidence: number,
    accepted: boolean
  ) => {
    if (!currentWorkspace) return false;
    
    try {
      return await trackAISuggestion(
        storyId,
        fieldName,
        suggestion,
        confidence,
        accepted,
        currentWorkspace.id
      );
    } catch (error) {
      console.error('Error tracking suggestion:', error);
      return false;
    }
  }, [currentWorkspace]);
  
  return {
    // Templates
    templates,
    templatesLoading,
    templatesError,
    refetchTemplates,
    getTemplate,
    createTemplate: createTemplateMutation.mutate,
    isCreatingTemplate: createTemplateMutation.isPending,
    updateTemplate: updateTemplateMutation.mutate,
    isUpdatingTemplate: updateTemplateMutation.isPending,
    deleteTemplate: deleteTemplateMutation.mutate,
    isDeletingTemplate: deleteTemplateMutation.isPending,
    
    // Analysis
    analyzing,
    analysisResult,
    analyzeStory,
    
    // Story creation
    createStory: createStoryMutation.mutate,
    isCreatingStory: createStoryMutation.isPending,
    createStoryError: createStoryMutation.error,
    
    // Suggestion tracking
    trackSuggestion
  };
}
