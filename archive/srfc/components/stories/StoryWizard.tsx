import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useFunctions } from '../../contexts/FunctionContext';
import { toast } from 'sonner';

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
  tentpole: z.string().optional(),
  tshirt_size: z.string().optional(),
  engineering_points: z.number().optional(),
});

type StoryFormData = z.infer<typeof storySchema>;

interface StoryWizardProps {
  onClose: () => void;
  onSave: (story: any) => Promise<void>;
}

interface SprintabilityCheck {
  isSprintable: boolean;
  reasons: string[];
  suggestions: string[];
}

export function StoryWizard({ onClose, onSave }: StoryWizardProps) {
  const { currentWorkspace } = useWorkspace();
  const { functions } = useFunctions();
  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [sprintabilityCheck, setSprintabilityCheck] = useState<SprintabilityCheck | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [availableParents, setAvailableParents] = useState<Array<{ id: string; title: string }>>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      level: 'story',
      acceptance_criteria: [''],
    },
  });

  const level = watch('level');
  const description = watch('description');
  const acceptanceCriteria = watch('acceptance_criteria');

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

  useEffect(() => {
    // Only check sprintability for stories, not features
    if (level === 'story' && description) {
      checkSprintability();
    }
  }, [level, description, acceptanceCriteria]);

  const checkSprintability = async () => {
    if (!currentWorkspace || !functions) return;
    
    setAnalyzing(true);
    try {
      const analysis = await functions.analyzeStory({
        workspaceId: currentWorkspace.id,
        storyData: {
          level,
          title: watch('pb_title'),
          description,
          acceptanceCriteria,
        },
      });

      setSprintabilityCheck({
        isSprintable: analysis.isSprintable,
        reasons: analysis.reasons || [],
        suggestions: analysis.suggestions || [],
      });

      setAiSuggestions(analysis.improvements || null);
    } catch (error) {
      console.error('Error analyzing story:', error);
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
        sprintable: sprintabilityCheck?.isSprintable ?? true,
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

            <Select
              label="Type"
              {...register('level')}
              options={[
                { value: 'epic', label: 'Epic' },
                { value: 'feature', label: 'Feature' },
                { value: 'story', label: 'Story' },
              ]}
              error={errors.level?.message}
            />

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
              />
            )}

            <Input
              label="Title"
              {...register('pb_title')}
              error={errors.pb_title?.message}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <p className="text-sm text-gray-500">
                Provide a clear description of what needs to be done
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {analyzing && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing sprintability...
              </div>
            )}

            {sprintabilityCheck && level === 'story' && (
              <div className={`p-4 rounded-lg ${
                sprintabilityCheck.isSprintable 
                  ? 'bg-green-50' 
                  : 'bg-yellow-50'
              }`}>
                <div className="flex items-center mb-2">
                  {sprintabilityCheck.isSprintable ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  )}
                  <h4 className="font-medium">
                    {sprintabilityCheck.isSprintable 
                      ? 'Story is sprintable'
                      : 'Story might need to be broken down'}
                  </h4>
                </div>
                {sprintabilityCheck.reasons.length > 0 && (
                  <ul className="list-disc list-inside text-sm space-y-1 mb-2">
                    {sprintabilityCheck.reasons.map((reason, i) => (
                      <li key={i} className="text-gray-600">{reason}</li>
                    ))}
                  </ul>
                )}
                {sprintabilityCheck.suggestions.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <strong>Suggestions:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {sprintabilityCheck.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
            Create {level === 'feature' ? 'Feature' : 'Story'}
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