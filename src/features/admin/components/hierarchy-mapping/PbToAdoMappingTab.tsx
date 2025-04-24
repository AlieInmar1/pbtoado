import React from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Plus, Trash2 } from 'lucide-react';
import { PbToAdoMappingTabProps } from './types';

/**
 * PbToAdoMappingTab component for managing ProductBoard to ADO type mappings
 */
export const PbToAdoMappingTab: React.FC<PbToAdoMappingTabProps> = ({ 
  editedMapping,
  setEditedMapping,
  activeTab,
  handleAddPbToAdoMapping,
  handleRemovePbToAdoMapping,
  handleUpdatePbToAdoMapping
}) => {
  if (!editedMapping || activeTab !== 'pb-to-ado') return null;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">ProductBoard to ADO Mappings</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddPbToAdoMapping}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Mapping
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ProductBoard Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azure DevOps Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editedMapping.pb_to_ado_mappings.map((mapping, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="p-2 border border-gray-300 rounded-md"
                    value={mapping.pb_level}
                    onChange={(e) => handleUpdatePbToAdoMapping(index, 'pb_level', e.target.value)}
                  >
                    <option value="initiative">Initiative</option>
                    <option value="feature">Feature</option>
                    <option value="subfeature">Sub-feature (Story)</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="p-2 border border-gray-300 rounded-md"
                    value={mapping.ado_type}
                    onChange={(e) => handleUpdatePbToAdoMapping(index, 'ado_type', e.target.value)}
                  >
                    <option value="Epic">Epic</option>
                    <option value="Feature">Feature</option>
                    <option value="User Story">User Story</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={mapping.description || ''}
                    onChange={(e) => handleUpdatePbToAdoMapping(index, 'description', e.target.value)}
                    placeholder="Description"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemovePbToAdoMapping(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PbToAdoMappingTab;
