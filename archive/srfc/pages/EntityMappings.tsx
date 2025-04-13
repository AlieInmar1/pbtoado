import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { IntegrationService, IntegrationServiceConfig } from '../lib/services/IntegrationService';
import { EntityMappingList } from '../components/integration/EntityMappingList';
import { PageHeader } from '../components/admin/PageHeader';

export const EntityMappingsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const { db } = useDatabase();
  const [integrationService, setIntegrationService] = useState<IntegrationService | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkspace || !db) return;

    const initializeIntegrationService = async () => {
      try {
        setLoading(true);
        
        // Get the configuration for the current workspace
        const config = await db.configurations.getByWorkspace(currentWorkspace.id);
        
        if (!config) {
          setError('No configuration found for this workspace');
          setLoading(false);
          return;
        }
        
        // Create the integration service config
        const serviceConfig: IntegrationServiceConfig = {
          useMockADO: true, // Use mock ADO client for now
          adoOrganization: currentWorkspace.ado_organization,
          adoProject: currentWorkspace.ado_project_id,
          adoToken: currentWorkspace.ado_api_key,
          productboardApiKey: config.productboard_api_key || undefined
        };
        
        // Create the integration service
        const service = new IntegrationService(
          serviceConfig,
          db.entityMappings
        );
        
        setIntegrationService(service);
        setError(null);
      } catch (err) {
        console.error('Error initializing integration service:', err);
        setError('Failed to initialize integration service');
      } finally {
        setLoading(false);
      }
    };
    
    initializeIntegrationService();
  }, [currentWorkspace, db]);

  if (!currentWorkspace) {
    return <div>Please select a workspace</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Entity Mappings"
        description="Manage mappings between Azure DevOps and ProductBoard"
      />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : integrationService ? (
        <EntityMappingList integrationService={integrationService} />
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Integration service not available
        </div>
      )}
    </div>
  );
};

export default EntityMappingsPage;
