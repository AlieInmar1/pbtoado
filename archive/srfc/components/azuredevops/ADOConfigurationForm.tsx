import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AzureDevOpsClient } from '../../lib/api/azuredevops';
import { toast } from 'sonner';

export function ADOConfigurationForm() {
  const { currentWorkspace } = useWorkspace();
  const { db } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [organization, setOrganization] = useState('');
  const [project, setProject] = useState('');
  const [personalAccessToken, setPersonalAccessToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (!currentWorkspace || !db) return;

    async function loadConfiguration() {
      try {
        setLoading(true);
        // Load the current configuration
        setOrganization(currentWorkspace?.ado_organization || '');
        setProject(currentWorkspace?.ado_project_id || '');
        
        // Check if the ADO API key is set
        if (currentWorkspace?.ado_api_key) {
          setPersonalAccessToken(''); // Don't show the actual token for security
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      } catch (error) {
        console.error('Error loading ADO configuration:', error);
        toast.error('Failed to load Azure DevOps configuration');
      } finally {
        setLoading(false);
      }
    }

    loadConfiguration();
  }, [currentWorkspace, db]);

  const saveConfiguration = async () => {
    if (!currentWorkspace || !db) return;

    try {
      setLoading(true);
      
      // Update the workspace with the new configuration
      await db.workspaces.update(currentWorkspace.id, {
        ado_organization: organization,
        ado_project_id: project,
        ado_api_key: personalAccessToken || currentWorkspace?.ado_api_key || '',
      });
      
      setIsConfigured(true);
      toast.success('Azure DevOps configuration saved');
    } catch (error) {
      console.error('Error saving ADO configuration:', error);
      toast.error('Failed to save Azure DevOps configuration');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!organization || !project || !(personalAccessToken || (currentWorkspace && currentWorkspace.ado_api_key))) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setTestingConnection(true);
      
      // Use the Supabase Edge Function to test the connection
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-azuredevops`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organization,
            project,
            api_key: personalAccessToken || (currentWorkspace?.ado_api_key || ''),
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Successfully connected to Azure DevOps');
      } else {
        toast.error(`Failed to connect to Azure DevOps: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing ADO connection:', error);
      toast.error('Failed to connect to Azure DevOps');
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Azure DevOps Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <Input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g., mycompany"
            />
            <p className="mt-1 text-xs text-gray-500">
              The name of your Azure DevOps organization
            </p>
          </div>
          
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <Input
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g., MyProject"
            />
            <p className="mt-1 text-xs text-gray-500">
              The name of your Azure DevOps project
            </p>
          </div>
          
          <div>
            <label htmlFor="pat" className="block text-sm font-medium text-gray-700 mb-1">
              Personal Access Token
            </label>
            <Input
              id="pat"
              type="password"
              value={personalAccessToken}
              onChange={(e) => setPersonalAccessToken(e.target.value)}
              placeholder={isConfigured ? '••••••••••••••••' : 'Enter your Personal Access Token'}
            />
            <p className="mt-1 text-xs text-gray-500">
              {isConfigured 
                ? 'A Personal Access Token is already configured. Enter a new one to update it.'
                : 'Create a Personal Access Token with "Read & Write" permissions for Work Items'}
            </p>
          </div>
          
          <div className="pt-4 flex space-x-3">
            <Button
              onClick={testConnection}
              variant="secondary"
              loading={testingConnection}
            >
              Test Connection
            </Button>
            
            <Button
              onClick={saveConfiguration}
              loading={loading}
              disabled={!organization || !project}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
