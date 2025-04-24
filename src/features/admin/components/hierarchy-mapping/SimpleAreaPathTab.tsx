import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Plus, Trash2 } from 'lucide-react';
import { TabComponentProps } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/shadcn/tabs';
import { AreaPathMapping } from '../../../../lib/api/hierarchyMapping';

/**
 * SimpleAreaPathTab component for managing area path mappings
 * with support for different hierarchy levels (Epic, Feature, Story)
 */
export const SimpleAreaPathTab: React.FC<TabComponentProps> = ({ 
  editedMapping,
  setEditedMapping,
  activeTab
}) => {
  // State for the selected mapping level
  const [mappingLevel, setMappingLevel] = useState<'epic' | 'feature' | 'story'>('epic');
  
  // Return null if no edited mapping
  if (!editedMapping) {
    return null;
  }
  
  // PB Initiatives for Epics
  const pbInitiatives = [
    { id: '1689', name: 'Compliance' },
    { id: '2045', name: 'Healthcare OS' },
    { id: '1646', name: 'HIAA' },
    { id: '1691', name: 'Patient' },
    { id: '1645', name: 'RCM' },
    { id: '1690', name: 'Supply Chain' }
  ];
  
  // Business Unit mappings for Epics
  const buMappings = [
    { id: '1689', name: 'Compliance', path: 'Healthcare\\BU\\Compliance' },
    { id: '2045', name: 'Healthcare OS', path: 'Healthcare\\BU\\Healthcare OS' },
    { id: '1646', name: 'HIAA', path: 'Healthcare\\BU\\HIAA' },
    { id: '1691', name: 'Patient', path: 'Healthcare\\BU\\Patient' },
    { id: '1645', name: 'RCM', path: 'Healthcare\\BU\\RCM' },
    { id: '1690', name: 'Supply Chain', path: 'Healthcare\\BU\\Supply Chain' }
  ];
  
  // PB Components for Features
  const pbComponents = [
    { id: '1648', name: 'Audit' },
    { id: '2032', name: 'CDTB' },
    { id: '1649', name: 'CM' },
    { id: '1685', name: 'HC Intel' },
    { id: '1686', name: 'Healthcare' },
    { id: '1683', name: 'MedEx' }
  ];
  
  // Product mappings for Features
  const productMappings = [
    { id: '1648', name: 'Audit', path: 'Healthcare\\Product\\Audit' },
    { id: '2032', name: 'CDTB', path: 'Healthcare\\Product\\CDTB' },
    { id: '1649', name: 'CM', path: 'Healthcare\\Product\\CM' },
    { id: '1685', name: 'HC Intel', path: 'Healthcare\\Product\\HC Intel' },
    { id: '1686', name: 'Healthcare', path: 'Healthcare\\Product\\Healthcare' },
    { id: '1683', name: 'MedEx', path: 'Healthcare\\Product\\MedEx' },
    { id: '1651', name: 'Medical', path: 'Healthcare\\Product\\Medical' },
    { id: '1680', name: 'MedId', path: 'Healthcare\\Product\\MedId' },
    { id: '1681', name: 'OneRecall', path: 'Healthcare\\Product\\OneRecall' },
    { id: '1647', name: 'Pharm Recon', path: 'Healthcare\\Product\\Pharm Recon' },
    { id: '1967', name: 'Rest of Cart', path: 'Healthcare\\Product\\Rest of Cart' },
    { id: '1650', name: 'RX AoD', path: 'Healthcare\\Product\\RX AoD' },
    { id: '1684', name: 'RxRecall', path: 'Healthcare\\Product\\RxRecall' },
    { id: '1679', name: 'RXR Hosp', path: 'Healthcare\\Product\\RXR Hosp' },
    { id: '1678', name: 'RXR Non Hosp', path: 'Healthcare\\Product\\RXR Non Hosp' },
    { id: '1682', name: 'RXT', path: 'Healthcare\\Product\\RXT' }
  ];
  
  // PB Users for Stories
  const pbUsers = [
    { id: '1', email: 'user1@example.com', name: 'User 1' },
    { id: '2', email: 'user2@example.com', name: 'User 2' },
    { id: '3', email: 'user3@example.com', name: 'User 3' }
  ];
  
  // PB Products for Stories
  const pbProducts = [
    { id: '1', name: 'Product 1' },
    { id: '2', name: 'Product 2' },
    { id: '3', name: 'Product 3' }
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
      return mapping.mapping_type === 'epic';
    } else if (mappingLevel === 'feature') {
      return mapping.mapping_type === 'feature';
    } else {
      return mapping.mapping_type === 'story';
    }
  });
  
  // Add a new mapping based on the selected level
  const handleAddMapping = () => {
    // Create a new mapping with appropriate defaults based on the selected level
    const newMapping: AreaPathMapping = {
      mapping_type: mappingLevel,
      area_path: '',
      description: `${mappingLevel.charAt(0).toUpperCase() + mappingLevel.slice(1)} level mapping`
    };
    
    // Add specific fields based on mapping type
    if (mappingLevel === 'epic') {
      newMapping.pb_initiative_id = '';
      newMapping.pb_initiative_name = '';
      newMapping.ado_business_unit = '';
    } else if (mappingLevel === 'feature') {
      newMapping.pb_component_id = '';
      newMapping.pb_component_name = '';
      newMapping.ado_product = '';
    } else {
      newMapping.pb_user_email = '';
      newMapping.pb_product_id = '';
      newMapping.pb_product_name = '';
      newMapping.pb_component_id = '';
      newMapping.pb_component_name = '';
      newMapping.ado_team = '';
    }
    
    // Add the new mapping to the edited mapping
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: [...editedMapping.area_path_mappings, newMapping]
    });
  };
  
  // Remove a mapping
  const handleRemoveMapping = (index: number) => {
    const newMappings = [...editedMapping.area_path_mappings];
    newMappings.splice(index, 1);
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  // Update a mapping field
  const handleUpdateMapping = (index: number, field: keyof AreaPathMapping, value: string) => {
    const newMappings = [...editedMapping.area_path_mappings];
    
    // Update the field
    newMappings[index] = {
      ...newMappings[index],
      [field]: value
    };
    
    // Update the area path based on the mapping type and field
    updateAreaPath(newMappings, index);
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  // Helper function to update area path based on mapping type
  const updateAreaPath = (mappings: AreaPathMapping[], index: number) => {
    const mapping = mappings[index];
    let areaPath = '';
    
    // Generate the area path based on the mapping type
    if (mapping.mapping_type === 'epic' && mapping.ado_business_unit) {
      areaPath = `Healthcare\\BU\\${mapping.ado_business_unit}`;
    } else if (mapping.mapping_type === 'feature' && mapping.ado_product) {
      areaPath = `Healthcare\\Product\\${mapping.ado_product}`;
    } else if (mapping.mapping_type === 'story' && mapping.ado_team) {
      areaPath = `Healthcare\\Teams\\${mapping.ado_team}`;
    }
    
    if (areaPath) {
      mappings[index].area_path = areaPath;
    }
  };
  
  // Update PB Initiative for Epic
  const handleUpdatePbInitiative = (index: number, initiativeId: string, initiativeName: string) => {
    const newMappings = [...editedMapping.area_path_mappings];
    
    newMappings[index] = {
      ...newMappings[index],
      pb_initiative_id: initiativeId,
      pb_initiative_name: initiativeName
    };
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  // Update ADO Business Unit for Epic
  const handleUpdateAdoBusinessUnit = (index: number, businessUnit: string) => {
    const newMappings = [...editedMapping.area_path_mappings];
    
    newMappings[index] = {
      ...newMappings[index],
      ado_business_unit: businessUnit
    };
    
    // Update area path
    updateAreaPath(newMappings, index);
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  // Update PB Component for Feature
  const handleUpdatePbComponent = (index: number, componentId: string, componentName: string) => {
    const newMappings = [...editedMapping.area_path_mappings];
    
    newMappings[index] = {
      ...newMappings[index],
      pb_component_id: componentId,
      pb_component_name: componentName
    };
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  // Update ADO Product for Feature
  const handleUpdateAdoProduct = (index: number, product: string) => {
    const newMappings = [...editedMapping.area_path_mappings];
    
    newMappings[index] = {
      ...newMappings[index],
      ado_product: product
    };
    
    // Update area path
    updateAreaPath(newMappings, index);
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  // Update PB User for Story
  const handleUpdatePbUser = (index: number, userEmail: string) => {
    const newMappings = [...editedMapping.area_path_mappings];
    
    newMappings[index] = {
      ...newMappings[index],
      pb_user_email: userEmail
    };
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  // Update PB Product for Story
  const handleUpdatePbProduct = (index: number, productId: string, productName: string) => {
    const newMappings = [...editedMapping.area_path_mappings];
    
    newMappings[index] = {
      ...newMappings[index],
      pb_product_id: productId,
      pb_product_name: productName
    };
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  // Update ADO Team for Story
  const handleUpdateAdoTeam = (index: number, team: string) => {
    const newMappings = [...editedMapping.area_path_mappings];
    
    newMappings[index] = {
      ...newMappings[index],
      ado_team: team
    };
    
    // Update area path
    updateAreaPath(newMappings, index);
    
    setEditedMapping({
      ...editedMapping,
      area_path_mappings: newMappings
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Area Path Mappings</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddMapping}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Area Path
          </Button>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <h4 className="text-md font-medium mb-2 text-blue-700">About Area Path Mappings</h4>
        <p className="text-sm text-gray-600">
          Area path mappings define how ProductBoard items map to Azure DevOps area paths based on their hierarchy level:
        </p>
        <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
          <li><strong>Epics</strong> → Business Unit Level: Healthcare\BU\{"{Business Unit Name}"}</li>
          <li><strong>Features</strong> → Product Level: Healthcare\Product\{"{Component Name}"}</li>
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB Side</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Side</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-3 py-2 text-xs">Initiative</td>
                      <td className="px-3 py-2 text-xs">Business Unit</td>
                    </tr>
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB Side</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Side</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-3 py-2 text-xs">Component</td>
                      <td className="px-3 py-2 text-xs">Product</td>
                    </tr>
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB Side</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Side</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-3 py-2 text-xs">Product + Component + PO/Team</td>
                      <td className="px-3 py-2 text-xs">Team</td>
                    </tr>
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
            onClick={handleAddMapping}
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
                    <>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB Initiative</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Business Unit</th>
                    </>
                  )}
                  {mappingLevel === 'feature' && (
                    <>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB Component</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Product</th>
                    </>
                  )}
                  {mappingLevel === 'story' && (
                    <>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB Team</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Team</th>
                    </>
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
                        <>
                          <td className="px-3 py-2 text-xs">
                            <div className="flex items-center">
                              <select
                                className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                value={mapping.pb_initiative_id || ''}
                                onChange={(e) => {
                                  const initiative = pbInitiatives.find(i => i.id === e.target.value);
                                  if (initiative) {
                                    handleUpdatePbInitiative(originalIndex, initiative.id, initiative.name);
                                  }
                                }}
                              >
                                <option value="">Select Initiative</option>
                                {pbInitiatives.map(initiative => (
                                  <option key={initiative.id} value={initiative.id}>{initiative.name}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <div className="flex items-center">
                              <select
                                className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                value={mapping.ado_business_unit || ''}
                                onChange={(e) => handleUpdateAdoBusinessUnit(originalIndex, e.target.value)}
                              >
                                <option value="">Select Business Unit</option>
                                {buMappings.map(bu => (
                                  <option key={bu.id} value={bu.name}>{bu.name}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </>
                      )}
                      {mappingLevel === 'feature' && (
                        <>
                          <td className="px-3 py-2 text-xs">
                            <div className="flex items-center">
                              <select
                                className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                value={mapping.pb_component_id || ''}
                                onChange={(e) => {
                                  const component = pbComponents.find(c => c.id === e.target.value);
                                  if (component) {
                                    handleUpdatePbComponent(originalIndex, component.id, component.name);
                                  }
                                }}
                              >
                                <option value="">Select Component</option>
                                {pbComponents.map(component => (
                                  <option key={component.id} value={component.id}>{component.name}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <div className="flex items-center">
                              <select
                                className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                value={mapping.ado_product || ''}
                                onChange={(e) => handleUpdateAdoProduct(originalIndex, e.target.value)}
                              >
                                <option value="">Select Product</option>
                                {productMappings.map(product => (
                                  <option key={product.id} value={product.name}>{product.name}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </>
                      )}
                      {mappingLevel === 'story' && (
                        <>
                          <td className="px-3 py-2 text-xs">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <span className="text-xs font-medium text-gray-500 w-16">User:</span>
                                <select
                                  className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                  value={mapping.pb_user_email || ''}
                                  onChange={(e) => handleUpdatePbUser(originalIndex, e.target.value)}
                                >
                                  <option value="">Select User</option>
                                  {pbUsers.map(user => (
                                    <option key={user.id} value={user.email}>{user.email}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs font-medium text-gray-500 w-16">Product:</span>
                                <select
                                  className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                  value={mapping.pb_product_id || ''}
                                  onChange={(e) => {
                                    const product = pbProducts.find(p => p.id === e.target.value);
                                    if (product) {
                                      handleUpdatePbProduct(originalIndex, product.id, product.name);
                                    }
                                  }}
                                >
                                  <option value="">Select Product</option>
                                  {pbProducts.map(product => (
                                    <option key={product.id} value={product.id}>{product.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs font-medium text-gray-500 w-16">Component:</span>
                                <select
                                  className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                  value={mapping.pb_component_id || ''}
                                  onChange={(e) => {
                                    const component = pbComponents.find(c => c.id === e.target.value);
                                    if (component) {
                                      handleUpdatePbComponent(originalIndex, component.id, component.name);
                                    }
                                  }}
                                >
                                  <option value="">Select Component</option>
                                  {pbComponents.map(component => (
                                    <option key={component.id} value={component.id}>{component.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <div className="flex items-center">
                              <select
                                className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                value={mapping.ado_team || ''}
                                onChange={(e) => handleUpdateAdoTeam(originalIndex, e.target.value)}
                              >
                                <option value="">Select ADO Team</option>
                                {teamMappings.map(team => (
                                  <option key={team.id} value={team.name}>{team.name}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center">
                          <input
                            type="text"
                            className="w-full p-1 border border-gray-300 rounded-md text-xs bg-gray-50 text-gray-500"
                            value={mapping.area_path}
                            readOnly
                            placeholder="Auto-generated area path"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <input
                          type="text"
                          className="w-full p-1 border border-gray-300 rounded-md text-xs"
                          value={mapping.description || ''}
                          onChange={(e) => handleUpdateMapping(originalIndex, 'description', e.target.value)}
                          placeholder="Optional description"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveMapping(originalIndex)}
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
export default SimpleAreaPathTab;
