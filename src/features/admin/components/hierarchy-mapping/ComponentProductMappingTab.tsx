import React from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Plus, Trash2 } from 'lucide-react';
import { ComponentProductMappingTabProps } from './types';

/**
 * ComponentProductMappingTab component for managing component product mappings
 */
export const ComponentProductMappingTab: React.FC<ComponentProductMappingTabProps> = ({ 
  editedMapping,
  setEditedMapping,
  activeTab,
  handleAddComponentProductMapping,
  handleRemoveComponentProductMapping,
  handleUpdateComponentProductMapping
}) => {
  if (!editedMapping || activeTab !== 'component-product') return null;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Component/Product Mapping</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddComponentProductMapping}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Mapping
          </Button>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <h4 className="text-md font-medium mb-2 text-blue-700">About Component/Product Mappings</h4>
        <p className="text-sm text-gray-600">
          Component/Product mappings define how ProductBoard components should be mapped to Azure DevOps products.
          Each mapping connects a ProductBoard component to an ADO product, which helps determine the correct area path
          for features and stories.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          You can now select components from ProductBoard and products from ADO independently, allowing for more flexible mappings.
        </p>
      </div>
      
      {/* Current Mappings */}
      <div className="mt-4 border rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800">Current Component/Product Mappings</h4>
        </div>
        
        {editedMapping?.component_product_mappings.length === 0 ? (
          <div className="text-gray-500 text-sm p-2 bg-gray-50 rounded">
            No component/product mappings created yet. Click "Add Mapping" to create a new mapping.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ProductBoard Component</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Product</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Unit</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editedMapping?.component_product_mappings.map((mapping, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500 w-24">ID:</span>
                          <input
                            type="text"
                            className="w-full p-1 border border-gray-300 rounded-md text-xs"
                            value={mapping.component_id}
                            onChange={(e) => handleUpdateComponentProductMapping(index, 'component_id', e.target.value)}
                            placeholder="Component ID"
                          />
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500 w-24">Name:</span>
                          <input
                            type="text"
                            className="w-full p-1 border border-gray-300 rounded-md text-xs"
                            value={mapping.component_name}
                            onChange={(e) => handleUpdateComponentProductMapping(index, 'component_name', e.target.value)}
                            placeholder="Component Name"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500 w-24">PB Product:</span>
                          <div className="w-full">
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-gray-500 w-12">ID:</span>
                              <input
                                type="text"
                                className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                value={mapping.product_id}
                                onChange={(e) => handleUpdateComponentProductMapping(index, 'product_id', e.target.value)}
                                placeholder="Product ID"
                              />
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-xs font-medium text-gray-500 w-12">Name:</span>
                              <input
                                type="text"
                                className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                value={mapping.product_name}
                                onChange={(e) => handleUpdateComponentProductMapping(index, 'product_name', e.target.value)}
                                placeholder="Product Name"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center mt-2">
                          <span className="font-medium text-gray-500 w-24">ADO Product:</span>
                          <select
                            className="w-full p-1 border border-gray-300 rounded-md text-xs"
                            value={mapping.ado_product || ''}
                            onChange={(e) => handleUpdateComponentProductMapping(index, 'ado_product', e.target.value)}
                          >
                            <option value="">-- Select ADO Product --</option>
                            <option value="Audit">Audit</option>
                            <option value="CDTB">CDTB</option>
                            <option value="CM">CM</option>
                            <option value="HC Intel">HC Intel</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="MedEx">MedEx</option>
                            <option value="Medical">Medical</option>
                            <option value="MedId">MedId</option>
                            <option value="OneRecall">OneRecall</option>
                            <option value="Pharm Recon">Pharm Recon</option>
                            <option value="Rest of Cart">Rest of Cart</option>
                            <option value="RX AoD">RX AoD</option>
                            <option value="RxRecall">RxRecall</option>
                            <option value="RXR Hosp">RXR Hosp</option>
                            <option value="RXR Non Hosp">RXR Non Hosp</option>
                            <option value="RXT">RXT</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <input
                        type="text"
                        className="w-full p-1 border border-gray-300 rounded-md text-xs"
                        value={mapping.business_unit || ''}
                        onChange={(e) => handleUpdateComponentProductMapping(index, 'business_unit', e.target.value)}
                        placeholder="Business Unit"
                      />
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <input
                        type="text"
                        className="w-full p-1 border border-gray-300 rounded-md text-xs"
                        value={mapping.description || ''}
                        onChange={(e) => handleUpdateComponentProductMapping(index, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveComponentProductMapping(index)}
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

export default ComponentProductMappingTab;
