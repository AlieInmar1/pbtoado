import React from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import type { GroomingSession } from '../../types/database';

interface SessionDetailHeaderProps {
  session: GroomingSession;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SessionDetailHeader({ 
  session, 
  onEdit, 
  onDelete, 
  onRefresh,
  isLoading = false 
}: SessionDetailHeaderProps) {
  const sessionDate = new Date(session.session_date);
  const statusColors = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  // Check if any metrics exist
  const hasMetrics = 
    (session.stories_discussed !== undefined && session.stories_discussed > 0) || 
    (session.stories_completed !== undefined && session.stories_completed > 0) || 
    (session.stories_deferred !== undefined && session.stories_deferred > 0) || 
    (session.stories_split !== undefined && session.stories_split > 0);

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span>{sessionDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span>
                {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {session.duration_minutes && ` (${session.duration_minutes} min)`}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span className="capitalize">{session.session_type} Session</span>
            </div>
          </div>
          {session.preparation_notes && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Preparation Notes</h3>
              <p className="mt-1 text-sm text-gray-900">{session.preparation_notes}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end space-y-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
            {session.status}
          </span>
          <div className="flex space-x-2">
            {onRefresh && (
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {onEdit && (
              <button 
                onClick={onEdit}
                className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Session metrics summary */}
      {hasMetrics && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Stories Discussed</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{session.stories_discussed || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="mt-1 text-lg font-semibold text-green-600">{session.stories_completed || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Deferred</p>
            <p className="mt-1 text-lg font-semibold text-yellow-600">{session.stories_deferred || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Split</p>
            <p className="mt-1 text-lg font-semibold text-blue-600">{session.stories_split || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
