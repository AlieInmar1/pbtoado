import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Plus, Trash2, Info } from 'lucide-react';
import { AreaPathMappingTabProps } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/shadcn/tabs';

/**
 * AreaPathMappingTab component for managing area path mappings
 */
export const AreaPathMappingTab: React.FC<AreaPathMappingTabProps> = ({ 
  editedMapping,
  setEditedMapping,
  activeTab,
  handleAddAreaPathMapping,
  handleRemoveAreaPathMapping,
  handleUpdateAreaPathMapping
}) => {
  // State for the selected mapping level
  const [mappingLevel, setMappingLevel] = useState<'epic' | 'feature' | 'story'>('epic');
  
  // Debug state to track component rendering
  const [debugInfo, setDebugInfo] = useState<string>('Component initialized');
  
  // Log when the component renders
  useEffect(() => {
    console.log('AreaPathMappingTab rendered', { activeTab, mappingLevel });
    setDebugInfo(`Component rendered. Active tab: ${activeTab}, Mapping level: ${mappingLevel}`);
  }, [activeTab, mappingLevel]);
  
  // Return null if not on the area-paths tab or no edited mapping
  if (!editedMapping || activeTab !== 'area-paths') {
    console.log('AreaPathMappingTab not active', { activeTab, editedMapping: !!editedMapping });
    return null;
  }
  
  // Business Unit mappings for Epics
  const buMappings = [
    { id: '1689', name: 'Compliance', path: 'Healthcare\\BU\\Compliance' },
    { id: '2045', name: 'Healthcare OS', path: 'Healthcare\\BU\\Healthcare OS' },
    { id: '1646', name: 'HIAA', path: 'Healthcare\\BU\\HIAA' },
    { id: '1691', name: 'Patient', path: 'Healthcare\\BU\\Patient' },
    { id: '1645', name: 'RCM', path: 'Healthcare\\BU\\RCM' },
    { id: '1690', name: 'Supply Chain', path: 'Healthcare\\BU\\Supply Chain' }
  ];
  
  // Product mappings for Features
  const productMappings = [
    { id: '1648', name: 'Audit', path: 'Healthcare\\Product\\Audit (1210025)' },
    { id: '2032', name: 'CDTB', path: 'Healthcare\\Product\\CDTB (1425000)' },
    { id: '1649', name: 'CM', path: 'Healthcare\\Product\\CM (1211005)' },
    { id: '1685', name: 'HC Intel', path: 'Healthcare\\Product\\HC Intel (2230000)' },
    { id: '1686', name: 'Healthcare', path: 'Healthcare\\Product\\Healthcare (4200030)' },
    { id: '1683', name: 'MedEx', path: 'Healthcare\\Product\\MedEx (1423000)' },
    { id: '1651', name: 'Medical', path: 'Healthcare\\Product\\Medical (1212000)' },
    { id: '1680', name: 'MedId', path: 'Healthcare\\Product\\MedId (1424000)' },
    { id: '1681', name: 'OneRecall', path: 'Healthcare\\Product\\OneRecall (1422000)' },
    { id: '1647', name: 'Pharm Recon', path: 'Healthcare\\Product\\Pharm Recon (1210000)' },
    { id: '1967', name: 'Rest of Cart', path: 'Healthcare\\Product\\Rest of Cart (1423025)' },
    { id: '1650', name: 'RX AoD', path: 'Healthcare\\Product\\RX AoD (1211010)' },
    { id: '1684', name: 'RxRecall', path: 'Healthcare\\Product\\RxRecall (1413000)' },
    { id: '1679', name: 'RXR Hosp', path: 'Healthcare\\Product\\RXR Hosp (1412000)' },
    { id: '1678', name: 'RXR Non Hosp', path: 'Healthcare\\Product\\RXR Non Hosp (1411000)' },
    { id: '1682', name: 'RXT', path: 'Healthcare\\Product\\RXT (1422505)' }
  ];
  
  // Team mappings for Stories
  const teamMappings = [
    { id: '1716', name: 'Avengers', path: 'Healthcare\\Teams\\Avengers' },
    { id: '1655', name: 'BEAST', path: 'Healthcare\\Teams\\BEAST' },
    { id: '2031', name: 'CDTB', path: 'Healthcare\\Teams\\CDTB' },
    { id: '2040', name: 'Code', path: 'Healthcare\\Teams\\Code' },
    { id: '1720', name: 'Droids', path: 'Healthcare\\Teams\\Droids' },
    { id: '1714', name: 'Enterprise', path: 'Healthcare\\Teams\\Enterprise' },
    { id: '1654', name: 'Footprints', path: 'Healthcare\\Teams\\Footprints' },
    { id: '1653', name: 'Illuminators', path: 'Healthcare\\Teams\\Illuminators' },
    { id: '1652', name: 'Impact', path: 'Healthcare\\Teams\\Impact' },
    { id: '2042', name: 'Jasoninjas', path: 'Healthcare\\Teams\\Jasoninjas' },
    { id: '1718', name: 'Mad Dogs', path: 'Healthcare\\Teams\\Mad Dogs' },
    { id: '1717', name: 'Maple Leafs', path: 'Healthcare\\Teams\\Maple Leafs' },
    { id: '2039', name: 'Meerkats', path: 'Healthcare\\Teams\\Meerkats' },
    { id: '1721', name: 'Narwhals', path: 'Healthcare\\Teams\\Narwhals' },
    { id: '1722', name: 'Neutrinos', path: 'Healthcare\\Teams\\Neutrinos' },
    { id: '2044', name: 'Nova', path: 'Healthcare\\Teams\\Nova' },
    { id: '1715', name: 'Q Continuum', path: 'Healthcare\\Teams\\Q Continuum' },
    { id: '1719', name: 'RxTech OPS', path: 'Healthcare\\Teams\\RxTech OPS' },
    { id: '1675', name: 'Skunkworks', path: 'Healthcare\\Teams\\Skunkworks' },
    { id: '2038', name: 'Storm', path: 'Healthcare\\Teams\\Storm' }
  ];
  
  // Filter mappings based on the selected level
  const filteredMappings = editedMapping.area_path_mappings.filter(mapping => {
    if (mappingLevel === 'epic') {
      return mapping.business_unit && !mapping.product_code && !mapping.team;
    } else if (mappingLevel === 'feature') {
      return mapping.product_code && !mapping.team;
    } else {
      return mapping.team;
    }
  });
  
  // Add a new mapping based on the selected level
  const addMappingForLevel = () => {
    // Create a new mapping with appropriate defaults based on the selected level
    const newMapping = {
      mapping_type: mappingLevel,
      business_unit: mappingLevel === 'epic' ? '' : '',
      product_code: mappingLevel === 'feature' ? '' : '',
      team: mappingLevel === 'story' ? '' : '',
      area_path: '',
      description: `${mappingLevel.charAt(0).toUpperCase() + mappingLevel.slice(1)} level mapping`
    };
    
    // Add the new mapping to the edited mapping
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: [...editedMapping.area_path_mappings, newMapping]
    });
  };
  
  // Helper function to get the appropriate area path template based on the level
  const getAreaPathTemplate = (level: 'epic' | 'feature' | 'story', mapping: any): string => {
    if (level === 'epic' && mapping.business_unit) {
      return `Healthcare\\BU\\${mapping.business_unit}`;
    } else if (level === 'feature' && mapping.product_code) {
      return `Healthcare\\Product\\${mapping.product_code}`;
    } else if (level === 'story' && mapping.team) {
      return `Healthcare\\Teams\\${mapping.team}`;
    }
    return '';
  };
  
  // Update area path when business unit, product code, or team changes
  const handleFieldChange = (index: number, field: 'business_unit' | 'product_code' | 'team', value: string) => {
    handleUpdateAreaPathMapping(index, field, value);
    
    // Update area path based on the mapping level
    const mapping = {...editedMapping.area_path_mappings[index], [field]: value};
    const areaPath = getAreaPathTemplate(mappingLevel, mapping);
    
    if (areaPath) {
      handleUpdateAreaPathMapping(index, 'area_path', areaPath);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Area Path Mappings</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addMappingForLevel}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Area Path
          </Button>
        </div>
      </div>
      
      {/* Debug Info */}
      <div className="bg-yellow-50 p-2 rounded-md border border-yellow-100 text-xs">
        <p>Debug: {debugInfo}</p>
      </div>
      
      {/* Explanation */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <h4 className="text-md font-medium mb-2 text-blue-700">About Area Path Mappings</h4>
        <p className="text-sm text-gray-600">
          Area path mappings define how ProductBoard items map to Azure DevOps area paths based on their hierarchy level:
        </p>
        <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
          <li><strong>Epics</strong> → Business Unit Level: Healthcare\BU\{"{Business Unit Name}"}</li>
          <li><strong>Features</strong> → Product Level: Healthcare\Product\{"{Component Name (Product ID)}"}</li>
          <li><strong>Stories</strong> → Team Level: Healthcare\Teams\{"{Team Name}"}</li>
        </ul>
      </div>
      
      {/* Mapping Level Tabs */}
      <div className="border rounded-md p-4">
        <h4 className="text-md font-medium mb-4">Select Mapping Level</h4>
        <Tabs defaultValue="epic" value={mappingLevel} onValueChange={(value) => setMappingLevel(value as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="epic">Epics (BU Level)</TabsTrigger>
            <TabsTrigger value="feature">Features (Product Level)</TabsTrigger>
            <TabsTrigger value="story">Stories (Team Level)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="epic">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h4 className="text-md font-medium mb-2">Business Unit Mappings</h4>
              <p className="text-sm text-gray-600 mb-4">
                These mappings define how Epics (Initiatives) are mapped to Business Units in Azure DevOps.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Unit</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Area Path</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {buMappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td className="px-3 py-2 text-xs">{mapping.id}</td>
                        <td className="px-3 py-2 text-xs">{mapping.name}</td>
                        <td className="px-3 py-2 text-xs">{mapping.path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="feature">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h4 className="text-md font-medium mb-2">Product Mappings</h4>
              <p className="text-sm text-gray-600 mb-4">
                These mappings define how Features are mapped to Products in Azure DevOps.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Area Path</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productMappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td className="px-3 py-2 text-xs">{mapping.id}</td>
                        <td className="px-3 py-2 text-xs">{mapping.name}</td>
                        <td className="px-3 py-2 text-xs">{mapping.path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="story">
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h4 className="text-md font-medium mb-2">Team Mappings</h4>
              <p className="text-sm text-gray-600 mb-4">
                These mappings define how Stories are mapped to Teams in Azure DevOps.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Area Path</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamMappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td className="px-3 py-2 text-xs">{mapping.id}</td>
                        <td className="px-3 py-2 text-xs">{mapping.name}</td>
                        <td className="px-3 py-2 text-xs">{mapping.path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Current Mappings for the selected level */}
      <div className="mt-4 border rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800">
            {mappingLevel === 'epic' ? 'Epic (Business Unit) Mappings' : 
             mappingLevel === 'feature' ? 'Feature (Product) Mappings' : 
             'Story (Team) Mappings'}
          </h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addMappingForLevel}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add {mappingLevel.charAt(0).toUpperCase() + mappingLevel.slice(1)} Mapping
          </Button>
        </div>
        
        {filteredMappings?.length === 0 ? (
          <div className="text-gray-500 text-sm p-2 bg-gray-50 rounded">
            No {mappingLevel} mappings created yet. Click "Add {mappingLevel.charAt(0).toUpperCase() + mappingLevel.slice(1)} Mapping" to create a new mapping.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {mappingLevel === 'epic' && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Unit</th>
                  )}
                  {mappingLevel === 'feature' && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                  )}
                  {mappingLevel === 'story' && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area Path</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMappings?.map((mapping, index) => {
                  // Find the original index in the full array
                  const originalIndex = editedMapping.area_path_mappings.findIndex(m => m === mapping);
                  
                  return (
                    <tr key={originalIndex}>
                      {mappingLevel === 'epic' && (
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-center">
                            <select
                              className="w-full p-1 border border-gray-300 rounded-md text-xs"
                              value={mapping.business_unit}
                              onChange={(e) => handleFieldChange(originalIndex, 'business_unit', e.target.value)}
                            >
                              <option value="">Select Business Unit</option>
                              {buMappings.map(bu => (
                                <option key={bu.id} value={bu.name}>{bu.name}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      )}
                      {mappingLevel === 'feature' && (
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-center">
                            <select
                              className="w-full p-1 border border-gray-300 rounded-md text-xs"
                              value={mapping.product_code}
                              onChange={(e) => handleFieldChange(originalIndex, 'product_code', e.target.value)}
                            >
                              <option value="">Select Product</option>
                              {productMappings.map(product => (
                                <option key={product.id} value={product.name}>{product.name}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      )}
                      {mappingLevel === 'story' && (
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-center">
                            <select
                              className="w-full p-1 border border-gray-300 rounded-md text-xs"
                              value={mapping.team}
                              onChange={(e) => handleFieldChange(originalIndex, 'team', e.target.value)}
                            >
                              <option value="">Select Team</option>
                              {teamMappings.map(team => (
                                <option key={team.id} value={team.name}>{team.name}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center">
                          <input
                            type="text"
                            className="w-full p-1 border border-gray-300 rounded-md text-xs"
                            value={mapping.area_path}
                            onChange={(e) => handleUpdateAreaPathMapping(originalIndex, 'area_path', e.target.value)}
                            placeholder="Area Path"
                            readOnly
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <input
                          type="text"
                          className="w-full p-1 border border-gray-300 rounded-md text-xs"
                          value={mapping.description || ''}
                          onChange={(e) => handleUpdateAreaPathMapping(originalIndex, 'description', e.target.value)}
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveAreaPathMapping(originalIndex)}
                          className="text-red-500 p-1 h-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Export both as default and named export to maintain compatibility
export default AreaPathMappingTab;
