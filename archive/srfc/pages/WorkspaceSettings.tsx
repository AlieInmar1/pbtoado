import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDatabase } from '../contexts/DatabaseContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { toast } from 'sonner';
import { ConfigurationForm } from '../components/admin/ConfigurationForm';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { ProductSelector } from '../components/productboard/ProductSelector';
import { ADOConfigurationForm } from '../components/azuredevops/ADOConfigurationForm';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ProductBoardClient } from '../lib/api/productboard';
import type { Configuration } from '../types/database';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pb_board_id: z.string().min(1, 'Productboard ID is required'),
  ado_project_id: z.string().min(1, 'Azure DevOps Project ID is required'),
  ado_organization: z.string().min(1, 'Azure DevOps Organization is required'),
  pb_api_key: z.string().optional(),
  ado_api_key: z.string().optional(),
  sync_frequency: z.string().min(1, 'Sync frequency is required'),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

export function WorkspaceSettings() {
  const { id } = useParams<{ id: string }>();
  const { db } = useDatabase();
  const { workspaces } = useWorkspace();
  const [config, setConfig] = useState<Partial<Configuration>>({});
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const workspace = workspaces.find((w) => w.id === id);

  useEffect(() => {
    if (!id || !db) return;

    async function loadConfig() {
      try {
        // Use non-null assertion since we've already checked that id and db are not null
        const config = await db!.configurations.getByWorkspace(id!);
        if (config) {
          setConfig(config);
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    }

    loadConfig();
  }, [id, db]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      ...workspace,
      ado_organization: workspace?.ado_project_id.split('/')[0],
    },
  });

  const onSubmit = async (data: WorkspaceFormData) => {
    if (!db || !id) return;

    setIsSaving(true);
    try {
      // Combine organization and project ID
      const fullProjectId = `${data.ado_organization}/${data.ado_project_id}`;
      
      await db.workspaces.update(id, {
        ...data,
        ado_project_id: fullProjectId,
      });

      toast.success('Workspace settings updated successfully');
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast.error('Failed to update workspace settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your workspace integrations and settings
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last synced: {workspace.last_sync_timestamp ? new Date(workspace.last_sync_timestamp).toLocaleString() : 'Never'}
        </div>
      </div>

      <div className="space-y-8">
        <Card>
          <CardContent>
            <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Settings</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Workspace Name"
                {...register('name')}
                error={errors.name?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {watch('pb_api_key') ? (
                    <ProductSelector
                      apiKey={watch('pb_api_key') || ''}
                      value={watch('pb_board_id') || ''}
                      onChange={(productId) => setValue('pb_board_id', productId)}
                      error={errors.pb_board_id?.message}
                      label="Productboard Product"
                      required
                    />
                  ) : (
                    <Input
                      label="Productboard Product ID"
                      required
                      {...register('pb_board_id')}
                      error={errors.pb_board_id?.message}
                    />
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <Input
                    type="password"
                    label="Productboard API Key"
                    placeholder="Optional for testing"
                    {...register('pb_api_key')}
                    error={errors.pb_api_key?.message}
                    className="flex-1"
                  />
                  {watch('pb_api_key') && (
                    <button
                      type="button"
                      onClick={() => {
                        // Force refresh of the board selector
                        const currentApiKey = watch('pb_api_key');
                        setValue('pb_api_key', '');
                        setTimeout(() => setValue('pb_api_key', currentApiKey), 10);
                      }}
                      className="mb-1 px-3 py-2 text-xs font-medium rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Azure DevOps Organization"
                  required
                  {...register('ado_organization')}
                  error={errors.ado_organization?.message}
                />
                <Input
                  label="Azure DevOps Project"
                  required
                  {...register('ado_project_id')}
                  error={errors.ado_project_id?.message}
                />
              </div>

              <Input
                type="password"
                label="Azure DevOps API Key"
                placeholder="Optional for testing"
                {...register('ado_api_key')}
                error={errors.ado_api_key?.message}
              />

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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Azure DevOps Integration</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure the Azure DevOps integration for syncing stories between ProductBoard and Azure DevOps.
          </p>
          <ADOConfigurationForm />
        </div>
      </div>
    </div>
  );
}
