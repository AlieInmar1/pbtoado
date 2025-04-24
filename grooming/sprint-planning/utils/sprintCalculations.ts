import { SprintPlanningData, SprintPlanningStory } from '../../types';
import { getDaysBetween } from '../../utils/dateUtils';

/**
 * Calculate the total story points in a sprint
 * @param sprint The sprint data
 * @returns The total story points
 */
export function calculateTotalPoints(sprint: SprintPlanningData): number {
  return sprint.stories.reduce((total, story) => {
    return total + (story.storyPoints || 0);
  }, 0);
}

/**
 * Calculate the capacity utilization of a sprint
 * @param sprint The sprint data
 * @returns The percentage of capacity utilized (0-100)
 */
export function calculateCapacityUtilization(sprint: SprintPlanningData): number {
  const totalPoints = calculateTotalPoints(sprint);
  if (sprint.capacity === 0) return 0;
  
  return Math.min(100, Math.round((totalPoints / sprint.capacity) * 100));
}

/**
 * Check if a sprint is overallocated
 * @param sprint The sprint data
 * @returns Boolean indicating if the sprint is overallocated
 */
export function isSprintOverallocated(sprint: SprintPlanningData): boolean {
  return calculateTotalPoints(sprint) > sprint.capacity;
}

/**
 * Calculate the average complexity of stories in a sprint
 * @param sprint The sprint data
 * @returns The average complexity (or 0 if no stories)
 */
export function calculateAverageComplexity(sprint: SprintPlanningData): number {
  if (sprint.stories.length === 0) return 0;
  
  const totalComplexity = sprint.stories.reduce((total, story) => {
    return total + (story.complexity || 0);
  }, 0);
  
  return parseFloat((totalComplexity / sprint.stories.length).toFixed(1));
}

/**
 * Calculate the risk level of a sprint
 * @param sprint The sprint data
 * @returns Risk level: 'low', 'medium', or 'high'
 */
export function calculateSprintRisk(sprint: SprintPlanningData): 'low' | 'medium' | 'high' {
  const utilization = calculateCapacityUtilization(sprint);
  const avgComplexity = calculateAverageComplexity(sprint);
  const highRiskStories = sprint.stories.filter(story => story.riskRating && story.riskRating > 3).length;
  const highRiskPercentage = (highRiskStories / sprint.stories.length) * 100;
  
  if (utilization > 90 || avgComplexity > 4 || highRiskPercentage > 30) {
    return 'high';
  } else if (utilization > 75 || avgComplexity > 3 || highRiskPercentage > 15) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Calculate the recommended daily velocity for a sprint
 * @param sprint The sprint data
 * @returns The recommended daily velocity (points per day)
 */
export function calculateDailyVelocity(sprint: SprintPlanningData): number {
  const totalPoints = calculateTotalPoints(sprint);
  const sprintDays = getDaysBetween(sprint.startDate, sprint.endDate);
  
  // Assume we need 1 day buffer at the end
  const effectiveWorkDays = Math.max(1, sprintDays - 1);
  
  return parseFloat((totalPoints / effectiveWorkDays).toFixed(1));
}

/**
 * Sort stories by priority (assuming the order in the array represents priority)
 * @param stories Array of stories
 * @returns Sorted array of stories
 */
export function sortStoriesByPriority(stories: SprintPlanningStory[]): SprintPlanningStory[] {
  // In this implementation, we assume the stories are already in priority order
  // In a real implementation, we might have a priority field to sort by
  return [...stories];
}

/**
 * Group stories by feature
 * @param stories Array of stories
 * @returns Object with feature IDs as keys and arrays of stories as values
 */
export function groupStoriesByFeature(stories: SprintPlanningStory[]): Record<string, SprintPlanningStory[]> {
  const grouped: Record<string, SprintPlanningStory[]> = {};
  
  stories.forEach(story => {
    const featureId = story.featureId || 'unassigned';
    if (!grouped[featureId]) {
      grouped[featureId] = [];
    }
    grouped[featureId].push(story);
  });
  
  return grouped;
}

/**
 * Calculate the optimal distribution of stories across sprints
 * @param stories Array of stories to distribute
 * @param sprints Array of sprints to distribute to
 * @returns Object with sprint IDs as keys and arrays of story IDs as values
 */
export function calculateOptimalDistribution(
  stories: SprintPlanningStory[],
  sprints: SprintPlanningData[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  // Initialize result with empty arrays for each sprint
  sprints.forEach(sprint => {
    result[sprint.id] = [];
  });
  
  // Sort sprints by start date
  const sortedSprints = [...sprints].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  // Sort stories by priority (highest first)
  const sortedStories = sortStoriesByPriority(stories);
  
  // Simple greedy algorithm: assign each story to the sprint with the most remaining capacity
  sortedStories.forEach(story => {
    // Calculate remaining capacity for each sprint
    const sprintCapacity: Record<string, number> = {};
    
    sortedSprints.forEach(sprint => {
      const assignedStoryIds = result[sprint.id];
      const assignedStories = assignedStoryIds.map(id => 
        stories.find(s => s.id === id)
      ).filter(Boolean) as SprintPlanningStory[];
      
      const assignedPoints = assignedStories.reduce((total, s) => total + (s.storyPoints || 0), 0);
      sprintCapacity[sprint.id] = sprint.capacity - assignedPoints;
    });
    
    // Find sprint with most remaining capacity that can fit this story
    const storyPoints = story.storyPoints || 0;
    let bestSprintId = sortedSprints[0].id;
    let bestRemainingCapacity = -Infinity;
    
    for (const sprint of sortedSprints) {
      const remainingCapacity = sprintCapacity[sprint.id];
      if (remainingCapacity >= storyPoints && remainingCapacity > bestRemainingCapacity) {
        bestSprintId = sprint.id;
        bestRemainingCapacity = remainingCapacity;
      }
    }
    
    // Assign story to best sprint
    result[bestSprintId].push(story.id);
  });
  
  return result;
}
