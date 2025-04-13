import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const storySchema = z.object({
  level: z.enum(['epic', 'feature', 'story']),
  parent_id: z.string().optional(),
  pb_title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  acceptance_criteria: z.array(z.string()),
  story_points: z.number().min(0).optional(),
  product_line: z.string().optional(),
  growth_driver: z.string().optional(),
  investment_category: z.string().optional(),
});

type StoryFormData = z.infer<typeof storySchema>;

interface StoryCreationModalProps {
  onClose: () => void;
  onSave: (story: any) => Promise<void>;
  initialLevel?: 'epic' | 'feature' | 'story';
  parentId?: string;
}

export function StoryCreationModal({ onClose, onSave, initialLevel, parentId }: StoryCreationModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [availableParents, setAvailableParents] = useState<Array<{ id: string; title: string }>>([]);
  const [aiSuggestions, setAiSuggestions] = useState<{
    title?: string;
    description?: string;
    acceptanceCriteria?: string[];
    storyPoints?: number;
    recommendations?: string[];
  } | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      level: initialLevel || 'story',
      parent_id: parentId,
      acceptance_criteria: [''],
    },
  });

  const level = watch('level');

  // Load potential parent stories when level changes
  useEffect(() => {
    if (!currentWorkspace?.id) return;
    
    async function loadParents() {
      const parentLevel = level === 'story' ? 'feature' : 'epic';
      const { data, error } = await supabase
        .from('stories')
        .select('id, pb_title')
        .eq('workspace_id', currentWorkspace.id)
        .eq('level', parentLevel)
        .eq('status', 'open');

      if (error) {
        console.error('Error loading parent stories:', error);
        return;
      }

      setAvailableParents(data || []);
    }

    loadParents();
  }, [level, currentWorkspace?.id]);

  const analyzeWithAI = async () => {
    if (!currentWorkspace) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-story`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
            storyData: {
              level,
              title: watch('pb_title'),
              description: watch('description'),
              acceptanceCriteria: watch('acceptance_criteria'),
            },
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to analyze story');

      const analysis = await response.json();
      setAiSuggestions(analysis.improvements || null);

      // Apply AI suggestions if available
      if (analysis.improvements) {
        if (analysis.improvements.title) setValue('pb_title', analysis.improvements.title);
        if (analysis.improvements.description) setValue('description', analysis.improvements.description);
        if (analysis.improvements.acceptanceCriteria) {
          setValue('acceptance_criteria', analysis.improvements.acceptanceCriteria);
        }
      }

      toast.success('Story analyzed and improved');
    } catch (error) {
      console.error('Error analyzing story:', error);
      toast.error('Failed to analyze story');
    } finally {
      setAnalyzing(false);
    }
  };

  const onSubmit = async (data: StoryFormData) => {
    if (step < 4) {
      // Validate parent selection for non-epic stories
      if (step === 1 && data.level !== 'epic' && !data.parent_id) {
        toast.error(`Please select a parent ${data.level === 'story' ? 'feature' : 'epic'}`);
        return;
      }

      setStep(step + 1);
      return;
    }

    try {
      await onSave({
        ...data,
        workspace_id: currentWorkspace?.id,
        status: 'draft',
        is_draft: true,
        ai_suggestions: aiSuggestions,
      });
      toast.success('Story created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to create story');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-500">Start by selecting the type and providing a title</p>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 mb-1">Type</div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setValue('level', 'epic')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      level === 'epic'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Epic
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('level', 'feature')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      level === 'feature'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('level', 'story')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      level === 'story'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Story
                  </button>
                </div>
              </div>
            </div>

            {level !== 'epic' && availableParents.length > 0 && (
              <Select
                label={`Parent ${level === 'story' ? 'Feature' : 'Epic'}`}
                {...register('parent_id')}
                options={[
                  { value: '', label: `Select ${level === 'story' ? 'Feature' : 'Epic'}` },
                  ...availableParents.map(p => ({
                    value: p.id,
                    label: p.pb_title
                  }))
                ]}
                error={errors.parent_id?.message}
                className="mb-6"
              />
            )}

            <Input
              label="Title"
              {...register('pb_title')}
              error={errors.pb_title?.message}
              placeholder={`Enter ${level} title`}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <p className="text-sm text-gray-500">
                {level === 'epic' 
                  ? 'Describe the overall goal and business value'
                  : level === 'feature'
                  ? 'Describe the feature and its key capabilities'
                  : 'Describe what needs to be done and why'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder={level === 'epic'
                  ? 'What business problem does this solve?'
                  : level === 'feature'
                  ? 'What functionality will this feature provide?'
                  : 'What needs to be implemented?'
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={analyzing}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-transparent rounded-md hover:bg-indigo-100 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Analyze & Improve
                </>
              )}
            </button>
            
            {aiSuggestions?.recommendations && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">AI Recommendations</h4>
                <ul className="space-y-2">
                  {aiSuggestions.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start text-sm text-blue-800">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                        {index + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Acceptance Criteria</h3>
              <p className="text-sm text-gray-500">
                Define clear, testable acceptance criteria
              </p>
            </div>

            <div className="space-y-4">
              {aiSuggestions?.acceptanceCriteria && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-green-900">AI Suggested Criteria</h4>
                    <button
                      type="button"
                      onClick={() => setValue('acceptance_criteria', aiSuggestions.acceptanceCriteria || [''])}
                      className="text-sm text-green-700 hover:text-green-800"
                    >
                      Apply Suggestions
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {aiSuggestions.acceptanceCriteria.map((criterion, index) => (
                      <li key={index} className="text-sm text-green-800">
                        • {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {watch('acceptance_criteria').map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    {...register(`acceptance_criteria.${index}`)}
                    placeholder={`Criterion ${index + 1}`}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const criteria = watch('acceptance_criteria');
                        setValue(
                          'acceptance_criteria',
                          criteria.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const criteria = watch('acceptance_criteria');
                  setValue('acceptance_criteria', [...criteria, '']);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Add Criterion
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Additional Details</h3>
              <p className="text-sm text-gray-500">
                {level === 'epic' ? 'Provide epic-level details' :
                 level === 'feature' ? 'Provide feature-level details' :
                 'Provide story-level details and estimates'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {level === 'story' && (
                <Input
                  type="number"
                  label="Story Points"
                  {...register('story_points', { valueAsNumber: true })}
                  error={errors.story_points?.message}
                />
              )}

              <Select
                label="Product Line"
                {...register('product_line')}
                options={[
                  { value: 'mobile', label: 'Mobile App' },
                  { value: 'web', label: 'Web Platform' },
                  { value: 'api', label: 'API Services' },
                ]}
              />

              <Select
                label={level === 'epic' ? 'Strategic Driver' : 'Growth Driver'}
                {...register('growth_driver')}
                options={[
                  { value: 'acquisition', label: 'Acquisition' },
                  { value: 'retention', label: 'Retention' },
                  { value: 'monetization', label: 'Monetization' },
                ]}
              />

              <Select
                label={level === 'epic' ? 'Investment Area' : 'Investment Category'}
                {...register('investment_category')}
                options={[
                  { value: 'innovation', label: 'Innovation' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'growth', label: 'Growth' },
                ]}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Create {level === 'epic' ? 'Epic' : level === 'feature' ? 'Feature' : 'Story'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-gray-900">Step {step} of 4</span>
                <span className="text-gray-500">
                  {step === 1 ? 'Basic Info' : 
                   step === 2 ? 'Description' :
                   step === 3 ? 'Acceptance Criteria' : 'Details'}
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {renderStep()}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between rounded-b-lg">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>
            ) : (
              <div />
            )}
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              {step < 4 ? (
                <>
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </>
              ) : (
                'Create Story'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}