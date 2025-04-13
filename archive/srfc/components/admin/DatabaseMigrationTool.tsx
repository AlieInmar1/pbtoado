import React, { useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Card, CardContent } from '../ui/Card';
import { toast } from 'sonner';

export function DatabaseMigrationTool() {
  const { db } = useDatabase();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    if (!db) return;

    setExporting(true);
    try {
      // Export all data
      const workspaces = await db.workspaces.getAll();
      const stories = await Promise.all(
        workspaces.map(async w => {
          const { data } = await db.client
            .from('stories')
            .select(`
              *,
              story_splits!story_splits_original_story_id_fkey(*),
              story_splits!story_splits_split_story_id_fkey(*)
            `)
            .eq('workspace_id', w.id)
            .is('deleted_at', null);
          return data || [];
        })
      );
      const configurations = await Promise.all(
        workspaces.map(w => db.configurations.getByWorkspace(w.id))
      );
      const templates = await Promise.all(
        workspaces.map(w => db.storyTemplates.getAll(w.id))
      );
      const fieldMappings = await Promise.all(
        workspaces.map(w => db.fieldMappings.getByWorkspace(w.id))
      );

      // Create export data
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          workspaces,
          stories: stories.flat(),
          configurations: configurations.filter(Boolean),
          templates: templates.flat(),
          fieldMappings: fieldMappings.flat(),
        },
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pb-ado-sync-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!db || !event.target.files?.length) return;

    setImporting(true);
    try {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);

          // Validate import data
          if (!importData.version || !importData.data) {
            throw new Error('Invalid import file format');
          }

          // Import workspaces first
          for (const workspace of importData.data.workspaces) {
            await db.workspaces.create(workspace);
          }

          // Import configurations
          for (const config of importData.data.configurations) {
            await db.configurations.create(config);
          }

          // Import templates
          for (const template of importData.data.templates) {
            await db.storyTemplates.create(template);
          }

          // Import field mappings
          for (const mapping of importData.data.fieldMappings) {
            await db.fieldMappings.create(mapping);
          }

          // Import stories last (due to dependencies)
          for (const story of importData.data.stories) {
            await db.stories.create(story);
          }

          toast.success('Data imported successfully');
        } catch (error) {
          console.error('Error processing import:', error);
          toast.error('Failed to process import file');
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import data');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Database Migration</h2>
        <p className="text-sm text-gray-500 mb-6">
          Export your data to migrate to a different backend or create a backup.
          You can also import previously exported data.
        </p>

        <div className="flex space-x-4">
          <button
            onClick={handleExport}
            disabled={exporting || !db}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>

          <label className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50">
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : 'Import Data'}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing || !db}
              className="hidden"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}