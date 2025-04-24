import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Plus, Trash2, Info } from 'lucide-react';
import { AreaPathMappingTabProps } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/shadcn/tabs';

/**
 * EnhancedAreaPathMappingTab component for managing area path mappings
 * with support for different hierarchy levels (Epic, Feature, Story)
 */
export const EnhancedAreaPathMappingTab: React.FC<AreaPathMappingTabProps> = ({ 
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
    console.log('EnhancedAreaPathMappingTab rendered', { activeTab, mappingLevel });
    setDebugInfo(`Component rendered. Active tab: ${activeTab}, Mapping level: ${mappingLevel}`);
  }, [activeTab, mappingLevel]);
  
  // Return null if not on the area-paths tab or no edited mapping
  if (!editedMapping || activeTab !== 'area-paths') {
    console.log('EnhancedAreaPathMappingTab not active', { activeTab, editedMapping: !!editedMapping });
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
      return `Healthcare\\Teams\\${mapping.
