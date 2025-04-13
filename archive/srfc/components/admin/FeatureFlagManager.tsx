import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: Record<string, any>;
}

export function FeatureFlagManager() {
  const { currentWorkspace } = useWorkspace();
  const { db } = useDatabase();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadFlags();
  }, [currentWorkspace]);

  async function loadFlags() {
    if (!currentWorkspace || !db) return;

    try {
      const { data: flags } = await db.client
        .from('feature_flags')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .is('deleted_at', null)
        .order('name');

      setFlags(flags || []);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }

  const handleAddFlag = async () => {
    if (!currentWorkspace || !db || !newFlag.name) return;

    try {
      const { data: flag, error } = await db.client
        .from('feature_flags')
        .insert({
          workspace_id: currentWorkspace.id,
          name: newFlag.name,
          description: newFlag.description,
          enabled: false,
        })
        .select()
        .single();

      if (error) throw error;

      setFlags([...flags, flag]);
      setNewFlag({ name: '', description: '' });
      toast.success('Feature flag created');
    } catch (error) {
      console.error('Error creating feature flag:', error);
      toast.error('Failed to create feature flag');
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    if (!db) return;

    try {
      const { error } = await db.client
        .from('feature_flags')
        .update({ enabled: !flag.enabled })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags(flags.map(f => 
        f.id === flag.id ? { ...f, enabled: !f.enabled } : f
      ));

      toast.success(`Feature flag ${flag.enabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  const handleDeleteFlag = async (flag: FeatureFlag) => {
    if (!db) return;

    try {
      const { error } = await db.client
        .from('feature_flags')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags(flags.filter(f => f.id !== flag.id));
      toast.success('Feature flag deleted');
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      toast.error('Failed to delete feature flag');
    }
  };

  if (loading) {
    return <div>Loading feature flags...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Feature Flag</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              value={newFlag.name}
              onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
              placeholder="e.g., enable_new_ui"
            />
            <Input
              label="Description"
              value={newFlag.description}
              onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
              placeholder="Describe what this feature flag controls"
            />
            <button
              onClick={handleAddFlag}
              disabled={!newFlag.name}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Flag
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {flags.map(flag => (
          <Card key={flag.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{flag.name}</h3>
                {flag.description && (
                  <p className="mt-1 text-sm text-gray-500">{flag.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <Switch
                  checked={flag.enabled}
                  onChange={() => handleToggleFlag(flag)}
                />
                <button
                  onClick={() => handleDeleteFlag(flag)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}