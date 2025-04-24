import React, { useState, memo } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { SprintPlanningStory } from '../../types';
import { StoryCard } from './StoryCard';
import { groupStoriesByFeature } from '../utils/sprintCalculations';

interface UnassignedStoriesLaneProps {
  stories: SprintPlanningStory[];
  className?: string;
}

// Use memo to improve performance and handle defaults with ES6 parameter defaults
// This addresses the React warning about defaultProps on memo components
const UnassignedStoriesLaneComponent = ({ 
  stories, 
  className = '' 
}: UnassignedStoriesLaneProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByFeature, setGroupByFeature] = useState(false);
  
  // Filter stories based on search term
  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (story.description && story.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Group stories by feature if needed
  const storiesToRender = !groupByFeature 
    ? filteredStories 
    : Object.entries(groupStoriesByFeature(filteredStories)).flatMap(([featureId, featureStories]) => {
        // Add a feature header if it's not the unassigned group
        if (featureId !== 'unassigned' && featureStories.length > 0) {
          return [
            // This is just a visual separator, not a real story
            { 
              id: `feature-header-${featureId}`, 
              title: `Feature: ${featureId}`, 
              status: 'header',
              isHeader: true
            } as SprintPlanningStory & { isHeader: boolean },
            ...featureStories
          ];
        }
        return featureStories;
      });
  
  return (
    <div className={`bg-gray-50 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Available Stories</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {filteredStories.length} stories
          </span>
        </div>
        
        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input 
              type="search" 
              className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Search stories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <input 
              id="group-by-feature" 
              type="checkbox" 
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              checked={groupByFeature}
              onChange={() => setGroupByFeature(!groupByFeature)}
            />
            <label htmlFor="group-by-feature" className="ml-2 text-sm font-medium text-gray-700">
              Group by feature
            </label>
          </div>
        </div>
      </div>
      
      {/* Stories container */}
      <Droppable droppableId="unassigned">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-4 min-h-[300px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {storiesToRender.length === 0 ? (
              <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 text-sm">No stories available</p>
              </div>
            ) : (
              storiesToRender.map((story, index) => {
                // If this is a feature header, render a separator instead of a story card
                if ('isHeader' in story && story.isHeader) {
                  return (
                    <div 
                      key={story.id} 
                      className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-md mb-2"
                    >
                      {story.title}
                    </div>
                  );
                }
                
                // Otherwise render a normal story card
                return (
                  <StoryCard 
                    key={story.id} 
                    story={story} 
                    index={index} 
                  />
                );
              })
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Export a memoized version of the component
export const UnassignedStoriesLane = memo(UnassignedStoriesLaneComponent);
