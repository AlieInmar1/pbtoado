import React from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Plus, Trash2, RefreshCw, Check } from 'lucide-react';
import { InitiativeEpicMappingTabProps } from './types';

/**
 * InitiativeEpicMappingTab component for managing initiative epic mappings
 */
export const InitiativeEpicMappingTab: React.FC<InitiativeEpicMappingTabProps> = ({ 
  editedMapping,
  setEditedMapping,
  activeTab,
  pbInitiatives,
  adoEpics,
  isLoadingInitiatives,
  initiativesError,
  suggestedInitiativeMappings,
  fetchInitiativesAndEpics,
  handleAddInitiativeEpicMapping,
  handleRemoveInitiativeEpicMapping,
  handleUpdateInitiativeEpicMapping
}) => {
  if (!editedMapping || activeTab !== 'initiative-epic') return null;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Initiative/Epic Mapping</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchInitiativesAndEpics}
            disabled={isLoadingInitiatives}
            className="flex items-center"
          >
            {isLoadingInitiatives ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-primary rounded-full"></div>
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Fetch Initiatives/Epics
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Display fetched data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ProductBoard Initiatives */}
        <div className="border rounded-md p-4">
          <h4 className="text-md font-medium mb-2 text-blue-700">ProductBoard Initiatives</h4>
          {isLoadingInitiatives ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin h-6 w-6 border-2 border-b-transparent border-blue-600 rounded-full"></div>
            </div>
          ) : pbInitiatives.length === 0 ? (
            <div className="text-gray-500 text-sm p-2">
              No ProductBoard initiatives found. Click "Fetch Initiatives/Epics" to load data.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pbInitiatives.map((initiative) => (
                    <tr key={initiative.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <span className="font-mono">{initiative.id}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {initiative.title || initiative.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 p-1 h-auto"
                          onClick={() => {
                            // Find if this initiative is already mapped
                            const existingMapping = editedMapping?.initiative_epic_mappings.find(
                              m => m.pb_initiative_id === initiative.id
                            );
                            
                            if (!existingMapping && editedMapping) {
                              // Create a new mapping with just the PB side filled
                              const newMapping = {
                                pb_initiative_id: initiative.id,
                                pb_initiative_name: initiative.title || initiative.name || '',
                                ado_epic_id: 0,
                                ado_epic_name: '',
                                ado_business_unit: '', // Add business unit field
                                manually_mapped: true,
                                description: 'Manually created mapping'
                              };
                              
                              setEditedMapping({
                                ...editedMapping,
                                initiative_epic_mappings: [...editedMapping.initiative_epic_mappings, newMapping]
                              });
                            }
                          }}
                        >
                          Add to Mapping
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Azure DevOps Epics */}
        <div className="border rounded-md p-4">
          <h4 className="text-md font-medium mb-2 text-gray-700">Azure DevOps Epics</h4>
          {isLoadingInitiatives ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin h-6 w-6 border-2 border-b-transparent border-gray-600 rounded-full"></div>
            </div>
          ) : adoEpics.length === 0 ? (
            <div className="text-gray-500 text-sm p-2">
              No Azure DevOps epics found. Click "Fetch Initiatives/Epics" to load data.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adoEpics.map((epic) => (
                    <tr key={epic.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <span className="font-mono">{epic.id}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {epic.title || epic.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-600 p-1 h-auto"
                          onClick={() => {
                            // Find if this epic is already mapped
                            const existingMapping = editedMapping?.initiative_epic_mappings.find(
                              m => m.ado_epic_id === epic.id
                            );
                            
                            if (!existingMapping && editedMapping) {
                              // Create a new mapping with just the ADO side filled
                              const newMapping = {
                                pb_initiative_id: '',
                                pb_initiative_name: '',
                                ado_epic_id: epic.id,
                                ado_epic_name: epic.title || epic.name || '',
                                ado_business_unit: '', // Add business unit field
                                manually_mapped: true,
                                description: 'Manually created mapping'
                              };
                              
                              setEditedMapping({
                                ...editedMapping,
                                initiative_epic_mappings: [...editedMapping.initiative_epic_mappings, newMapping]
                              });
                            }
                          }}
                        >
                          Add to Mapping
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Suggested Mappings */}
      {suggestedInitiativeMappings.length > 0 && (
        <div className="mt-4 border rounded-md p-4 bg-yellow-50">
          <h4 className="text-md font-medium mb-2 text-yellow-800">Suggested Mappings</h4>
          <p className="text-sm text-gray-600 mb-2">
            These mappings were automatically suggested based on name similarity.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PB Initiative</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ADO Epic</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suggestedInitiativeMappings.map((mapping, index) => {
                  // Check if this suggestion is already in the edited mappings
                  const isAlreadyMapped = editedMapping?.initiative_epic_mappings.some(
                    m => m.pb_initiative_id === mapping.pb_initiative_id && 
                         m.ado_epic_id === mapping.ado_epic_id
                  );
                  
                  return (
                    <tr key={index} className={isAlreadyMapped ? "bg-green-50" : "hover:bg-yellow-50"}>
                      <td className="px-3 py-2 text-xs">
                        <div className="font-medium">{mapping.pb_initiative_name}</div>
                        <div className="text-gray-500 font-mono text-xs">{mapping.pb_initiative_id}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="font-medium">{mapping.ado_epic_name}</div>
                        <div className="text-gray-500 font-mono text-xs">{mapping.ado_epic_id}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {isAlreadyMapped ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Added
                          </span>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 p-1 h-auto"
                            onClick={() => {
                              if (editedMapping) {
                                setEditedMapping({
                                  ...editedMapping,
                                  initiative_epic_mappings: [...editedMapping.initiative_epic_mappings, {
                                    ...mapping,
                                    manually_mapped: false
                                  }]
                                });
                              }
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Confirm
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Current Mappings */}
      <div className="mt-4 border rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800">Current Mappings</h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddInitiativeEpicMapping}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Manual Mapping
          </Button>
        </div>
        
        {editedMapping?.initiative_epic_mappings.length === 0 ? (
          <div className="text-gray-500 text-sm p-2 bg-gray-50 rounded">
            No mappings created yet. Add mappings from the lists above or click "Add Manual Mapping".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB Initiative</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Epic</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Business Unit</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editedMapping?.initiative_epic_mappings.map((mapping, index) => (
                  <tr key={index} className={mapping.manually_mapped ? "bg-blue-50" : ""}>
                    <td className="px-3 py-2 text-xs">
                      {mapping.pb_initiative_id ? (
                        <>
                          <div className="font-medium">{mapping.pb_initiative_name}</div>
                          <div className="text-gray-500 font-mono text-xs">{mapping.pb_initiative_id}</div>
                        </>
                      ) : (
                        <select
                          className="w-full p-1 border border-gray-300 rounded-md text-xs"
                          value=""
                          onChange={(e) => {
                            const selectedInitiative = pbInitiatives.find(i => i.id === e.target.value);
                            if (selectedInitiative && editedMapping) {
                              const updatedMappings = [...editedMapping.initiative_epic_mappings];
                              updatedMappings[index] = {
                                ...updatedMappings[index],
                                pb_initiative_id: selectedInitiative.id,
                                pb_initiative_name: selectedInitiative.title || selectedInitiative.name || '',
                                manually_mapped: true
                              };
                              setEditedMapping({
                                ...editedMapping,
                                initiative_epic_mappings: updatedMappings
                              });
                            }
                          }}
                        >
                          <option value="">-- Select Initiative --</option>
                          {pbInitiatives.map(initiative => (
                            <option key={initiative.id} value={initiative.id}>
                              {initiative.title || initiative.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {mapping.ado_epic_id ? (
                        <>
                          <div className="font-medium">{mapping.ado_epic_name}</div>
                          <div className="text-gray-500 font-mono text-xs">{mapping.ado_epic_id}</div>
                        </>
                      ) : (
                        <select
                          className="w-full p-1 border border-gray-300 rounded-md text-xs"
                          value=""
                          onChange={(e) => {
                            const selectedEpic = adoEpics.find(epic => epic.id === parseInt(e.target.value));
                            if (selectedEpic && editedMapping) {
                              const updatedMappings = [...editedMapping.initiative_epic_mappings];
                              updatedMappings[index] = {
                                ...updatedMappings[index],
                                ado_epic_id: selectedEpic.id,
                                ado_epic_name: selectedEpic.title || selectedEpic.name || '',
                                manually_mapped: true
                              };
                              setEditedMapping({
                                ...editedMapping,
                                initiative_epic_mappings: updatedMappings
                              });
                            }
                          }}
                        >
                          <option value="">-- Select Epic --</option>
                          {adoEpics.map(epic => (
                            <option key={epic.id} value={epic.id}>
                              {epic.title || epic.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <select
                        className="w-full p-1 border border-gray-300 rounded-md text-xs"
                        value={mapping.ado_business_unit || ''}
                        onChange={(e) => {
                          if (editedMapping) {
                            const updatedMappings = [...editedMapping.initiative_epic_mappings];
                            updatedMappings[index] = {
                              ...updatedMappings[index],
                              ado_business_unit: e.target.value,
                              manually_mapped: true
                            };
                            setEditedMapping({
                              ...editedMapping,
                              initiative_epic_mappings: updatedMappings
                            });
                          }
                        }}
                      >
                        <option value="">-- Select Business Unit --</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Healthcare OS">Healthcare OS</option>
                        <option value="HIAA">HIAA</option>
                        <option value="Patient">Patient</option>
                        <option value="RCM">RCM</option>
                        <option value="Supply Chain">Supply Chain</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {mapping.manually_mapped ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Manual
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Auto
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveInitiativeEpicMapping(index)}
                        className="text-red-500 p-1 h-auto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitiativeEpicMappingTab;
