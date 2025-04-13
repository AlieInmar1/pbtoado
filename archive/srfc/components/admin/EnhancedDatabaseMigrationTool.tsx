import React, { useState, useRef } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { SchemaVersionTracker } from './SchemaVersionTracker';
import { DataValidator } from '../../lib/database/migration/validator';
import { toast } from 'sonner';

export function EnhancedDatabaseMigrationTool() {
  const { db } = useDatabase();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    valid: boolean;
    errors: string[];
    fileName?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!db) return;

    setExporting(true);
    try {
      // Export all data
      const workspaces = await db.workspaces.getAll();
      const stories = await Promise.all(
        workspaces.map(async w => {
          return await db.stories.getByWorkspace(w.id);
        })
      ).then(results => results.flat());
      
      const configurations = await Promise.all(
        workspaces.map(async w => {
          const config = await db.configurations.getByWorkspace(w.id);
          return config ? [config] : [];
        })
      ).then(results => results.flat());
      
      const templates = await Promise.all(
        workspaces.map(w => db.storyTemplates.getAll(w.id))
      ).then(results => results.flat());
      
      const fieldMappings = await Promise.all(
        workspaces.map(w => db.fieldMappings.getByWorkspace(w.id))
      ).then(results => results.flat());
      
      const featureFlags = await Promise.all(
        workspaces.map(w => db.featureFlags.getAll(w.id))
      ).then(results => results.flat());
      
      const aiPrompts = await Promise.all(
        workspaces.map(w => db.aiPrompts.getAll(w.id))
      ).then(results => results.flat());

      // Create export data
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          workspaces,
          stories,
          configurations,
          templates,
          fieldMappings,
          featureFlags,
          aiPrompts,
        },
      };

      // Validate export data
      try {
        DataValidator.validateExportData(exportData);
      } catch (error) {
        console.error('Export validation error:', error);
        toast.error('Export validation failed. See console for details.');
        return;
      }

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pbtoado-export-${new Date().toISOString().replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
      setValidationResults(null);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleValidateFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        const validationResult = DataValidator.validateImportData(importData);
        
        setValidationResults({
          ...validationResult,
          fileName: file.name,
        });

        if (!validationResult.valid) {
          console.error('Validation errors:', validationResult.errors);
        }
      } catch (error) {
        setValidationResults({
          valid: false,
          errors: ['Invalid JSON format'],
          fileName: file.name,
        });
        console.error('Error parsing import file:', error);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!db || !validationResults?.valid || !fileInputRef.current?.files?.length) {
      toast.error('Please validate a valid file first');
      return;
    }

    setImporting(true);
    try {
      const file = fileInputRef.current.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          const validationResult = DataValidator.validateImportData(importData);
          
          if (!validationResult.valid || !validationResult.data) {
            throw new Error('Invalid import data');
          }

          const data = validationResult.data;

          // Import workspaces first
          for (const workspace of data.data.workspaces) {
            // Check if workspace exists
            const existingWorkspace = await db.workspaces.getById(workspace.id);
            if (existingWorkspace) {
              await db.workspaces.update(workspace.id, workspace);
            } else {
              await db.workspaces.create(workspace);
            }
          }

          // Import configurations
          for (const config of data.data.configurations) {
            const existingConfig = await db.configurations.getById(config.id);
            if (existingConfig) {
              await db.configurations.update(config.id, config);
            } else {
              await db.configurations.create(config);
            }
          }

          // Import templates
          for (const template of data.data.templates) {
            const existingTemplate = await db.storyTemplates.getById(template.id);
            if (existingTemplate) {
              await db.storyTemplates.update(template.id, template);
            } else {
              await db.storyTemplates.create(template);
            }
          }

          // Import field mappings
          for (const mapping of data.data.fieldMappings) {
            const existingMapping = await db.fieldMappings.getById(mapping.id);
            if (existingMapping) {
              await db.fieldMappings.update(mapping.id, mapping);
            } else {
              await db.fieldMappings.create(mapping);
            }
          }

          // Import feature flags
          for (const flag of data.data.featureFlags || []) {
            const existingFlag = await db.featureFlags.getById(flag.id);
            if (existingFlag) {
              await db.featureFlags.update(flag.id, flag);
            } else {
              await db.featureFlags.create(flag);
            }
          }

          // Import AI prompts
          for (const prompt of data.data.aiPrompts || []) {
            const existingPrompt = await db.aiPrompts.getById(prompt.id);
            if (existingPrompt) {
              await db.aiPrompts.update(prompt.id, prompt);
            } else {
              await db.aiPrompts.create(prompt);
            }
          }

          // Import stories last (due to dependencies)
          for (const story of data.data.stories) {
            const existingStory = await db.stories.getById(story.id);
            if (existingStory) {
              await db.stories.update(story.id, story);
            } else {
              await db.stories.create(story);
            }
          }

          toast.success('Data imported successfully');
          setValidationResults(null);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('Error processing import:', error);
          toast.error('Failed to process import file');
        } finally {
          setImporting(false);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import data');
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Database Migration</h2>
          <p className="text-sm text-gray-500 mb-6">
            Export your data to migrate to a different backend or create a backup.
            You can also import previously exported data.
          </p>

          <div className="flex space-x-4">
            <Button
              onClick={handleExport}
              disabled={exporting || !db}
              variant="outline"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>

            <label className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50">
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Validate Import File
              <input
                type="file"
                accept=".json"
                onChange={handleValidateFile}
                disabled={importing || !db}
                className="hidden"
                ref={fileInputRef}
              />
            </label>

            <Button
              onClick={handleImport}
              disabled={importing || !db || !validationResults?.valid}
              variant="primary"
            >
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </div>

          {validationResults && (
            <div className={`mt-4 p-4 rounded-md ${validationResults.valid ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                {validationResults.valid ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                )}
                <div>
                  <h3 className={`text-sm font-medium ${validationResults.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {validationResults.valid ? 'Validation Successful' : 'Validation Failed'}
                  </h3>
                  <div className="mt-2 text-sm">
                    {validationResults.valid ? (
                      <p className="text-green-700">
                        File "{validationResults.fileName}" is valid and ready to import.
                      </p>
                    ) : (
                      <div>
                        <p className="text-red-700 mb-2">
                          File "{validationResults.fileName}" contains the following errors:
                        </p>
                        <ul className="list-disc list-inside text-red-700">
                          {validationResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SchemaVersionTracker />
    </div>
  );
}
