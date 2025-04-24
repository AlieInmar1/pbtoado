import { useState, useEffect } from 'react';
import { useGroomingStories } from '../../src/hooks/useGroomingStories';
import { useGroomingSessions } from '../../src/hooks/useGroomingSessions';
import { useSprints } from '../../src/hooks/useSprints';
import { SprintPlanningData, SprintPlanningStory } from '../types';
import { GroomingStory, Sprint, SprintStory } from '../../src/types/grooming';

// Mock data for development and fallback
const MOCK_SPRINTS: SprintPlanningData[] = [
  {
    id: 'sprint-1',
    name: 'Sprint 1',
    startDate: '2025-04-15',
    endDate: '2025-04-29',
    capacity: 40,
    stories: []
  },
  {
    id: 'sprint-2',
    name: 'Sprint 2',
    startDate: '2025-04-30',
    endDate: '2025-05-14',
    capacity: 35,
    stories: []
  }
];

const MOCK_STORIES: SprintPlanningStory[] = [
  {
    id: 'story-1',
    title: 'Implement Sprint Planning Board',
    description: 'Create a drag-and-drop interface for sprint planning',
    storyPoints: 8,
    complexity: 2, // medium complexity (1=low, 2=medium, 3=high)
    status: 'groomed',
    featureId: 'feature-1'
  },
  {
    id: 'story-2',
    title: 'Create Analytics Dashboard',
    description: 'Implement metrics visualization for grooming process',
    storyPoints: 5,
    complexity: 2, // medium complexity
    status: 'groomed',
    featureId: 'feature-2'
  },
  {
    id: 'story-3',
    title: 'Integrate AI Analysis Results',
    description: 'Display AI insights from transcript analysis',
    storyPoints: 13,
    complexity: 3, // high complexity
    status: 'groomed',
    featureId: 'feature-3'
  }
];

/**
 * Custom hook to fetch and transform data for grooming components
 * @param workspaceId The ID of the current workspace
 * @returns Object containing sprint data, unassigned stories, loading state, and error
 */
export function useGroomingData(workspaceId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sprintData, setSprintData] = useState<SprintPlanningData[]>([]);
  const [unassignedStories, setUnassignedStories] = useState<SprintPlanningStory[]>([]);
  const [useMockData, setUseMockData] = useState(false);
  
  // Use a valid workspace ID or fallback to a default one with a valid UUID format
  const DEFAULT_WORKSPACE_UUID = '00000000-0000-0000-0000-000000000000';
  const safeWorkspaceId = workspaceId || DEFAULT_WORKSPACE_UUID;
  
  // Fetch sprints
  const { 
    data: sprintsData, 
    isLoading: sprintsLoading, 
    error: sprintsError 
  } = useSprints({ workspace_id: safeWorkspaceId });
  
  // Fetch stories that are groomed but not in a sprint
  const { 
    data: storiesData, 
    isLoading: storiesLoading, 
    error: storiesError 
  } = useGroomingStories({ workspace_id: safeWorkspaceId, status: 'groomed' });
  
  // Fetch sprint stories for each sprint
  const [sprintStories, setSprintStories] = useState<Record<string, SprintStory[]>>({});
  const [sprintStoriesLoading, setSprintStoriesLoading] = useState(true);
  const [sprintStoriesError, setSprintStoriesError] = useState<Error | null>(null);
  
  // Effect to detect API errors and switch to mock data if needed
  useEffect(() => {
    if (sprintsError || storiesError) {
      console.warn('API errors detected, falling back to mock data:', { 
        sprintsError, 
        storiesError 
      });
      setUseMockData(true);
    }
  }, [sprintsError, storiesError]);
  
  // Effect to fetch sprint stories when sprints are loaded
  useEffect(() => {
    if (!sprintsLoading && !sprintsError && sprintsData?.data.length) {
      const fetchSprintStories = async () => {
        const sprintIds = sprintsData.data.map(sprint => sprint.id);
        const storiesMap: Record<string, SprintStory[]> = {};
        
        try {
          // In a real implementation, we would use Promise.all to fetch stories for all sprints
          // For simplicity, we're just setting up the structure here
          for (const sprintId of sprintIds) {
            storiesMap[sprintId] = [];
          }
          
          setSprintStories(storiesMap);
          setSprintStoriesLoading(false);
        } catch (err) {
          console.error('Error fetching sprint stories:', err);
          setSprintStoriesError(err as Error);
          setSprintStoriesLoading(false);
          setUseMockData(true);
        }
      };
      
      fetchSprintStories();
    } else if (!sprintsLoading && (!sprintsData?.data.length || sprintsError)) {
      // No sprints data or error occurred
      setSprintStoriesLoading(false);
    }
  }, [sprintsData, sprintsLoading, sprintsError]);
  
  // Transform data when all fetches are complete or use mock data
  useEffect(() => {
    if (useMockData) {
      console.log('Using mock data for sprint planning');
      setSprintData(MOCK_SPRINTS);
      setUnassignedStories(MOCK_STORIES);
      setIsLoading(false);
      return;
    }
    
    if (sprintsError) setError(sprintsError as Error);
    if (storiesError) setError(storiesError as Error);
    if (sprintStoriesError) setError(sprintStoriesError);
    
    const allLoaded = !sprintsLoading && !storiesLoading && !sprintStoriesLoading;
    
    if (allLoaded) {
      try {
        // Transform sprints data
        const transformedSprints = sprintsData?.data.map(sprint => transformSprint(sprint, sprintStories[sprint.id] || [])) || [];
        setSprintData(transformedSprints);
        
        // Transform unassigned stories
        const assignedStoryIds = new Set(
          Object.values(sprintStories)
            .flat()
            .map(sprintStory => sprintStory.story_id)
        );
        
        const transformedUnassignedStories = storiesData?.data
          .filter(story => !assignedStoryIds.has(story.id))
          .map(transformStory) || [];
        
        setUnassignedStories(transformedUnassignedStories);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error transforming data:', err);
        setError(err as Error);
        setIsLoading(false);
        setUseMockData(true);
      }
    }
  }, [
    sprintsData, 
    storiesData, 
    sprintStories, 
    sprintsLoading, 
    storiesLoading, 
    sprintStoriesLoading, 
    sprintsError, 
    storiesError, 
    sprintStoriesError,
    useMockData
  ]);
  
  return { sprintData, unassignedStories, isLoading, error };
}

/**
 * Transform a Sprint and its stories into SprintPlanningData
 * @param sprint The Sprint object from the API
 * @param sprintStories The SprintStory objects for this sprint
 * @returns Transformed SprintPlanningData
 */
function transformSprint(sprint: Sprint, sprintStories: SprintStory[]): SprintPlanningData {
  return {
    id: sprint.id,
    name: sprint.name,
    startDate: sprint.start_date,
    endDate: sprint.end_date,
    capacity: sprint.capacity_points || 0,
    stories: sprintStories
      .map(sprintStory => sprintStory.story ? transformStory(sprintStory.story) : null)
      .filter((story): story is SprintPlanningStory => story !== null)
  };
}

/**
 * Transform a GroomingStory into a SprintPlanningStory
 * @param story The GroomingStory object from the API
 * @returns Transformed SprintPlanningStory
 */
function transformStory(story: GroomingStory): SprintPlanningStory {
  return {
    id: story.id,
    title: story.title,
    description: story.description,
    storyPoints: story.story_points,
    complexity: story.complexity || 2, // Default to medium (2) if not provided
    status: story.status,
    featureId: story.pb_feature_id
  };
}
