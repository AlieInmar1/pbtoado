import React, { useState } from 'react';
import { CheckIcon, ClockIcon, PlayIcon } from '@heroicons/react/24/outline';
import type { GroomingSession } from '../../types/database';

interface SessionStatusToggleProps {
  session: GroomingSession;
  onStatusChange: (newStatus: 'planned' | 'in_progress' | 'completed') => Promise<void>;
  disabled?: boolean;
}

export function SessionStatusToggle({ 
  session, 
  onStatusChange,
  disabled = false 
}: SessionStatusToggleProps) {
  const [isChanging, setIsChanging] = useState(false);
  
  const statusInfo = {
    planned: {
      icon: ClockIcon,
      label: 'Planned',
      color: 'bg-blue-100 text-blue-800',
      nextStatus: 'in_progress' as const,
      nextLabel: 'Start Session',
      nextIcon: PlayIcon,
      nextColor: 'bg-yellow-500 hover:bg-yellow-600',
    },
    in_progress: {
      icon: PlayIcon,
      label: 'In Progress',
      color: 'bg-yellow-100 text-yellow-800',
      nextStatus: 'completed' as const,
      nextLabel: 'Complete Session',
      nextIcon: CheckIcon,
      nextColor: 'bg-green-500 hover:bg-green-600',
    },
    completed: {
      icon: CheckIcon,
      label: 'Completed',
      color: 'bg-green-100 text-green-800',
      nextStatus: null,
      nextLabel: null,
      nextIcon: null,
      nextColor: null,
    },
  };

  const currentStatus = statusInfo[session.status];
  
  const handleStatusChange = async () => {
    if (!currentStatus.nextStatus || disabled || isChanging) return;
    
    setIsChanging(true);
    try {
      await onStatusChange(currentStatus.nextStatus);
    } catch (error) {
      console.error('Error changing session status:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className={`inline-flex items-center p-1.5 rounded-full ${currentStatus.color}`}>
            <currentStatus.icon className="h-5 w-5" />
          </span>
          <span className="ml-2 text-sm font-medium text-gray-900">Status: {currentStatus.label}</span>
        </div>
        
        {currentStatus.nextStatus && (
          <button
            onClick={handleStatusChange}
            disabled={disabled || isChanging}
            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${currentStatus.nextColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
          >
            {isChanging ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>
                <currentStatus.nextIcon className="h-4 w-4 mr-1.5" />
                {currentStatus.nextLabel}
              </>
            )}
          </button>
        )}
      </div>
      
      {session.status === 'planned' && (
        <p className="mt-2 text-xs text-gray-500">
          Start the session when all participants are ready. This will record the start time.
        </p>
      )}
      
      {session.status === 'in_progress' && (
        <p className="mt-2 text-xs text-gray-500">
          Complete the session when all stories have been discussed. This will record the end time and finalize metrics.
        </p>
      )}
    </div>
  );
}
