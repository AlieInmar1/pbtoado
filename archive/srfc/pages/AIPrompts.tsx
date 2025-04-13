import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { supabase } from '../lib/supabase';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '../components/admin/PageHeader';
import { PromptCard } from '../components/ai-prompts/PromptCard';
import type { AIPrompt } from '../types/database';

export function AIPrompts() {
  const { currentWorkspace } = useWorkspace();
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) return;

    async function loadPrompts() {
      try {
        const { data, error } = await supabase
          .from('ai_prompts')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at');

        if (error) throw error;
        setPrompts(data);
      } catch (error) {
        console.error('Error loading AI prompts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPrompts();
  }, [currentWorkspace]);

  const addPrompt = async () => {
    if (!currentWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .insert({
          workspace_id: currentWorkspace.id,
          name: 'New Prompt',
          prompt_template: '',
          category: 'user_need',
        })
        .select()
        .single();

      if (error) throw error;
      setPrompts([...prompts, data]);
    } catch (error) {
      console.error('Error adding AI prompt:', error);
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error } = await supabase.from('ai_prompts').delete().eq('id', id);

      if (error) throw error;
      setPrompts(prompts.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting AI prompt:', error);
    }
  };

  if (loading) {
    return <div>Loading AI prompts...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="AI Prompts"
        buttonText="Add Prompt"
        buttonIcon={PlusIcon}
        onButtonClick={addPrompt}
      />

      <div className="space-y-6">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onDelete={deletePrompt}
            onUpdate={(id, data) => {
              // Handle update logic
            }}
          />
        ))}
      </div>
    </div>
  );
}