import React from 'react';
import { Story, StoryReference } from '../../../../types/story-creator';
import { T_SHIRT_SIZES } from '../../../../config/constants';

interface PlanningSectionProps {
  story: Partial<Story>;
  onChange: (field: keyof Story, value: any) => void;
  allStories?: Partial<Story>[];
  dependencies?: StoryReference[];
}

/**
 * PlanningSection allows users to input planning details for the story,
 * including timeframe, effort estimation, and dependencies.
 */
export const PlanningSection: React.FC<PlanningSectionProps> = ({
  story,
  onChange,
  allStories = [],
  dependencies = []
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Planning Details</h2>
        <p className="text-gray-500 text-sm">
          Add information to help plan and schedule the implementation of this story.
        </p>
      </div>
      
      {/* Timeframe */}
      <div>
        <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
          Timeframe
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="timeframe"
            value={story.timeframe || ''}
            onChange={(e) => onChange('timeframe', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="e.g., Q1 2025, Sprint 45, May 2025"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          When is this story planned for implementation? (quarter, month, sprint, etc.)
        </p>
      </div>
      
      {/* T-Shirt Sizing */}
      <div>
        <label htmlFor="t_shirt_sizing" className="block text-sm font-medium text-gray-700">
          T-Shirt Size
        </label>
        <div className="mt-1">
          <select
            id="t_shirt_sizing"
            value={story.t_shirt_sizing || ''}
            onChange={(e) => onChange('t_shirt_sizing', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">Select size</option>
            {T_SHIRT_SIZES.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          High-level estimate of the amount of work required.
        </p>
      </div>
      
      {/* Story Points */}
      <div>
        <label htmlFor="engineering_assigned_story_points" className="block text-sm font-medium text-gray-700">
          Engineering Story Points
        </label>
        <div className="mt-1">
          <input
            type="number"
            id="engineering_assigned_story_points"
            min={0}
            value={story.engineering_assigned_story_points || ''}
            onChange={(e) => onChange('engineering_assigned_story_points', e.target.value === '' ? undefined : parseInt(e.target.value))}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter story points"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Engineering's estimate of effort in story points.
        </p>
      </div>
      
      {/* OS Compatibility */}
      <div>
        <label htmlFor="os_compatibility" className="block text-sm font-medium text-gray-700">
          OS Compatibility (1-10)
        </label>
        <div className="mt-1">
          <input
            type="range"
            id="os_compatibility"
            min={1}
            max={10}
            value={story.os_compatibility || 5}
            onChange={(e) => onChange('os_compatibility', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Specific to one OS</span>
            <span>Works across all OS</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          How well will this feature work across different operating systems?
        </p>
      </div>
      
      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="loe_requested"
              type="checkbox"
              checked={story.loe_requested || false}
              onChange={(e) => onChange('loe_requested', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="loe_requested" className="font-medium text-gray-700">Level of Effort Requested</label>
            <p className="text-gray-500">
              Has an LOE been formally requested from engineering?
            </p>
          </div>
        </div>
      </div>
      
      {/* Matching ID */}
      <div>
        <label htmlFor="matching_id" className="block text-sm font-medium text-gray-700">
          Matching ID
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="matching_id"
            value={story.matching_id || ''}
            onChange={(e) => onChange('matching_id', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter matching ID"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional ID that can be used to match this story with external systems.
        </p>
      </div>
      
      {/* Dependencies */}
      <div>
        <label htmlFor="dependencies" className="block text-sm font-medium text-gray-700">
          Dependencies
        </label>
        <div className="mt-1">
          <select
            id="dependencies"
            multiple
            value={(story.dependencies || []).map(dep => dep.id)}
            onChange={(e) => {
              const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
              // Map IDs back to StoryReference objects
              const selectedDependencies = selectedIds.map(id => {
                const dependency = dependencies.find(d => d.id === id);
                return {
                  id,
                  title: dependency?.title || 'Unknown Story',
                  type: dependency?.type || 'story'
                };
              });
              onChange('dependencies', selectedDependencies);
            }}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            {dependencies.map(dependency => (
              <option key={dependency.id} value={dependency.id}>
                {dependency.title || `ID: ${dependency.id}`}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Stories that this story depends on. Hold Ctrl/Cmd to select multiple.
        </p>
      </div>
      
      {/* Integration Options */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Integration Options</h3>
        
        <div className="mt-3 space-y-3">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="sync_with_productboard"
                type="checkbox"
                checked={story.sync_with_productboard || false}
                onChange={(e) => onChange('sync_with_productboard', e.target.checked)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="sync_with_productboard" className="font-medium text-gray-700">Sync with ProductBoard</label>
              <p className="text-gray-500">
                Keep this story synchronized with ProductBoard when changes are made.
              </p>
            </div>
          </div>
          
          {/* Azure Work Item ID */}
          <div>
            <label htmlFor="azure_workitem_id" className="block text-sm font-medium text-gray-700">
              Azure DevOps Work Item ID
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="azure_workitem_id"
                value={story.azure_workitem_id || ''}
                onChange={(e) => onChange('azure_workitem_id', e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter Azure DevOps ID"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Link this story to an existing Azure DevOps work item.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
