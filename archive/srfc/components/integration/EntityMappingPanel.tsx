import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { adoWorkItemsApi, ADOWorkItem } from '../../lib/api/adoWorkItems';
import { ADOWorkItemsExplorer } from '../azuredevops/ADOWorkItemsExplorer';
import { Configuration, EntityMapping } from '../../types/database';

interface EntityMappingPanelProps {
  workspaceId?: string;
}

const EntityMappingPanel: React.FC<EntityMappingPanelProps> = ({ workspaceId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [selectedADOItem, setSelectedADOItem] = useState<ADOWorkItem | null>(null);
  const [selectedPBItem, setSelectedPBItem] = useState<any | null>(null);
  const [existingMappings, setExistingMappings] = useState<EntityMapping[]>([]);
  const [mappingInProgress, setMappingInProgress] = useState(false);

  // Fetch configuration on component mount
  useEffect(() => {
    fetchConfiguration();
    fetchExistingMappings();
  }, [workspaceId]);

  const fetchConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('id', '1') // This should be replaced with workspaceId when implemented
        .single();

      if (error) throw error;
      setConfig(data as Configuration);
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setError('Could not load ADO configuration. Please check workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('entity_mappings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setExistingMappings(data as EntityMapping[]);
    } catch (error) {
      console.error('Error fetching entity mappings:', error);
      setError('Could not load existing entity mappings.');
    }
  };

  const handleADOItemSelect = (item: ADOWorkItem) => {
    setSelectedADOItem(item);
    
    // Check if this ADO item is already mapped
    const existingMapping = existingMappings.find(mapping => mapping.ado_id === item.id);
    if (existingMapping) {
      // TODO: Fetch the ProductBoard item details using the ID from the mapping
      // For now, we'll just set a placeholder
      setSelectedPBItem({
        id: existingMapping.productboard_id,
        name: existingMapping.productboard_name,
        type: existingMapping.productboard_type,
      });
    } else {
      setSelectedPBItem(null);
    }
  };

  const handlePBItemSelect = (item: any) => {
    setSelectedPBItem(item);
  };

  const createMapping = async () => {
    if (!selectedADOItem || !selectedPBItem) {
      return;
    }

    setMappingInProgress(true);

    try {
      // Check if a mapping already exists for either item
      const existingADOMapping = existingMappings.find(mapping => mapping.ado_id === selectedADOItem.id);
      const existingPBMapping = existingMappings.find(mapping => mapping.productboard_id === selectedPBItem.id);

      if (existingADOMapping) {
        // Update existing mapping
        const { error } = await supabase
          .from('entity_mappings')
          .update({
            productboard_id: selectedPBItem.id,
            productboard_type: selectedPBItem.type || 'feature',
            productboard_name: selectedPBItem.name || selectedPBItem.title,
            productboard_description: selectedPBItem.description,
            productboard_status: selectedPBItem.status,
            sync_status: 'synced',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingADOMapping.id);

        if (error) throw error;
      } else if (existingPBMapping) {
        // Update existing mapping
        const { error } = await supabase
          .from('entity_mappings')
          .update({
            ado_id: selectedADOItem.id,
            ado_type: selectedADOItem.adoType,
            ado_title: selectedADOItem.title,
            ado_description: selectedADOItem.fields['System.Description'],
            ado_state: selectedADOItem.state,
            sync_status: 'synced',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPBMapping.id);

        if (error) throw error;
      } else {
        // Create new mapping
        const { error } = await supabase
          .from('entity_mappings')
          .insert({
            ado_id: selectedADOItem.id,
            ado_type: selectedADOItem.adoType,
            ado_title: selectedADOItem.title,
            ado_description: selectedADOItem.fields['System.Description'],
            ado_state: selectedADOItem.state,
            ado_url: selectedADOItem.url,
            productboard_id: selectedPBItem.id,
            productboard_type: selectedPBItem.type || 'feature',
            productboard_name: selectedPBItem.name || selectedPBItem.title,
            productboard_description: selectedPBItem.description,
            productboard_status: selectedPBItem.status,
            sync_status: 'synced',
            sync_direction: 'bidirectional',
            last_synced_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Refresh the list of mappings
      await fetchExistingMappings();
    } catch (error) {
      console.error('Error creating/updating mapping:', error);
      setError('Could not create or update entity mapping.');
    } finally {
      setMappingInProgress(false);
    }
  };

  const removeMapping = async () => {
    if (!selectedADOItem) return;

    try {
      const existingMapping = existingMappings.find(mapping => mapping.ado_id === selectedADOItem.id);
      if (!existingMapping) return;

      const { error } = await supabase
        .from('entity_mappings')
        .delete()
        .eq('id', existingMapping.id);

      if (error) throw error;

      // Refresh the list of mappings
      await fetchExistingMappings();
      setSelectedPBItem(null);
    } catch (error) {
      console.error('Error removing mapping:', error);
      setError('Could not remove entity mapping.');
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h3 className="font-semibold mb-2">Error</h3>
        <p>{error}</p>
        <button 
          onClick={fetchConfiguration}
          className="mt-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!config || !config.ado_api_key || !config.ado_organization || !config.ado_project_id) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
        <h3 className="font-semibold mb-2">Configuration Required</h3>
        <p>Please configure your Azure DevOps settings in the workspace settings page.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-medium mb-3">Azure DevOps Work Items</h2>
        <ADOWorkItemsExplorer 
          organization={config.ado_organization}
          project={config.ado_project_id}
          apiKey={config.ado_api_key}
          onSelectItem={handleADOItemSelect}
        />
      </div>
      
      <div>
        <h2 className="text-lg font-medium mb-3">ProductBoard Items</h2>
        <div className="bg-white rounded-md shadow p-4">
          <p className="text-gray-500">
            Select an item from ProductBoard to map it to the selected Azure DevOps item.
          </p>
          {/* TODO: Add ProductBoard items explorer, similar to ADOWorkItemsExplorer */}
          <div className="mt-4 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-2">Currently, you can manually enter ProductBoard item details:</p>
            <div className="space-y-3">
              <div>
                <label htmlFor="pb-id" className="block text-sm font-medium text-gray-700">
                  ProductBoard ID
                </label>
                <input
                  type="text"
                  id="pb-id"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedPBItem?.id || ''}
                  onChange={(e) => setSelectedPBItem({ ...selectedPBItem, id: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="pb-name" className="block text-sm font-medium text-gray-700">
                  ProductBoard Name
                </label>
                <input
                  type="text"
                  id="pb-name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedPBItem?.name || ''}
                  onChange={(e) => setSelectedPBItem({ ...selectedPBItem, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="pb-type" className="block text-sm font-medium text-gray-700">
                  ProductBoard Type
                </label>
                <select
                  id="pb-type"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedPBItem?.type || 'feature'}
                  onChange={(e) => setSelectedPBItem({ ...selectedPBItem, type: e.target.value })}
                >
                  <option value="feature">Feature</option>
                  <option value="initiative">Initiative</option>
                  <option value="component">Component</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-2">
        <div className="bg-white rounded-md shadow p-4">
          <h2 className="text-lg font-medium mb-3">Entity Mapping</h2>
          
          {selectedADOItem ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <h3 className="font-medium text-blue-800 mb-1">Selected Azure DevOps Item</h3>
                <p className="text-sm text-blue-900">{selectedADOItem.title}</p>
                <p className="text-xs text-blue-700 mt-1">ID: {selectedADOItem.id} • Type: {selectedADOItem.adoType} • State: {selectedADOItem.state}</p>
              </div>
              
              {selectedPBItem ? (
                <div className="bg-green-50 p-3 rounded-md">
                  <h3 className="font-medium text-green-800 mb-1">Selected ProductBoard Item</h3>
                  <p className="text-sm text-green-900">{selectedPBItem.name}</p>
                  <p className="text-xs text-green-700 mt-1">ID: {selectedPBItem.id} • Type: {selectedPBItem.type}</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-md">
                  <h3 className="font-medium text-gray-800 mb-1">No ProductBoard Item Selected</h3>
                  <p className="text-sm text-gray-600">Please select a ProductBoard item to map to this Azure DevOps item.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <h3 className="font-medium text-gray-800 mb-1">No Azure DevOps Item Selected</h3>
              <p className="text-sm text-gray-600">Please select an Azure DevOps item to map.</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 justify-start">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedADOItem || !selectedPBItem || mappingInProgress}
              onClick={createMapping}
            >
              {mappingInProgress ? 'Creating Mapping...' : 'Create Mapping'}
            </button>
            
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedADOItem || mappingInProgress || !existingMappings.some(mapping => mapping.ado_id === selectedADOItem?.id)}
              onClick={removeMapping}
            >
              Remove Mapping
            </button>
          </div>
        </div>
        
        <div className="mt-6 bg-white rounded-md shadow">
          <h2 className="text-lg font-medium p-4 border-b">Existing Entity Mappings</h2>
          
          {existingMappings.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No entity mappings found. Create a mapping by selecting an Azure DevOps item and a ProductBoard item above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azure DevOps
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ProductBoard
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Synced
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {existingMappings.map((mapping) => (
                    <tr key={mapping.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{mapping.ado_title}</div>
                        <div className="text-sm text-gray-500">ID: {mapping.ado_id} • Type: {mapping.ado_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{mapping.productboard_name}</div>
                        <div className="text-sm text-gray-500">ID: {mapping.productboard_id} • Type: {mapping.productboard_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          mapping.sync_status === 'synced' ? 'bg-green-100 text-green-800' :
                          mapping.sync_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {mapping.sync_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mapping.last_synced_at ? new Date(mapping.last_synced_at).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntityMappingPanel;
