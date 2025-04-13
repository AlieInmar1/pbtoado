import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { DependencyGraph } from './DependencyGraph';
import { Select } from '../ui/Select';
import type { Story } from '../../types/database';

interface DependencyModalProps {
  story: Story;
  onClose: () => void;
}

export function DependencyModal({ story, onClose }: DependencyModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [relatedStories, setRelatedStories] = useState<Story[]>([]);
  const [availableStories, setAvailableStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState('');
  const [dependencyType, setDependencyType] = useState<'blocker' | 'related'>('blocker');

  useEffect(() => {
    if (!currentWorkspace) return;

    async function loadDependencies() {
      try {
        // Load existing dependencies
        const { data: deps } = await supabase
          .from('story_dependencies')
          .select('*')
          .or(`story_id.eq.${story.id},depends_on_id.eq.${story.id}`);

        if (deps) {
          setDependencies(deps);

          // Load related stories
          const storyIds = deps.map(d => 
            d.story_id === story.id ? d.depends_on_id : d.story_id
          );

          const { data: stories } = await supabase
            .from('stories')
            .select('*')
            .in('id', storyIds);

          if (stories) {
            setRelatedStories(stories);
          }
        }

        // Load available stories for new dependencies
        const { data: available } = await supabase
          .from('stories')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .neq('id', story.id)
          .not('id', 'in', `(${deps?.map(d => d.depends_on_id).join(',') || 'null'})`);

        if (available) {
          setAvailableStories(available);
        }
      } catch (error) {
        console.error('Error loading dependencies:', error);
      }
    }

    loadDependencies();
  }, [currentWorkspace, story]);

  const addDependency = async () => {
    if (!selectedStory) return;

    try {
      const { data, error } = await supabase
        .from('story_dependencies')
        .insert({
          story_id: story.id,
          depends_on_id: selectedStory,
          dependency_type: dependencyType,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setDependencies([...dependencies, data]);
      
      // Update related stories
      const { data: newStory } = await supabase
        .from('stories')
        .select('*')
        .eq('id', selectedStory)
        .single();

      if (newStory) {
        setRelatedStories([...relatedStories, newStory]);
      }

      // Remove from available stories
      setAvailableStories(availableStories.filter(s => s.id !== selectedStory));
      setSelectedStory('');
    } catch (error) {
      console.error('Error adding dependency:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Story Dependencies</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <Select
              value={selectedStory}
              onChange={(e) => setSelectedStory(e.target.value)}
              options={availableStories.map(s => ({
                value: s.id,
                label: s.pb_title,
              }))}
              className="flex-1"
              placeholder="Select a story..."
            />
            <Select
              value={dependencyType}
              onChange={(e) => setDependencyType(e.target.value as 'blocker' | 'related')}
              options={[
                { value: 'blocker', label: 'Blocker' },
                { value: 'related', label: 'Related' },
              ]}
              className="w-48"
            />
            <button
              onClick={addDependency}
              disabled={!selectedStory}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Dependency
            </button>
          </div>

          <DependencyGraph
            story={story}
            dependencies={dependencies}
            relatedStories={relatedStories}
          />
        </div>
      </div>
    </div>
  );
}