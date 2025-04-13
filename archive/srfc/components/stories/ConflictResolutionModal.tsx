import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { Story } from '../../types/database';

interface ConflictResolutionModalProps {
  story: Story;
  onClose: () => void;
  onResolved: () => void;
}

export function ConflictResolutionModal({ story, onClose, onResolved }: ConflictResolutionModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [resolving, setResolving] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<'pb' | 'ado' | null>(null);

  const handleResolve = async () => {
    if (!selectedVersion || !currentWorkspace) return;

    setResolving(true);
    try {
      // Get conflict data
      const { data: conflict } = await supabase
        .from('sync_conflicts')
        .select('*')
        .eq('story_id', story.id)
        .eq('status', 'pending')
        .single();

      if (!conflict) throw new Error('No pending conflict found');

      // Update story with selected version
      const storyData = selectedVersion === 'pb' ? conflict.pb_data : conflict.ado_data;
      
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          ...storyData,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', story.id);

      if (updateError) throw updateError;

      // Mark conflict as resolved
      const { error: conflictError } = await supabase
        .from('sync_conflicts')
        .update({
          status: 'resolved',
          resolution: `Used ${selectedVersion.toUpperCase()} version`,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conflict.id);

      if (conflictError) throw conflictError;

      toast.success('Conflict resolved successfully');
      onResolved();
      onClose();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error('Failed to resolve conflict');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Resolve Sync Conflict</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">Story: {story.pb_title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              This story has conflicting changes between Productboard and Azure DevOps.
              Please select which version to keep.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer ${
                selectedVersion === 'pb'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedVersion('pb')}
            >
              <h4 className="text-sm font-medium text-gray-900 mb-2">Productboard Version</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Title:</strong> {story.pb_title}</p>
                <p><strong>Description:</strong> {story.description}</p>
                {story.acceptance_criteria && (
                  <div>
                    <strong>Acceptance Criteria:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {story.acceptance_criteria.map((criterion, index) => (
                        <li key={index}>{criterion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border-2 cursor-pointer ${
                selectedVersion === 'ado'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedVersion('ado')}
            >
              <h4 className="text-sm font-medium text-gray-900 mb-2">Azure DevOps Version</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Title:</strong> {story.ado_title}</p>
                <p><strong>Description:</strong> {story.description}</p>
                {story.acceptance_criteria && (
                  <div>
                    <strong>Acceptance Criteria:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {story.acceptance_criteria.map((criterion, index) => (
                        <li key={index}>{criterion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={!selectedVersion || resolving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {resolving ? 'Resolving...' : 'Resolve Conflict'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}