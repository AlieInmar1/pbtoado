import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pb_board_id: z.string().trim().min(1, 'Productboard ID is required'),
  ado_project_id: z.string().trim().min(1, 'Azure DevOps Project ID is required'),
  pb_api_key: z.string().optional().nullable(),
  ado_api_key: z.string().optional().nullable(),
  sync_frequency: z.string().min(1, 'Sync frequency is required'),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

interface NewWorkspaceModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function NewWorkspaceModal({ onClose, onCreated }: NewWorkspaceModalProps) {
  const { db } = useDatabase();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      sync_frequency: '01:00:00',
      name: '',
      pb_board_id: '',
      ado_project_id: '',
      pb_api_key: '',
      ado_api_key: '',
    },
  });

  // Debug form values
  console.log('Form values:', watch());
  console.log('Form errors:', errors);

  const onSubmit = async (data: WorkspaceFormData) => {
    if (!db) return;

    console.log('Submitting data:', data);
    try {
      // Trim whitespace and clean up empty API keys
      const cleanData = {
        ...data,
        name: data.name.trim(),
        pb_board_id: data.pb_board_id.trim(),
        ado_project_id: data.ado_project_id.trim(),
        pb_api_key: data.pb_api_key || null,
        ado_api_key: data.ado_api_key || null,
      };

      // Create workspace
      const workspace = await db.workspaces.create(cleanData);

      // Generate sample stories
      const { error: storiesError } = await db.client.rpc('generate_sample_stories', {
        p_workspace_id: workspace.id
      });

      if (storiesError) {
        console.error('Error generating sample stories:', storiesError);
      }

      // Create default configuration
      await db.configurations.create({
        workspace_id: workspace.id,
        risk_threshold_days: 7,
        field_propagation_enabled: true,
      });

      toast.success('Workspace created successfully');
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">New Workspace</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <Input
            label="Workspace Name"
            {...register('name')}
            onChange={(e) => setValue('name', e.target.value)}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Productboard Board ID"
              required
              {...register('pb_board_id')}
              onChange={(e) => setValue('pb_board_id', e.target.value)}
              error={errors.pb_board_id?.message}
            />
            <Input
              type="password"
              label="Productboard API Key"
              placeholder="Optional for testing"
              {...register('pb_api_key')}
              onChange={(e) => setValue('pb_api_key', e.target.value)}
              error={errors.pb_api_key?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Azure DevOps Project ID"
              required
              {...register('ado_project_id')}
              onChange={(e) => setValue('ado_project_id', e.target.value)}
              error={errors.ado_project_id?.message}
            />
            <Input
              type="password"
              label="Azure DevOps API Key"
              placeholder="Optional for testing"
              {...register('ado_api_key')}
              onChange={(e) => setValue('ado_api_key', e.target.value)}
              error={errors.ado_api_key?.message}
            />
          </div>

          <Select
            label="Sync Frequency"
            {...register('sync_frequency')}
            error={errors.sync_frequency?.message}
            options={[
              { value: '00:15:00', label: '15 minutes' },
              { value: '00:30:00', label: '30 minutes' },
              { value: '01:00:00', label: '1 hour' },
              { value: '02:00:00', label: '2 hours' },
              { value: '04:00:00', label: '4 hours' },
            ]}
          />

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}