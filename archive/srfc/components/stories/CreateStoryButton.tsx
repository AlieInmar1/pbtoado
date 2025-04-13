import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { StoryCreationModal } from './StoryCreationModal';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface CreateStoryButtonProps {
  level?: 'epic' | 'feature' | 'story';
  parentId?: string;
  className?: string;
}

interface ParentContext {
  title: string;
  description: string;
  product_line?: string;
  growth_driver?: string;
  investment_category?: string;
}

export function CreateStoryButton({ level, parentId, className = '' }: CreateStoryButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [parentContext, setParentContext] = useState<ParentContext | null>(null);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    async function loadParentContext() {
      if (!parentId || !currentWorkspace) return;

      try {
        const { data: parent } = await supabase
          .from('stories')
          .select('*')
          .eq('id', parentId)
          .single();

        if (parent) {
          setParentContext({
            title: parent.pb_title,
            description: parent.description || '',
            product_line: parent.product_line,
            growth_driver: parent.growth_driver,
            investment_category: parent.investment_category,
          });
        }
      } catch (error) {
        console.error('Error loading parent context:', error);
      }
    }

    loadParentContext();
  }, [parentId, currentWorkspace]);

  const buttonStyle = level === 'epic'
    ? 'text-purple-600 hover:text-purple-800'
    : level === 'feature'
    ? 'text-blue-600 hover:text-blue-800'
    : 'text-green-600 hover:text-green-800';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${buttonStyle} ${className} relative -top-1`}
      >
        <PlusIcon className="h-5 w-5 font-bold" />
      </button>

      {showModal && (
        <StoryCreationModal
          onClose={() => setShowModal(false)}
          onSave={async (story) => {
            const { data, error } = await supabase
              .from('stories')
              .insert({
                ...story,
                parent_id: parentId,
                product_line: parentContext?.product_line,
                growth_driver: parentContext?.growth_driver,
                investment_category: parentContext?.investment_category,
              })
              .select()
              .single();

            if (error) throw error;
            return data;
          }}
          initialLevel={level}
          parentContext={parentContext}
        />
      )}
    </>
  );
}