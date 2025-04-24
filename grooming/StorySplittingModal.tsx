import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, MinusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSplitStory } from '../src/hooks/useGroomingStories';
import { useWorkspace } from '../src/contexts/WorkspaceContext';
import { toast } from './lib/sonner';
import { AcceptanceCriterion, GroomingStory } from '../src/types/grooming';
import { FormInput as Input } from '../src/components/forms/FormInput';
import { FormSelect as Select } from '../src/components/forms/FormSelect';

// Define the schema for a child story
const childStorySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  acceptance_criteria: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(1, 'Acceptance criterion text is required'),
      completed: z.boolean().default(false),
    })
  ).optional(),
});

// Define the schema for the form
const formSchema = z.object({
  split_rationale: z.string().min(1, 'Split rationale is required'),
  new_stories: z.array(childStorySchema).min(2, 'At least 2 child stories are required'),
});

type FormData = z.infer<typeof formSchema>;

interface StorySplittingModalProps {
  originalStory: GroomingStory;
  onClose: () => void;
  onSuccess: () => void;
}

export function StorySplittingModal({ originalStory, onClose, onSuccess }: StorySplittingModalProps) {
  const splitStoryMutation = useSplitStory();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);

  // Initialize form with default values
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      split_rationale: '',
      new_stories: [
        {
          title: `${originalStory.title} - Part 1`,
          description: originalStory.description,
          acceptance_criteria: [],
        },
        {
          title: `${originalStory.title} - Part 2`,
          description: '',
          acceptance_criteria: [],
        },
      ],
    },
  });

  // Use field array for dynamic child stories
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'new_stories',
  });

  // Initialize acceptance criteria from original story
  useEffect(() => {
    if (originalStory.acceptance_criteria && originalStory.acceptance_criteria.length > 0) {
      // Convert AcceptanceCriterion to the format expected by the form schema
      const convertedCriteria = originalStory.acceptance_criteria.map(criterion => ({
        id: criterion.id,
        text: criterion.description,
        completed: criterion.status === 'met'
      }));
      
      // Distribute acceptance criteria evenly among child stories
      const numStories = fields.length;
      const criteriaPerStory = Math.ceil(convertedCriteria.length / numStories);
      
      fields.forEach((field, index) => {
        const start = index * criteriaPerStory;
        const end = Math.min(start + criteriaPerStory, convertedCriteria.length);
        const criteria = convertedCriteria.slice(start, end);
        
        setValue(`new_stories.${index}.acceptance_criteria`, criteria);
      });
    }
  }, [originalStory.acceptance_criteria, fields.length, setValue]);

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      
      // Add workspace_id to each new story
      const storiesWithWorkspace = data.new_stories.map(story => ({
        ...story,
        workspace_id: currentWorkspace.id
      }));
      
      await splitStoryMutation.mutateAsync({
        original_story_id: originalStory.id,
        new_stories: storiesWithWorkspace,
        split_rationale: data.split_rationale,
      });
      
      toast.success('Story split successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error splitting story:', error);
      toast.error('Failed to split story');
    } finally {
      setLoading(false);
    }
  };

  // Add a new child story
  const handleAddChildStory = () => {
    append({
      title: `${originalStory.title} - Part ${fields.length + 1}`,
      description: '',
      acceptance_criteria: [],
    });
  };

  // Remove a child story
  const handleRemoveChildStory = (index: number) => {
    if (fields.length <= 2) {
      toast.error('At least 2 child stories are required');
      return;
    }
    remove(index);
  };

  // Move an acceptance criterion from one story to another
  const handleMoveCriterion = (fromStoryIndex: number, criterionIndex: number, toStoryIndex: number) => {
    const fromCriteria = watch(`new_stories.${fromStoryIndex}.acceptance_criteria`) || [];
    const toCriteria = watch(`new_stories.${toStoryIndex}.acceptance_criteria`) || [];
    
    if (fromCriteria.length > 0 && criterionIndex < fromCriteria.length) {
      const criterion = fromCriteria[criterionIndex];
      
      // Remove from source
      const newFromCriteria = [...fromCriteria];
      newFromCriteria.splice(criterionIndex, 1);
      setValue(`new_stories.${fromStoryIndex}.acceptance_criteria`, newFromCriteria);
      
      // Add to target
      setValue(`new_stories.${toStoryIndex}.acceptance_criteria`, [...toCriteria, criterion]);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 bg-blue-100 text-blue-800">
              Split Story
            </span>
            <h2 className="text-xl font-semibold text-gray-900">Split: {originalStory.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Original story details */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Original Story</h3>
              <p className="text-sm font-medium text-gray-900">{originalStory.title}</p>
              {originalStory.description && (
                <p className="mt-1 text-sm text-gray-500">{originalStory.description}</p>
              )}
              
              {originalStory.acceptance_criteria && originalStory.acceptance_criteria.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-500">Acceptance Criteria:</p>
                  <ul className="mt-1 list-disc list-inside text-xs text-gray-500 space-y-1">
                    {originalStory.acceptance_criteria.map((criteria, index) => (
                              <li key={index}>{criteria.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Split rationale */}
            <div>
              <label htmlFor="split_rationale" className="block text-sm font-medium text-gray-700">
                Split Rationale
              </label>
              <Controller
                name="split_rationale"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="split_rationale"
                    rows={2}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Explain why this story is being split"
                  />
                )}
              />
              {errors.split_rationale && (
                <p className="mt-1 text-sm text-red-600">{errors.split_rationale.message}</p>
              )}
            </div>

            {/* Child stories */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Child Stories</h3>
                <button
                  type="button"
                  onClick={handleAddChildStory}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Child Story
                </button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Child Story {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveChildStory(index)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <MinusIcon className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label htmlFor={`new_stories.${index}.title`} className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <Controller
                        name={`new_stories.${index}.title`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            id={`new_stories.${index}.title`}
                            type="text"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        )}
                      />
                      {errors.new_stories?.[index]?.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.new_stories[index]?.title?.message}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor={`new_stories.${index}.description`} className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <Controller
                        name={`new_stories.${index}.description`}
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            id={`new_stories.${index}.description`}
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        )}
                      />
                    </div>

                    {/* Acceptance Criteria */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Acceptance Criteria
                        </label>
                        {fields.length > 1 && (
                          <Select
                            name={`move_all_criteria_${index}`}
                            label=""
                            value=""
                            onChange={(e) => {
                              const targetIndex = parseInt(e.target.value);
                              if (!isNaN(targetIndex) && targetIndex !== index) {
                                // Move all criteria to the selected story
                                const criteria = watch(`new_stories.${index}.acceptance_criteria`) || [];
                                const targetCriteria = watch(`new_stories.${targetIndex}.acceptance_criteria`) || [];
                                
                                setValue(`new_stories.${targetIndex}.acceptance_criteria`, [...targetCriteria, ...criteria]);
                                setValue(`new_stories.${index}.acceptance_criteria`, []);
                              }
                            }}
                            options={[
                              { value: '', label: 'Move all to...' },
                              ...fields.map((f, i) => i !== index ? { value: i.toString(), label: `Child Story ${i + 1}` } : { value: '', label: '' }).filter(opt => opt.value !== '')
                            ]}
                          />
                        )}
                      </div>
                      
                      <Controller
                        name={`new_stories.${index}.acceptance_criteria`}
                        control={control}
                        render={({ field }) => (
                          <div className="mt-1 space-y-2">
                            {(field.value || []).map((criterion, criterionIndex) => (
                              <div key={criterion.id || criterionIndex} className="flex items-center">
                                <span className="flex-1 text-sm text-gray-900">{criterion.text}</span>
                                {fields.length > 1 && (
                                  <Select
                                    name={`move_criterion_${index}_${criterionIndex}`}
                                    label=""
                                    value=""
                                    onChange={(e) => {
                                      const targetIndex = parseInt(e.target.value);
                                      if (!isNaN(targetIndex) && targetIndex !== index) {
                                        handleMoveCriterion(index, criterionIndex, targetIndex);
                                      }
                                    }}
                                    options={[
                                      { value: '', label: 'Move to...' },
                                      ...fields.map((f, i) => i !== index ? { value: i.toString(), label: `Child Story ${i + 1}` } : { value: '', label: '' }).filter(opt => opt.value !== '')
                                    ]}
                                  />
                                )}
                              </div>
                            ))}
                            
                            {(!field.value || field.value.length === 0) && (
                              <p className="text-sm text-gray-500">No acceptance criteria assigned to this story.</p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {errors.new_stories && (
                <p className="mt-1 text-sm text-red-600">{errors.new_stories.message}</p>
              )}
            </div>
          </div>

          <div className="p-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
              {loading ? 'Splitting...' : 'Split Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
