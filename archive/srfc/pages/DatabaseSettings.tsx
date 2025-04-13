import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '../components/admin/PageHeader';
import { DatabaseProviderSelector } from '../components/admin/DatabaseProviderSelector';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DatabaseProviderFactory } from '../lib/database/factory';
import { useDatabase } from '../contexts/DatabaseContext';
import type { DatabaseConfig } from '../lib/database/types/config';

export function DatabaseSettings() {
  const { db } = useDatabase();
  const [config, setConfig] = useState<DatabaseConfig>(
    DatabaseProviderFactory.getDefaultConfig('supabase')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('database_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved database configuration:', error);
      }
    }
  }, []);

  const handleSaveConfig = () => {
    setIsSaving(true);
    try {
      // Save to local storage
      localStorage.setItem('database_config', JSON.stringify(config));
      
      toast.success('Database configuration saved successfully');
      
      // Note: In a real application, you would need to restart the application
      // or reload the database provider to apply the new configuration
    } catch (error) {
      console.error('Error saving database configuration:', error);
      toast.error('Failed to save database configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Create a temporary database provider with the current configuration
      const tempDb = DatabaseProviderFactory.create(config);
      
      // Try to get a list of workspaces to test the connection
      await tempDb.workspaces.getAll();
      
      setTestResult({
        success: true,
        message: 'Connection successful! Database is accessible.',
      });
    } catch (error) {
      console.error('Error testing database connection:', error);
      setTestResult({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetConfig = () => {
    const defaultConfig = DatabaseProviderFactory.getDefaultConfig(config.type);
    setConfig(defaultConfig);
    toast.info('Configuration reset to defaults');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Database Settings"
        description="Configure your database connection and migration settings"
      />

      <div className="space-y-8">
        <DatabaseProviderSelector
          initialConfig={config}
          onConfigChange={setConfig}
        />

        <Card>
          <CardContent>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Connection Management</h2>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  variant="outline"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  variant="primary"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
                
                <Button
                  onClick={handleResetConfig}
                  variant="secondary"
                >
                  Reset to Defaults
                </Button>
              </div>
              
              {testResult && (
                <div
                  className={`p-4 rounded-md ${
                    testResult.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {testResult.message}
                  </p>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                <p className="mb-2">
                  <strong>Note:</strong> Changing the database provider requires restarting the application.
                </p>
                <p>
                  After saving a new configuration, you will need to reload the page for changes to take effect.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Current Configuration</h2>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
