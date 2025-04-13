import React from 'react';
import { CalendarIcon, ClockIcon, UserGroupIcon, CheckCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../ui/Card';
import type { GroomingSession } from '../../types/database';

interface GroomingSessionCardProps {
  session: GroomingSession;
  onClick: () => void;
  onUploadTranscript: () => void;
}

export function GroomingSessionCard({ session, onClick, onUploadTranscript }: GroomingSessionCardProps) {
  const sessionDate = new Date(session.session_date);
  const statusColors = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{session.name}</h3>
            <div className="mt-1 space-y-1">
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4 mr-1.5" />
                {sessionDate.toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1.5" />
                {sessionDate.toLocaleTimeString()} ({session.duration_minutes} min)
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <UserGroupIcon className="h-4 w-4 mr-1.5" />
                {session.session_type}
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
            {session.status === 'completed' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
            {session.status}
          </span>
        </div>
        {session.status === 'completed' && !session.transcript && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUploadTranscript();
            }}
            className="mt-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />
            Upload Transcript
          </button>
        )}
      </CardContent>
    </Card>
  );
}