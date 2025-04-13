import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { IntegrationService } from '../../lib/services/IntegrationService';
import { EntityMapping } from '../../types/database';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface EntityMappingListProps {
  integrationService: IntegrationService;
}

export const EntityMappingList: React.FC<EntityMappingListProps> = ({ integrationService }) => {
  const { currentWorkspace } = useWorkspace();
  const [mappings, setMappings] = useState<EntityMapping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unmatchedADOItems, setUnmatchedADOItems] = useState<any[]>([]);
  const [unmatchedPBItems, setUnmatchedPBItems] = useState<any[]>([]);
  const [showUnmatched, setShowUnmatched] = useState<boolean>(false);

  useEffect(() => {
    if (!currentWorkspace) return;
    
    const fetchMappings = async () => {
      try {
        setLoading(true);
        const fetchedMappings = await integrationService.entityMappingRepository.getAll(currentWorkspace.id);
        setMappings(fetchedMappings);
        setError(null);
      } catch (err) {
        console.error('Error fetching entity mappings:', err);
        setError('Failed to load entity mappings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMappings();
  }, [currentWorkspace, integrationService]);

  const fetchUnmatchedItems = async () => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const adoItems = await integrationService.findUnmatchedADOItems(currentWorkspace.id);
      const pbItems = await integrationService.findUnmatchedProductBoardItems(currentWorkspace.id);
      
      setUnmatchedADOItems(adoItems);
      setUnmatchedPBItems(pbItems);
      setShowUnmatched(true);
    } catch (err) {
      console.error('Error fetching unmatched items:', err);
      setError('Failed to load unmatched items');
    } finally {
      setLoading(false);
    }
  };

  const createMapping = async (adoId: string, productboardId: string) => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      await integrationService.createEntityMapping(adoId, productboardId, currentWorkspace.id);
      
      // Refresh mappings
      const fetchedMappings = await integrationService.entityMappingRepository.getAll(currentWorkspace.id);
      setMappings(fetchedMappings);
      
      // Refresh unmatched items
      const adoItems = await integrationService.findUnmatchedADOItems(currentWorkspace.id);
      const pbItems = await integrationService.findUnmatchedProductBoardItems(currentWorkspace.id);
      
      setUnmatchedADOItems(adoItems);
      setUnmatchedPBItems(pbItems);
      
      setError(null);
    } catch (err) {
      console.error('Error creating entity mapping:', err);
      setError('Failed to create entity mapping');
    } finally {
      setLoading(false);
    }
  };

  const detectLinks = async (adoId: string) => {
    try {
      setLoading(true);
      const productboardId = await integrationService.detectProductBoardLinks(adoId);
      
      if (productboardId) {
        await createMapping(adoId, productboardId);
      } else {
        setError(`No ProductBoard link found for ADO item ${adoId}`);
      }
    } catch (err) {
      console.error('Error detecting links:', err);
      setError('Failed to detect links');
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) {
    return <div>Please select a workspace</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Entity Mappings</h2>
        <div className="space-x-2">
          <Button onClick={fetchUnmatchedItems} disabled={loading}>
            Find Unmatched Items
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {/* Existing Mappings */}
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Existing Mappings ({mappings.length})</h3>
              
              {mappings.length === 0 ? (
                <p className="text-gray-500">No entity mappings found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ADO Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ProductBoard Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sync Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Direction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Synced
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mappings.map((mapping) => (
                        <tr key={mapping.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {mapping.ado_title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {mapping.ado_type} #{mapping.ado_id}
                            </div>
                            {mapping.ado_url && (
                              <a
                                href={mapping.ado_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-xs"
                              >
                                View in ADO
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {mapping.productboard_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {mapping.productboard_type} #{mapping.productboard_id.substring(0, 8)}...
                            </div>
                            {mapping.productboard_url && (
                              <a
                                href={mapping.productboard_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-xs"
                              >
                                View in ProductBoard
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              mapping.sync_status === 'synced'
                                ? 'bg-green-100 text-green-800'
                                : mapping.sync_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {mapping.sync_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mapping.sync_direction === 'bidirectional'
                              ? '↔️ Bidirectional'
                              : mapping.sync_direction === 'ado_to_pb'
                              ? '→ ADO to PB'
                              : '← PB to ADO'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mapping.last_synced_at
                              ? new Date(mapping.last_synced_at).toLocaleString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
          
          {/* Unmatched Items */}
          {showUnmatched && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Unmatched ADO Items */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Unmatched ADO Items ({unmatchedADOItems.length})
                  </h3>
                  
                  {unmatchedADOItems.length === 0 ? (
                    <p className="text-gray-500">No unmatched ADO items found</p>
                  ) : (
                    <div className="overflow-y-auto max-h-96">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {unmatchedADOItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.fields['System.Title']}
                                </div>
                                <div className="text-sm text-gray-500">
                                  #{item.id}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.fields['System.WorkItemType']}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => detectLinks(item.id)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-2"
                                  disabled={loading}
                                >
                                  Detect Links
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Unmatched ProductBoard Items */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Unmatched ProductBoard Items ({unmatchedPBItems.length})
                  </h3>
                  
                  {unmatchedPBItems.length === 0 ? (
                    <p className="text-gray-500">No unmatched ProductBoard items found</p>
                  ) : (
                    <div className="overflow-y-auto max-h-96">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {unmatchedPBItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  #{item.id.substring(0, 8)}...
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};
