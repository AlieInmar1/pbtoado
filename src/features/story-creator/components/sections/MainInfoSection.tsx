import React from 'react';
import { Story, HealthStatus, TeamReference, UserReference } from '../../../../types/story-creator';

interface MainInfoSectionProps {
  story: Partial<Story>;
  onChange: (field: keyof Story, value: any) => void;
  users: any[];
  teams: any[];
}

/**
 * MainInfoSection handles the basic information for a story including
 * title, description, owner, and teams.
 */
export const MainInfoSection: React.FC<MainInfoSectionProps> = ({
  story,
  onChange,
  users,
  teams
}) => {
  // Health status options for dropdown
  const healthStatusOptions: { value: HealthStatus, label: string }[] = [
    { value: 'healthy', label: 'Healthy' },
    { value: 'at_risk', label: 'At Risk' },
    { value: 'blocked', label: 'Blocked' }
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
        <p className="text-gray-500 text-sm">
          Start by adding the core details about this story.
        </p>
      </div>
      
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="title"
            value={story.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter a clear, concise title"
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          A descriptive title that clearly communicates the feature or capability.
        </p>
      </div>
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            rows={5}
            value={story.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Provide a detailed description of the story"
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Describe the feature, including purpose, scope, and any context that would help the development team.
        </p>
      </div>
      
      {/* Owner */}
      <div>
        <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
          Owner
        </label>
        <div className="mt-1">
          <select
            id="owner"
            value={story.owner_id || ''}
            onChange={(e) => {
              const selectedUser = users.find(u => u.id === e.target.value);
              onChange('owner_id', e.target.value);
              onChange('owner_name', selectedUser ? selectedUser.name : '');
            }}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">Select an owner</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The person responsible for shepherding this story from concept to completion.
        </p>
      </div>
      
      {/* Health */}
      <div>
        <label htmlFor="health" className="block text-sm font-medium text-gray-700">
          Health Status
        </label>
        <div className="mt-1">
          <select
            id="health"
            value={story.health || ''}
            onChange={(e) => onChange('health', e.target.value as HealthStatus)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">Select health status</option>
            {healthStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Current health of the story implementation.
        </p>
      </div>
      
      {/* Teams */}
      <div>
        <label htmlFor="teams" className="block text-sm font-medium text-gray-700">
          Teams
        </label>
        <div className="mt-1">
          <select
            id="teams"
            multiple
            value={story.teams || []}
            onChange={(e) => {
              const selectedTeams = Array.from(e.target.selectedOptions, option => option.value);
              onChange('teams', selectedTeams);
            }}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The teams that will be involved in implementing this story. Hold Ctrl/Cmd to select multiple.
        </p>
      </div>
    </div>
  );
};
