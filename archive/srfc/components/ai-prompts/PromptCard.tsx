import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../ui/Card';
import { PromptForm } from './PromptForm';
import type { AIPrompt } from '../../types/database';

interface PromptCardProps {
  prompt: AIPrompt;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<AIPrompt>) => void;
}

export function PromptCard({ prompt, onDelete, onUpdate }: PromptCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <PromptForm
              prompt={prompt}
              onUpdate={(data) => onUpdate(prompt.id, data)}
            />
          </div>
          <button
            onClick={() => onDelete(prompt.id)}
            className="text-gray-400 hover:text-red-600"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}