import React from 'react';
import { useState } from 'react';
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ScissorsIcon,
  ArchiveBoxIcon,
  SparklesIcon,
  PencilSquareIcon,
  ArrowPathRoundedSquareIcon,
  ServerIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { StoryDraftModal } from './stories/StoryDraftModal';
import { AIPromptPanel } from './AIPromptPanel';

interface ToolbarProps {
  selectedCount?: number;
  onArchiveSelected?: () => Promise<void>;
}

export function Toolbar({ selectedCount = 0, onArchiveSelected }: ToolbarProps) {
  const { currentWorkspace } = useWorkspace();
  const [syncing, setSyncing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showAIEnhanceModal, setShowAIEnhanceModal] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  const handleLoadSample = async () => {
    if (!currentWorkspace) {
      toast.error('Please select a workspace first');
      return;
    }

    setLoadingSample(true);
    try {
      const { error } = await supabase.rpc('generate_sample_stories', {
        p_workspace_id: currentWorkspace.id
      });

      if (error) throw error;

      toast.success('Sample data loaded successfully');
    } catch (error) {
      console.error('Error loading sample data:', error);
      toast.error('Failed to load sample data');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleSync = async (direction: 'push' | 'pull' | 'both') => {
    if (!currentWorkspace?.id) {
      toast.error('Please select a workspace first');
      return;
    }
    
    if (syncing) { 
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-stories`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
            direction,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      toast.success('Sync started successfully');

      // Refresh stories list
      const { error: refreshError } = await supabase
        .from('stories')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);

      if (refreshError) {
        console.error('Error refreshing stories:', refreshError);
        toast.error('Failed to refresh stories');
      }

    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!currentWorkspace?.id) {
      toast.error('Please select a workspace first');
      return;
    }

    if (selectedCount === 0) {
      toast.error('Please select stories to enhance');
      return;
    }

    setEnhancing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhance-stories`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to enhance stories');
      }

      toast.success('Stories enhanced successfully');
    } catch (error) {
      console.error('Error enhancing stories:', error);
      toast.error('Failed to enhance stories');
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex space-x-4">
        <button
          onClick={() => handleSync('both')}
          disabled={syncing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
          {syncing ? (
            <>
              <ArrowPathRoundedSquareIcon className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Sync Now
            </>
          )}
        </button>
        <button
          onClick={() => handleSync('push')}
          disabled={syncing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          Push to ADO
        </button>
        <button
          onClick={() => handleSync('pull')}
          disabled={syncing || !currentWorkspace?.id}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Pull from ADO
        </button>
        <button
          onClick={onArchiveSelected}
          disabled={selectedCount === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArchiveBoxIcon className="h-4 w-4 mr-2" />
          Archive Selected ({selectedCount})
        </button>
        <button
          onClick={handleAIEnhance}
          disabled={enhancing || selectedCount === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          {enhancing ? (
            <>
              <ArrowPathRoundedSquareIcon className="h-4 w-4 mr-2 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
          <SparklesIcon className="h-4 w-4 mr-2" />
          AI Enhance
            </>
          )}
        </button>
        <button
          onClick={() => setShowDraftModal(true)}
          disabled={!currentWorkspace?.id}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
          <PencilSquareIcon className="h-4 w-4 mr-2" />
          Draft Story
        </button>
        <button
          onClick={handleLoadSample}
          disabled={loadingSample}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingSample ? (
            <>
              <ArrowPathRoundedSquareIcon className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <ServerIcon className="h-4 w-4 mr-2" />
              Load Sample Data
            </>
          )}
        </button>
      </div>
      {showDraftModal && (
        <StoryDraftModal
          onClose={() => setShowDraftModal(false)}
          onSave={async (story) => {
            const { data, error } = await supabase
              .from('stories')
              .insert(story)
              .select()
              .single();

            if (error) throw error;
            setShowDraftModal(false);
            return data;
          }}
        />
      )}
      {showAIEnhanceModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-medium mb-4">AI Enhancement</h2>
            <p className="text-gray-600 mb-4">
              AI will analyze and enhance the selected stories by:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-600">
              <li>Improving story descriptions</li>
              <li>Suggesting acceptance criteria</li>
              <li>Calculating RICE scores</li>
              <li>Evaluating story completeness</li>
            </ul>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAIEnhanceModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAIEnhance();
                  setShowAIEnhanceModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
              >
                Start Enhancement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}