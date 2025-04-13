import React, { useState } from 'react';
import { 
  UserIcon, 
  UserPlusIcon, 
  XMarkIcon, 
  CheckIcon, 
  XCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import type { GroomingSessionParticipant } from '../../types/database';

interface SessionParticipantListProps {
  participants: GroomingSessionParticipant[];
  onAddParticipant: (participant: Partial<GroomingSessionParticipant>) => Promise<void>;
  onRemoveParticipant: (participantId: string) => Promise<void>;
  onUpdateParticipant: (participantId: string, data: Partial<GroomingSessionParticipant>) => Promise<void>;
  disabled?: boolean;
}

export function SessionParticipantList({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
  disabled = false
}: SessionParticipantListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    display_name: '',
    email: '',
    role: 'developer' as const,
  });
  const [loading, setLoading] = useState(false);

  const roleLabels = {
    facilitator: 'Facilitator',
    product_owner: 'Product Owner',
    tech_lead: 'Tech Lead',
    developer: 'Developer',
    designer: 'Designer',
    qa: 'QA',
    observer: 'Observer',
  };

  const statusColors = {
    invited: 'bg-gray-100 text-gray-800',
    confirmed: 'bg-blue-100 text-blue-800',
    declined: 'bg-red-100 text-red-800',
    attended: 'bg-green-100 text-green-800',
    no_show: 'bg-yellow-100 text-yellow-800',
  };

  const handleAddParticipant = async () => {
    if (!newParticipant.display_name || loading) return;
    
    setLoading(true);
    try {
      await onAddParticipant({
        ...newParticipant,
        attendance_status: 'invited',
      });
      
      // Reset form
      setNewParticipant({
        display_name: '',
        email: '',
        role: 'developer',
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding participant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (id: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      await onRemoveParticipant(id);
    } catch (error) {
      console.error('Error removing participant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'declined' | 'attended' | 'no_show') => {
    if (loading) return;
    
    setLoading(true);
    try {
      await onUpdateParticipant(id, { attendance_status: status });
    } catch (error) {
      console.error('Error updating participant status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Participants</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={disabled}
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <UserPlusIcon className="h-4 w-4 mr-1" />
            Add Participant
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Add New Participant</h4>
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="display_name" className="block text-xs font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="display_name"
                value={newParticipant.display_name}
                onChange={(e) => setNewParticipant({ ...newParticipant, display_name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700">
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={newParticipant.email || ''}
                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="role" className="block text-xs font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                value={newParticipant.role}
                onChange={(e) => setNewParticipant({ 
                  ...newParticipant, 
                  role: e.target.value as any 
                })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleAddParticipant}
              disabled={!newParticipant.display_name || loading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Participant'}
            </button>
          </div>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm">No participants added yet</p>
          <p className="text-xs">Add participants to track attendance and roles</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {participants.map((participant) => (
            <li key={participant.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{participant.display_name}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{roleLabels[participant.role]}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[participant.attendance_status]}`}>
                      {participant.attendance_status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {participant.attendance_status === 'invited' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(participant.id, 'confirmed')}
                      disabled={disabled || loading}
                      className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                      title="Mark as confirmed"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(participant.id, 'declined')}
                      disabled={disabled || loading}
                      className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="Mark as declined"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => handleRemoveParticipant(participant.id)}
                  disabled={disabled || loading}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Remove participant"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
