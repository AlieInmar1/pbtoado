import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { AIPrompt } from '../../types/database';

interface PromptFormProps {
  prompt: AIPrompt;
  onUpdate: (data: Partial<AIPrompt>) => void;
}

export function PromptForm({ prompt, onUpdate }: PromptFormProps) {
  const categories = [
    { value: 'user_need', label: 'User Need' },
    { value: 'feature_idea', label: 'Feature Idea' },
    { value: 'pain_point', label: 'Pain Point' },
    { value: 'business_objective', label: 'Business Objective' },
  ];

  return (
    <div className="space-y-4">
      <Input
        value={prompt.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="text-lg font-medium border-0 focus:ring-0"
        placeholder="Enter prompt name"
      />
      <Select
        value={prompt.category}
        options={categories}
        onChange={(e) => onUpdate({ category: e.target.value })}
        className="mt-1"
      />
      <Input
        label="Description"
        value={prompt.description || ''}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Enter prompt description"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt Template
        </label>
        <textarea
          value={prompt.prompt_template}
          onChange={(e) => onUpdate({ prompt_template: e.target.value })}
          rows={4}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter prompt template..."
        />
      </div>
    </div>
  );
}