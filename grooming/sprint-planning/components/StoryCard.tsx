import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { SprintPlanningStory } from '../../types';
import { getStatusColor, getRiskColor } from '../../utils/colorUtils';

interface StoryCardProps {
  story: SprintPlanningStory;
  index: number;
  isDragging?: boolean;
}

export function StoryCard({ story, index, isDragging = false }: StoryCardProps) {
  // Determine complexity indicator
  const getComplexityIndicator = (complexity?: number) => {
    if (!complexity) return null;
    
    const dots: React.ReactNode[] = [];
    const maxComplexity = 5;
    
    for (let i = 0; i < maxComplexity; i++) {
      dots.push(
        <div 
          key={i}
          className={`w-2 h-2 rounded-full ${i < complexity ? 'bg-blue-500' : 'bg-gray-200'}`}
        />
      );
    }
    
    return (
      <div className="flex space-x-1 mt-2" title={`Complexity: ${complexity}/${maxComplexity}`}>
        {dots}
      </div>
    );
  };
  
  // Determine risk indicator
  const getRiskIndicator = (riskRating?: number) => {
    if (!riskRating) return null;
    
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskRating <= 2) {
      riskLevel = 'low';
    } else if (riskRating <= 3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }
    
    return (
      <div 
        className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(riskLevel)}`}
        title={`Risk: ${riskRating}/5`}
      >
        {riskLevel} risk
      </div>
    );
  };
  
  return (
    <Draggable draggableId={story.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white rounded-lg shadow-sm p-3 mb-2 border border-gray-200
            ${snapshot.isDragging ? 'shadow-md' : ''}
            ${isDragging ? 'opacity-50' : 'opacity-100'}
            transition-all duration-200
          `}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900 text-sm mb-1 flex-1">{story.title}</h3>
            {story.storyPoints && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {story.storyPoints} pts
              </span>
            )}
          </div>
          
          {story.description && (
            <p className="text-gray-600 text-xs mb-2 line-clamp-2" title={story.description}>
              {story.description}
            </p>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex space-x-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(story.status)}`}>
                {story.status}
              </span>
              {getRiskIndicator(story.riskRating)}
            </div>
            
            {getComplexityIndicator(story.complexity)}
          </div>
        </div>
      )}
    </Draggable>
  );
}
