import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { UseFormRegister } from 'react-hook-form';
import type { StoryFormData } from '../../../types/forms';

interface AcceptanceCriteriaProps {
  register: UseFormRegister<StoryFormData>;
  criteria: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function AcceptanceCriteria({ register, criteria, onAdd, onRemove }: AcceptanceCriteriaProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Acceptance Criteria
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {criteria.map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              {...register(`acceptance_criteria.${index}`)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={`Criterion ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}