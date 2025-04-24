import { useState, useEffect } from 'react';
import { SprintPlanningData, SprintPlanningStory } from '../../types';
import { useGroomingData } from '../../hooks/useGroomingData';

/**
 * Custom hook for sprint planning operations
 * @param workspaceId The ID of the current workspace
 * @returns Object containing sprint planning data and operations
 */
export function useSprintPlanning(workspaceId: string) {
  const { sprintData, unassignedStories, isLoading, error } = useGroomingData(workspaceId);
  
  const [sprints, setSprints] = useState<SprintPlanningData[]>([]);
  const [availableStories, setAvailableStories] = useState<SprintPlanningStory[]>([]);
  
  // Initialize state when data is loaded
  useEffect(() => {
    if (!isLoading && !error) {
      setSprints(sprintData);
      setAvailableStories(unassignedStories);
    }
  }, [sprintData, unassignedStories, isLoading, error]);
  
  /**
   * Add a story to a sprint
   * @param storyId The ID of the story to add
   * @param sprintId The ID of the sprint to add to
   * @param position The position in the sprint (for priority)
   */
  const addStoryToSprint = async (storyId: string, sprintId: string, position: number = -1) => {
    try {
      // Find the story in available stories
      const storyIndex = availableStories.findIndex(story => story.id === storyId);
      if (storyIndex === -1) {
        throw new Error('Story not found in available stories');
      }
      
      // Find the sprint
      const sprintIndex = sprints.findIndex(sprint => sprint.id === sprintId);
      if (sprintIndex === -1) {
        throw new Error('Sprint not found');
      }
      
      // Create a copy of the story
      const story = { ...availableStories[storyIndex] };
      
      // Remove from available stories
      const newAvailableStories = [...availableStories];
      newAvailableStories.splice(storyIndex, 1);
      setAvailableStories(newAvailableStories);
      
      // Add to sprint
      const newSprints = [...sprints];
      const sprint = { ...newSprints[sprintIndex] };
      
      if (position === -1 || position >= sprint.stories.length) {
        // Add to the end
        sprint.stories = [...sprint.stories, story];
      } else {
        // Insert at position
        sprint.stories = [
          ...sprint.stories.slice(0, position),
          story,
          ...sprint.stories.slice(position)
        ];
      }
      
      newSprints[sprintIndex] = sprint;
      setSprints(newSprints);
      
      // In a real implementation, we would call an API to persist the change
      // await api.addStoryToSprint({ sprint_id: sprintId, story_id: storyId, position });
      
      return true;
    } catch (error) {
      console.error('Error adding story to sprint:', error);
      return false;
    }
  };
  
  /**
   * Remove a story from a sprint
   * @param storyId The ID of the story to remove
   * @param sprintId The ID of the sprint to remove from
   */
  const removeStoryFromSprint = async (storyId: string, sprintId: string) => {
    try {
      // Find the sprint
      const sprintIndex = sprints.findIndex(sprint => sprint.id === sprintId);
      if (sprintIndex === -1) {
        throw new Error('Sprint not found');
      }
      
      // Find the story in the sprint
      const sprint = sprints[sprintIndex];
      const storyIndex = sprint.stories.findIndex(story => story.id === storyId);
      if (storyIndex === -1) {
        throw new Error('Story not found in sprint');
      }
      
      // Create a copy of the story
      const story = { ...sprint.stories[storyIndex] };
      
      // Remove from sprint
      const newSprints = [...sprints];
      const newSprint = { ...sprint };
      newSprint.stories = [
        ...newSprint.stories.slice(0, storyIndex),
        ...newSprint.stories.slice(storyIndex + 1)
      ];
      newSprints[sprintIndex] = newSprint;
      setSprints(newSprints);
      
      // Add to available stories
      setAvailableStories([...availableStories, story]);
      
      // In a real implementation, we would call an API to persist the change
      // await api.removeStoryFromSprint({ sprint_id: sprintId, story_id: storyId });
      
      return true;
    } catch (error) {
      console.error('Error removing story from sprint:', error);
      return false;
    }
  };
  
  /**
   * Move a story within a sprint (reorder)
   * @param storyId The ID of the story to move
   * @param sprintId The ID of the sprint
   * @param newPosition The new position in the sprint
   */
  const moveStoryInSprint = async (storyId: string, sprintId: string, newPosition: number) => {
    try {
      // Find the sprint
      const sprintIndex = sprints.findIndex(sprint => sprint.id === sprintId);
      if (sprintIndex === -1) {
        throw new Error('Sprint not found');
      }
      
      // Find the story in the sprint
      const sprint = sprints[sprintIndex];
      const storyIndex = sprint.stories.findIndex(story => story.id === storyId);
      if (storyIndex === -1) {
        throw new Error('Story not found in sprint');
      }
      
      // Don't do anything if the position is the same
      if (storyIndex === newPosition) {
        return true;
      }
      
      // Create a copy of the story
      const story = { ...sprint.stories[storyIndex] };
      
      // Remove from current position and add to new position
      const newSprints = [...sprints];
      const newSprint = { ...sprint };
      newSprint.stories = [...newSprint.stories];
      newSprint.stories.splice(storyIndex, 1);
      newSprint.stories.splice(newPosition, 0, story);
      newSprints[sprintIndex] = newSprint;
      setSprints(newSprints);
      
      // In a real implementation, we would call an API to persist the change
      // await api.updateStoryPosition({ sprint_id: sprintId, story_id: storyId, position: newPosition });
      
      return true;
    } catch (error) {
      console.error('Error moving story in sprint:', error);
      return false;
    }
  };
  
  /**
   * Move a story between sprints
   * @param storyId The ID of the story to move
   * @param fromSprintId The ID of the source sprint
   * @param toSprintId The ID of the destination sprint
   * @param newPosition The new position in the destination sprint
   */
  const moveStoryBetweenSprints = async (
    storyId: string,
    fromSprintId: string,
    toSprintId: string,
    newPosition: number = -1
  ) => {
    try {
      // Find the source sprint
      const fromSprintIndex = sprints.findIndex(sprint => sprint.id === fromSprintId);
      if (fromSprintIndex === -1) {
        throw new Error('Source sprint not found');
      }
      
      // Find the destination sprint
      const toSprintIndex = sprints.findIndex(sprint => sprint.id === toSprintId);
      if (toSprintIndex === -1) {
        throw new Error('Destination sprint not found');
      }
      
      // Find the story in the source sprint
      const fromSprint = sprints[fromSprintIndex];
      const storyIndex = fromSprint.stories.findIndex(story => story.id === storyId);
      if (storyIndex === -1) {
        throw new Error('Story not found in source sprint');
      }
      
      // Create a copy of the story
      const story = { ...fromSprint.stories[storyIndex] };
      
      // Remove from source sprint
      const newSprints = [...sprints];
      const newFromSprint = { ...fromSprint };
      newFromSprint.stories = [
        ...newFromSprint.stories.slice(0, storyIndex),
        ...newFromSprint.stories.slice(storyIndex + 1)
      ];
      newSprints[fromSprintIndex] = newFromSprint;
      
      // Add to destination sprint
      const toSprint = newSprints[toSprintIndex];
      const newToSprint = { ...toSprint };
      
      if (newPosition === -1 || newPosition >= newToSprint.stories.length) {
        // Add to the end
        newToSprint.stories = [...newToSprint.stories, story];
      } else {
        // Insert at position
        newToSprint.stories = [
          ...newToSprint.stories.slice(0, newPosition),
          story,
          ...newToSprint.stories.slice(newPosition)
        ];
      }
      
      newSprints[toSprintIndex] = newToSprint;
      setSprints(newSprints);
      
      // In a real implementation, we would call an API to persist the change
      // await api.moveStoryBetweenSprints({
      //   story_id: storyId,
      //   from_sprint_id: fromSprintId,
      //   to_sprint_id: toSprintId,
      //   position: newPosition
      // });
      
      return true;
    } catch (error) {
      console.error('Error moving story between sprints:', error);
      return false;
    }
  };
  
  /**
   * Update sprint capacity
   * @param sprintId The ID of the sprint to update
   * @param capacity The new capacity value
   */
  const updateSprintCapacity = async (sprintId: string, capacity: number) => {
    try {
      // Find the sprint
      const sprintIndex = sprints.findIndex(sprint => sprint.id === sprintId);
      if (sprintIndex === -1) {
        throw new Error('Sprint not found');
      }
      
      // Update capacity
      const newSprints = [...sprints];
      newSprints[sprintIndex] = {
        ...newSprints[sprintIndex],
        capacity
      };
      setSprints(newSprints);
      
      // In a real implementation, we would call an API to persist the change
      // await api.updateSprint({ id: sprintId, capacity });
      
      return true;
    } catch (error) {
      console.error('Error updating sprint capacity:', error);
      return false;
    }
  };
  
  /**
   * Calculate the total story points in a sprint
   * @param sprintId The ID of the sprint
   * @returns The total story points
   */
  const calculateSprintPoints = (sprintId: string): number => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return 0;
    
    return sprint.stories.reduce((total, story) => {
      return total + (story.storyPoints || 0);
    }, 0);
  };
  
  return {
    sprints,
    availableStories,
    isLoading,
    error,
    addStoryToSprint,
    removeStoryFromSprint,
    moveStoryInSprint,
    moveStoryBetweenSprints,
    updateSprintCapacity,
    calculateSprintPoints
  };
}
