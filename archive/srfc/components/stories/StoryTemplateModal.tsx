import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';
import type { StoryTemplate } from '../../types/database';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  level: z.enum(['epic', 'feature', 'story']),
  title_template: z.string().min(1, 'Title template is required'),
  description_template: z.string().min(1, 'Description template is required'),
  acceptance_criteria_template: z.array(z.string()),
  product_line: z.string().optional(),
  growth_driver: z.string().optional(),
  investment_category: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface StoryTemplateModalProps {
  template?: StoryTemplate;
  onClose: () => void;
  onSave: () => void;
}

export function StoryTemplateModal({ template, onClose, onSave }: StoryTemplateModalProps) {
  const { currentWorkspace } = useWorkspace();
  const { db } = useDatabase();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: template ? {
      name: template.name,
      description: template.description || '',
      level: template.level,
      title_template: template.template_data.title_template || '',
      description_template: template.template_data.description_template || '',
      acceptance_criteria_template: template.template_data.acceptance_criteria_template || [''],
      product_line: template.template_data.product_line,
      growth_driver: template.template_data.growth_driver,
      investment_category: template.template_data.investment_category,
    } : {
      level: 'story',
      acceptance_criteria_template: [''],
    },
  });

  const onSubmit = async (data: TemplateFormData) => {
    if (!currentWorkspace || !db) return;

    setSaving(true);
    try {
      const templateData = {
        title_template: data.title_template,
        description_template: data.description_template,
        acceptance_criteria_template: data.acceptance_criteria_template,
        product_line: data.product_line,
        growth_driver: data.growth_driver,
        investment_category: data.investment_category,
      };

      if (template) {
        await db.storyTemplates.update(
          template.id,
          {
            name: data.name,
            description: data.description,
            level: data.level,
            template_data: templateData,
          }
        );
      } else {
        await db.storyTemplates.create({
            workspace_id: currentWorkspace.id,
            name: data.name,
            description: data.description,
            level: data.level,
            template_data: templateData,
        });
      }

      toast.success(`Template ${template ? 'updated' : 'created'} successfully`);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(`Failed to ${template ? 'update' : 'create'} template`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Template Name"
              {...register('name')}
              error={errors.name?.message}
            />

            <Select
              label="Story Level"
              {...register('level')}
              options={[
                { value: 'epic', label: 'Epic' },
                { value: 'feature', label: 'Feature' },
                { value: 'story', label: 'Story' },
              ]}
              error={errors.level?.message}
            />
          </div>

          <Input
            label="Description"
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="space-y-4">
            <Input
              label="Title Template"
              {...register('title_template')}
              error={errors.title_template?.message}
              placeholder="e.g., As a {user_type}, I want to {action}"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description Template
              </label>
              <textarea
                {...register('description_template')}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., Currently, {current_state}. By implementing this story, we will {desired_outcome}."
              />
              {errors.description_template && (
                <p className="mt-1 text-sm text-red-600">{errors.description_template.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Acceptance Criteria Templates
              </label>
              {watch('acceptance_criteria_template').map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    {...register(`acceptance_criteria_template.${index}`)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Given {condition}, when {action}, then {result}"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const criteria = watch('acceptance_criteria_template');
                        setValue(
                          'acceptance_criteria_template',
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
                  const criteria = watch('acceptance_criteria_template');
                  setValue('acceptance_criteria_template', [...criteria, '']);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Add Criterion Template
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Product Line"
              {...register('product_line')}
              options={[
                { value: '', label: 'None' },
                { value: 'mobile', label: 'Mobile App' },
                { value: 'web', label: 'Web Platform' },
                { value: 'api', label: 'API Services' },
              ]}
            />

            <Select
              label="Growth Driver"
              {...register('growth_driver')}
              options={[
                { value: '', label: 'None' },
                { value: 'acquisition', label: 'Acquisition' },
                { value: 'retention', label: 'Retention' },
                { value: 'monetization', label: 'Monetization' },
              ]}
            />

            <Select
              label="Investment Category"
              {...register('investment_category')}
              options={[
                { value: '', label: 'None' },
                { value: 'innovation', label: 'Innovation' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'growth', label: 'Growth' },
              ]}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}