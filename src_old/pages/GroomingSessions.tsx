import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../components/admin/PageHeader';
import { GroomingSessionModal } from '../components/grooming/GroomingSessionModal';
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import type { GroomingSession } from '../types/database';

export function GroomingSessions() {
  const { currentWorkspace } = useWorkspace();
  const { db, loading: dbLoading } = useDatabase();
  const [sessions, setSessions] = useState<GroomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [currentWorkspace, db]);

  async function loadSessions() {
    if (!currentWorkspace || !db) return;

    try {
      const sessions = await db.groomingSessions.getAll(currentWorkspace.id);
      setSessions(sessions);
    } catch (error) {
      console.error('Error loading grooming sessions:', error);
      toast.error('Failed to load grooming sessions');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PageHeader
        title="Grooming Sessions"
        buttonText="New Session"
        buttonIcon={PlusIcon}
        onButtonClick={() => setShowNewSessionModal(true)}
      />

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="mt-2 text-lg font-medium text-gray-900">No grooming sessions yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first grooming session.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Session
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/grooming/session/${session.id}`}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">{session.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>Date: {new Date(session.session_date).toLocaleDateString()}</p>
                <p>Time: {new Date(session.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p>Duration: {session.duration_minutes} minutes</p>
                <p className="capitalize">Type: {session.session_type}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <span className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View Details
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNewSessionModal && (
        <GroomingSessionModal
          onClose={() => setShowNewSessionModal(false)}
          onCreated={loadSessions}
        />
      )}
    </div>
  );
}
