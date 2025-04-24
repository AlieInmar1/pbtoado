import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { SprintLane } from './SprintLane';
import { UnassignedStoriesLane } from './UnassignedStoriesLane';
import { useSprintPlanning } from '../hooks/useSprintPlanning';
import { calculateOptimalDistribution } from '../utils/sprintCalculations';
import { Button } from '../../../src/components/ui/shadcn/button';

interface SprintPlanningBoardProps {
  workspaceId?: string;
  className?: string;
}

export function SprintPlanningBoard({ workspaceId = '00000000-0000-0000-0000-000000000000', className = '' }: SprintPlanningBoardProps) {
  const {
    sprints,
    availableStories,
    isLoading,
    error,
    addStoryToSprint,
    removeStoryFromSprint,
    moveStoryInSprint,
    moveStoryBetweenSprints
  } = useSprintPlanning(workspaceId);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Moving within the same sprint
    if (source.droppableId === destination.droppableId && source.droppableId !== 'unassigned') {
      moveStoryInSprint(
        sprints.find((s: any) => s.id === source.droppableId)?.stories[source.index].id || '',
        source.droppableId,
        destination.index
      );
      return;
    }
    
    // Moving from unassigned to a sprint
    if (source.droppableId === 'unassigned') {
      addStoryToSprint(
        availableStories[source.index].id,
        destination.droppableId,
        destination.index
      );
      return;
    }
    
    // Moving from a sprint to unassigned
    if (destination.droppableId === 'unassigned') {
      removeStoryFromSprint(
        sprints.find((s: any) => s.id === source.droppableId)?.stories[source.index].id || '',
        source.droppableId
      );
      return;
    }
    
    // Moving between sprints
    moveStoryBetweenSprints(
      sprints.find((s: any) => s.id === source.droppableId)?.stories[source.index].id || '',
      source.droppableId,
      destination.droppableId,
      destination.index
    );
  };
  
  // Handle auto-distribution of stories
  const handleAutoDistribute = () => {
    setIsOptimizing(true);
    
    // Calculate optimal distribution
    const distribution = calculateOptimalDistribution(availableStories, sprints);
    
    // Apply the distribution (in a real app, we would do this with a batch operation)
    const applyDistribution = async () => {
      // First, remove all stories from sprints (in a real app, we would have a batch operation)
      for (const sprint of sprints) {
        for (const story of [...sprint.stories]) {
          await removeStoryFromSprint(story.id, sprint.id);
        }
      }
      
      // Then, add stories to sprints according to the distribution
      for (const [sprintId, storyIds] of Object.entries(distribution)) {
        for (const storyId of storyIds) {
          const story = availableStories.find((s: any) => s.id === storyId);
          if (story) {
            await addStoryToSprint(storyId, sprintId);
          }
        }
      }
      
      setIsOptimizing(false);
    };
    
    applyDistribution();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error.message}</span>
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sprint Planning Board</h1>
        
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAutoDistribute}
            disabled={isOptimizing || availableStories.length === 0}
          >
            {isOptimizing ? 'Optimizing...' : 'Auto-Distribute Stories'}
          </Button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="mb-6">
          <UnassignedStoriesLane stories={availableStories} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map(sprint => (
            <SprintLane key={sprint.id} sprint={sprint} />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
