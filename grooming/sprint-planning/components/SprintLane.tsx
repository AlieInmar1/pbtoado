import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { SprintPlanningData } from '../../types';
import { StoryCard } from './StoryCard';
import { SprintCapacityIndicator } from './SprintCapacityIndicator';
import { formatDateRange } from '../../utils/dateUtils';
import { calculateTotalPoints, calculateSprintRisk } from '../utils/sprintCalculations';

interface SprintLaneProps {
  sprint: SprintPlanningData;
  className?: string;
}

export function SprintLane({ sprint, className = '' }: SprintLaneProps) {
  const totalPoints = calculateTotalPoints(sprint);
  const riskLevel = calculateSprintRisk(sprint);
  
  // Get risk badge color
  const getRiskBadgeColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className={`bg-gray-50 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Sprint header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{sprint.name}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskBadgeColor(riskLevel)}`}>
            {riskLevel} risk
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          {formatDateRange(sprint.startDate, sprint.endDate)}
        </div>
        
        <SprintCapacityIndicator 
          used={totalPoints} 
          total={sprint.capacity} 
          className="mb-2"
        />
      </div>
      
      {/* Stories container */}
      <Droppable droppableId={sprint.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-4 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {sprint.stories.length === 0 ? (
              <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 text-sm">Drop stories here</p>
              </div>
            ) : (
              sprint.stories.map((story, index) => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  index={index} 
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      
      {/* Sprint footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{sprint.stories.length} stories</span>
          <span>{totalPoints} points</span>
        </div>
      </div>
    </div>
  );
}
