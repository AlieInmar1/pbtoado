import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { IntegrationService } from '../../lib/services/IntegrationService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { Configuration } from '../../types/database';
import { toast } from 'sonner';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';

interface IntegrationSettingsProps {
  config?: Partial<Configuration>;
  setConfig?: (config: Partial<Configuration>) => void;
  onSave?: () => Promise<void>;
  workspaceId?: string;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ 
  config, 
  setConfig, 
  onSave,
  workspaceId 
}) => {
  // Get database and workspace context
  const { db } = useDatabase();
  const { workspaces, currentWorkspace } = useWorkspace();
  const [adoWebhookUrl, setAdoWebhookUrl] = useState<string>('');
  const [adoWebhookInstructions, setAdoWebhookInstructions] = useState<string>('');
  const [enableTitlePrefixing, setEnableTitlePrefixing] = useState<boolean>(false);
  const [enableParentChildLinks, setEnableParentChildLinks] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Get the webhook URL and instructions
    const webhookUrl = IntegrationService.getADOWebhookUrl();
    const instructions = IntegrationService.getADOWebhookInstructions();
    
    setAdoWebhookUrl(webhookUrl);
    setAdoWebhookInstructions(instructions);
    
    // Load feature flags
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .in('name', ['enable_ado_title_prefixing', 'enable_ado_parent_child_links']);
      
      if (error) {
        console.error('Error loading feature flags:', error);
        return;
      }
      
      if (data) {
        const titlePrefixFlag = data.find(flag => flag.name === 'enable_ado_title_prefixing');
        const parentChildFlag = data.find(flag => flag.name === 'enable_ado_parent_child_links');
        
        setEnableTitlePrefixing(titlePrefixFlag?.enabled || false);
        setEnableParentChildLinks(parentChildFlag?.enabled || false);
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  };

  const saveFeatureFlags = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Update the title prefixing flag
      const { error: titleError } = await supabase
        .from('feature_flags')
        .upsert({
          name: 'enable_ado_title_prefixing',
          description: 'Enable prefixing ADO work item titles with ProductBoard IDs',
          enabled: enableTitlePrefixing,
          conditions: {},
          updated_at: new Date().toISOString()
        }, { onConflict: 'name' });
      
      if (titleError) {
        console.error('Error saving title prefixing flag:', titleError);
        setSaveMessage('Error saving settings. Please try again.');
        return;
      }
      
      // Update the parent-child links flag
      const { error: parentChildError } = await supabase
        .from('feature_flags')
        .upsert({
          name: 'enable_ado_parent_child_links',
          description: 'Enable creating parent-child links in ADO for related ProductBoard items',
          enabled: enableParentChildLinks,
          conditions: {},
          updated_at: new Date().toISOString()
        }, { onConflict: 'name' });
      
      if (parentChildError) {
        console.error('Error saving parent-child links flag:', parentChildError);
        setSaveMessage('Error saving settings. Please try again.');
        return;
      }
      
      setSaveMessage('Settings saved successfully!');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving feature flags:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (service: string) => {
    setTestingConnection({ ...testingConnection, [service]: true });
    
    try {
      let success = false;
      let message = '';
      
      if (service === 'productboard') {
        if (!config?.productboard_api_key) {
          toast.error('Please enter a ProductBoard API key first');
          return;
        }
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-productboard`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: config.productboard_api_key,
            }),
          }
        );
        
        const data = await response.json();
        success = data.success;
        message = data.message || (success ? 'Successfully connected to ProductBoard' : 'Failed to connect to ProductBoard');
      } else if (service === 'openai') {
        if (!config?.openai_api_key) {
          toast.error('Please enter an OpenAI API key first');
          return;
        }
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-openai`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: config.openai_api_key,
            }),
          }
        );
        
        const data = await response.json();
        success = data.success;
        message = data.error || (success ? 'Successfully connected to OpenAI' : 'Failed to connect to OpenAI');
      } else if (service === 'ado') {
        // Use the API key from the workspace if available, otherwise use the one from config
        const apiKey = currentWorkspace?.ado_api_key || config?.ado_api_key;
        if (!apiKey) {
          toast.error('Please enter an Azure DevOps API key first');
          return;
        }
        
        // Extract organization and project from ado_project_id
        let organization = '';
        let project = '';
        
        if (currentWorkspace?.ado_project_id) {
          const parts = currentWorkspace.ado_project_id.split('/');
          if (parts.length === 2) {
            organization = parts[0];
            project = parts[1];
          }
        }
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-azuredevops`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              organization: organization || 'inmar',
              project: project || 'Healthcare',
              api_key: apiKey,
            }),
          }
        );
        
        const data = await response.json();
        success = data.success;
        message = data.error || (success ? 'Successfully connected to Azure DevOps' : 'Failed to connect to Azure DevOps');
      } else if (service === 'slack') {
        // Similar implementation for Slack
      } else if (service === 'google_spaces') {
        // Similar implementation for Google Spaces
      }
      
      if (success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error(`Error testing ${service} connection:`, error);
      toast.error(`Failed to test ${service} connection`);
    } finally {
      setTestingConnection({ ...testingConnection, [service]: false });
    }
  };
  
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(adoWebhookUrl);
    setSaveMessage('Webhook URL copied to clipboard!');
    
    // Clear the message after 3 seconds
    setTimeout(() => {
      setSaveMessage('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Azure DevOps Integration Settings</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Feature Flags</h3>
          <p className="text-gray-600 mb-4">
            These settings control how the integration between ProductBoard and Azure DevOps works.
            You can enable or disable specific features as needed.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Title Prefixing</h4>
                <p className="text-sm text-gray-500">
                  When enabled, Azure DevOps work item titles will be prefixed with the ProductBoard ID (e.g., [PB123]).
                </p>
              </div>
              <Switch
                checked={enableTitlePrefixing}
                onChange={setEnableTitlePrefixing}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Parent-Child Links</h4>
                <p className="text-sm text-gray-500">
                  When enabled, parent-child relationships from ProductBoard will be created in Azure DevOps.
                </p>
              </div>
              <Switch
                checked={enableParentChildLinks}
                onChange={setEnableParentChildLinks}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              onClick={saveFeatureFlags}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            {saveMessage && (
              <p className={`mt-2 text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </p>
            )}
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-2">API Keys</h3>
          <p className="text-gray-600 mb-4">
            Configure your API keys for integration with external services.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="productboardApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                ProductBoard API Key
              </label>
              <div className="flex space-x-2">
                <div className="flex-grow">
                  <Input
                    id="productboardApiKey"
                    type="password"
                    value={config?.productboard_api_key || ''}
                    onChange={(e) => setConfig?.({ ...config, productboard_api_key: e.target.value })}
                    placeholder="Enter your ProductBoard API Key"
                  />
                </div>
                <Button
                  onClick={() => testConnection('productboard')}
                  variant="secondary"
                  size="sm"
                >
                  Test
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Used to connect to ProductBoard for syncing stories and features
              </p>
            </div>
            
            <div>
              <label htmlFor="adoApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Azure DevOps API Key
              </label>
              <div className="flex space-x-2">
                <div className="flex-grow">
                  <Input
                    id="adoApiKey"
                    type="password"
                    value={config?.ado_api_key || ''}
                    onChange={(e) => {
                      // Update the config object for the configurations table
                      setConfig?.({ ...config, ado_api_key: e.target.value });
                      
                      // Also update the workspace record if available
                      if (currentWorkspace && db) {
                        db.workspaces.update(currentWorkspace.id, {
                          ...currentWorkspace,
                          ado_api_key: e.target.value
                        });
                      }
                    }}
                    placeholder="Enter your Azure DevOps Personal Access Token"
                  />
                </div>
                <Button
                  onClick={() => testConnection('ado')}
                  variant="secondary"
                  size="sm"
                  disabled={testingConnection['ado']}
                >
                  {testingConnection['ado'] ? 'Testing...' : 'Test'}
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Personal Access Token with "Read & Write" permissions for Work Items
              </p>
            </div>
            
            <div>
              <label htmlFor="openaiApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI API Key
              </label>
              <div className="flex space-x-2">
                <div className="flex-grow">
                  <Input
                    id="openaiApiKey"
                    type="password"
                    value={config?.openai_api_key || ''}
                    onChange={(e) => setConfig?.({ ...config, openai_api_key: e.target.value })}
                    placeholder="Enter your OpenAI API Key"
                  />
                </div>
                <Button
                  onClick={() => testConnection('openai')}
                  variant="secondary"
                  size="sm"
                  disabled={testingConnection['openai']}
                >
                  {testingConnection['openai'] ? 'Testing...' : 'Test'}
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Used for AI-powered features like story analysis and completeness scoring
              </p>
            </div>
            
            <div>
              <label htmlFor="slackApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Slack API Key
              </label>
              <div className="flex space-x-2">
                <div className="flex-grow">
                  <Input
                    id="slackApiKey"
                    type="password"
                    value={config?.slack_api_key || ''}
                    onChange={(e) => setConfig?.({ ...config, slack_api_key: e.target.value })}
                    placeholder="Enter your Slack API Key"
                  />
                </div>
                <Button
                  onClick={() => testConnection('slack')}
                  variant="secondary"
                  size="sm"
                  disabled={testingConnection['slack']}
                >
                  {testingConnection['slack'] ? 'Testing...' : 'Test'}
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Used for sending notifications to Slack
              </p>
            </div>
            
            <div>
              <label htmlFor="slackChannelId" className="block text-sm font-medium text-gray-700 mb-1">
                Slack Channel ID
              </label>
              <Input
                id="slackChannelId"
                value={config?.slack_channel_id || ''}
                onChange={(e) => setConfig?.({ ...config, slack_channel_id: e.target.value })}
                placeholder="Enter your Slack Channel ID"
              />
              <p className="mt-1 text-xs text-gray-500">
                The channel where notifications will be sent
              </p>
            </div>
            
            <div>
              <label htmlFor="googleSpacesWebhook" className="block text-sm font-medium text-gray-700 mb-1">
                Google Spaces Webhook URL
              </label>
              <div className="flex space-x-2">
                <div className="flex-grow">
                  <Input
                    id="googleSpacesWebhook"
                    value={config?.google_spaces_webhook_url || ''}
                    onChange={(e) => setConfig?.({ ...config, google_spaces_webhook_url: e.target.value })}
                    placeholder="Enter your Google Spaces Webhook URL"
                  />
                </div>
                <Button
                  onClick={() => testConnection('google_spaces')}
                  variant="secondary"
                  size="sm"
                  disabled={testingConnection['google_spaces']}
                >
                  {testingConnection['google_spaces'] ? 'Testing...' : 'Test'}
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Used for sending notifications to Google Chat Spaces
              </p>
            </div>
            
            <div className="pt-4">
              <Button
                onClick={() => onSave?.()}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Save API Keys'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-2">Azure DevOps Configuration</h3>
          <p className="text-gray-600 mb-4">
            Configure your Azure DevOps organization and project settings.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="adoOrganization" className="block text-sm font-medium text-gray-700 mb-1">
                Azure DevOps Organization
              </label>
              <Input
                id="adoOrganization"
                value={currentWorkspace?.ado_project_id?.split('/')[0] || 'inmar'}
                onChange={(e) => {
                  if (currentWorkspace && db) {
                    const project = currentWorkspace.ado_project_id?.split('/')[1] || 'Healthcare';
                    db.workspaces.update(currentWorkspace.id, {
                      ...currentWorkspace,
                      ado_project_id: `${e.target.value}/${project}`
                    });
                  }
                }}
                placeholder="Enter your Azure DevOps Organization"
              />
              <p className="mt-1 text-xs text-gray-500">
                The name of your Azure DevOps organization (e.g., inmar)
              </p>
            </div>
            
            <div>
              <label htmlFor="adoProject" className="block text-sm font-medium text-gray-700 mb-1">
                Azure DevOps Project
              </label>
              <Input
                id="adoProject"
                value={currentWorkspace?.ado_project_id?.split('/')[1] || 'Healthcare'}
                onChange={(e) => {
                  if (currentWorkspace && db) {
                    const organization = currentWorkspace.ado_project_id?.split('/')[0] || 'inmar';
                    db.workspaces.update(currentWorkspace.id, {
                      ...currentWorkspace,
                      ado_project_id: `${organization}/${e.target.value}`
                    });
                  }
                }}
                placeholder="Enter your Azure DevOps Project"
              />
              <p className="mt-1 text-xs text-gray-500">
                The name of your Azure DevOps project (e.g., Healthcare)
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium mb-2">Azure DevOps Webhook</h3>
          <p className="text-gray-600 mb-4">
            To enable real-time synchronization, you need to set up a webhook in Azure DevOps that points to our integration service.
          </p>
          
          <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between mb-4">
            <code className="text-sm break-all">{adoWebhookUrl}</code>
            <Button
              onClick={copyWebhookUrl}
              className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-800"
              size="sm"
            >
              Copy
            </Button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-2">Setup Instructions</h4>
            <pre className="text-sm whitespace-pre-wrap">{adoWebhookInstructions}</pre>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IntegrationSettings;
