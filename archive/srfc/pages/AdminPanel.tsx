import React, { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { 
  ArrowsRightLeftIcon, 
  PlusIcon, 
  DocumentDuplicateIcon, 
  FlagIcon, 
  Cog8ToothIcon, 
  CubeIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  ServerIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { WorkspaceCard } from '../components/workspace/WorkspaceCard';
import { PageHeader } from '../components/admin/PageHeader';
import { AdminCard } from '../components/admin/AdminCard';
import { NewWorkspaceModal } from '../components/admin/NewWorkspaceModal';
import { ConfigurationForm } from '../components/admin/ConfigurationForm';
import { CollapsibleSection } from '../components/admin/CollapsibleSection';
import { IntegrationSettings } from '../components/admin/IntegrationSettings';
import { ProductBoardTools } from '../components/admin/ProductBoardTools';
import { DatabaseMigrationTools } from '../components/admin/DatabaseMigrationTools';
import type { Configuration } from '../types/database';

export function AdminPanel() {
  const { db } = useDatabase();
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [config, setConfig] = useState<Partial<Configuration>>({});

  useEffect(() => {
    if (!db) return;
    const workspaceId = '6f171cbd-8b15-4779-b4fc-4092649e70d1';

    async function loadConfig() {
      try {
        const config = await db?.configurations.getByWorkspace(workspaceId);
        setConfig(config || {
          openai_api_key: null,
          slack_api_key: null,
          slack_channel_id: null,
          google_spaces_webhook_url: null,
          field_propagation_enabled: true,
          epic_to_feature_rules: {},
          feature_to_story_rules: {},
          risk_threshold_days: 7
        });
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    }

    loadConfig();
  }, [db]);

  const saveIntegrationSettings = async () => {
    if (!db) return;
    const workspaceId = '6f171cbd-8b15-4779-b4fc-4092649e70d1';
    
    try {
      const configData = {
        id: config.id,
        workspace_id: workspaceId,
        field_propagation_enabled: true,
        epic_to_feature_rules: {},
        feature_to_story_rules: {},
        risk_threshold_days: 7,
        ...config
      };
      
      // Save to configurations table
      if (config.id) {
        await db.configurations.update(config.id, configData);
      } else {
        await db.configurations.create(configData);
      }
      
      // Also update the workspace record with the ADO API key to keep both in sync
      try {
        const workspace = await db.workspaces.getById(workspaceId);
        if (workspace) {
          await db.workspaces.update(workspaceId, {
            ...workspace,
            ado_api_key: config.ado_api_key || ''
          });
        }
      } catch (workspaceError) {
        console.error('Error updating workspace with API key:', workspaceError);
        // Continue execution even if workspace update fails
      }
      
      toast.success('Integration settings saved successfully');
    } catch (error) {
      console.error('Error saving integration settings:', error);
      toast.error('Failed to save integration settings');
      throw error;
    }
  };

  // Quick navigation links
  const QuickNav = () => (
    <div className="mb-6 flex flex-wrap gap-2">
      <a href="#integrations" className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 bg-indigo-50 rounded-full">
        Integrations
      </a>
      <a href="#workspaces" className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 bg-indigo-50 rounded-full">
        Workspaces
      </a>
      <a href="#configuration" className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 bg-indigo-50 rounded-full">
        Configuration
      </a>
      <a href="#productboard" className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 bg-indigo-50 rounded-full">
        ProductBoard
      </a>
      <a href="#database" className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 bg-indigo-50 rounded-full">
        Database
      </a>
      <a href="/admin/entity-mappings" className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 bg-indigo-50 rounded-full">
        Entity Mappings
      </a>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Admin Panel"
        buttonText="New Workspace"
        buttonIcon={PlusIcon}
        onButtonClick={() => setShowNewWorkspaceModal(true)}
      />

      <QuickNav />

      <div className="mb-12 space-y-8">
        {/* Integration Settings Section */}
        <CollapsibleSection 
          title="Integration Settings" 
          defaultOpen={true}
          icon={Cog6ToothIcon}
          id="integrations"
        >
          <IntegrationSettings 
            config={config} 
            setConfig={setConfig} 
            onSave={saveIntegrationSettings} 
          />
        </CollapsibleSection>

        {/* Workspaces Section */}
        <CollapsibleSection 
          title="Workspaces" 
          defaultOpen={true}
          id="workspaces"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <WorkspaceCard
              key="6f171cbd-8b15-4779-b4fc-4092649e70d1"
              workspace={{
                id: '6f171cbd-8b15-4779-b4fc-4092649e70d1',
                name: 'Default Workspace',
                pb_board_id: 'default',
                ado_project_id: 'Healthcare',
                ado_organization: 'inmar',
                pb_api_key: '',
                ado_api_key: '',
                sync_frequency: '01:00:00',
                last_sync_timestamp: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }}
            />
          </div>
        </CollapsibleSection>

        {/* Configuration Section */}
        <CollapsibleSection 
          title="Configuration" 
          defaultOpen={false}
          icon={WrenchScrewdriverIcon}
          id="configuration"
        >
          <ConfigurationForm
            config={config}
            onUpdate={async (data) => {
              if (!db || !config.id) return;
              await db.configurations.update(config.id, data);
              setConfig({ ...config, ...data });
            }}
          />
        </CollapsibleSection>

        {/* ProductBoard Tools Section */}
        <CollapsibleSection 
          title="ProductBoard Tools" 
          defaultOpen={false}
          icon={CubeIcon}
          id="productboard"
        >
          <ProductBoardTools apiKey={config.productboard_api_key || ''} />
        </CollapsibleSection>

        {/* Database Migration Section */}
        <CollapsibleSection 
          title="Database Migration" 
          defaultOpen={false}
          icon={ServerIcon}
          id="database"
        >
          <DatabaseMigrationTools />
        </CollapsibleSection>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AdminCard
          to="/admin/database"
          icon={Cog8ToothIcon}
          title="Database Settings"
          description="Configure database providers and migration settings"
        />
        <AdminCard
          to="/admin/productboard"
          icon={CubeIcon}
          title="ProductBoard"
          description="Explore ProductBoard data and configure sync settings"
        />
        <AdminCard
          to="/admin/field-mappings"
          icon={ArrowsRightLeftIcon}
          title="Field Mappings"
          description="Configure field mappings between systems"
        />
        <AdminCard
          to="/admin/feature-flags"
          icon={FlagIcon}
          title="Feature Flags"
          description="Manage feature flags and toggles"
        />
        <AdminCard
          to="/admin/story-templates"
          icon={DocumentDuplicateIcon}
          title="Story Templates"
          description="Create and manage reusable story templates"
        />
        <AdminCard
          to="/admin/entity-mappings"
          icon={LinkIcon}
          title="Entity Mappings"
          description="Manage mappings between Azure DevOps and ProductBoard"
        />
      </div>

      {showNewWorkspaceModal && (
        <NewWorkspaceModal
          onClose={() => setShowNewWorkspaceModal(false)}
          onCreated={() => {
            // Refresh workspaces list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
