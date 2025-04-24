/**
 * Hierarchy Mapping Utilities for ProductBoard to Azure DevOps Integration
 * 
 * These functions help determine the appropriate area path and work item type
 * for ProductBoard items when creating or updating ADO work items.
 */

// Types for the mapping configuration
export interface HierarchyMappingConfig {
  id?: string;
  name: string;
  description?: string;
  pb_to_ado_mappings: PbToAdoMapping[];
  area_path_mappings: AreaPathMapping[];
  initiative_epic_mappings: InitiativeEpicMapping[];
  user_team_mappings: UserTeamMapping[];
  component_product_mappings: ComponentProductMapping[];
  workspace_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PbToAdoMapping {
  pb_level: 'initiative' | 'feature' | 'subfeature';
  ado_type: 'Epic' | 'Feature' | 'User Story';
  description?: string;
}

export interface AreaPathMapping {
  mapping_type: 'epic' | 'feature' | 'story';
  
  // ProductBoard side
  pb_initiative_id?: string;
  pb_initiative_name?: string;
  pb_component_id?: string;
  pb_component_name?: string;
  pb_user_email?: string;
  pb_product_id?: string;
  pb_product_name?: string;
  
  // Azure DevOps side
  ado_business_unit?: string;
  ado_product?: string;
  ado_team?: string;
  
  // Legacy fields (for backward compatibility)
  business_unit?: string;
  product_code?: string;
  team?: string;
  
  area_path: string;
  description?: string;
}

export interface InitiativeEpicMapping {
  pb_initiative_id: string;
  pb_initiative_name: string;
  ado_epic_id: number;
  ado_epic_name: string;
  ado_business_unit?: string;
  manually_mapped: boolean;
  description?: string;
}

export interface UserTeamMapping {
  user_email: string;
  team: string;
  business_unit?: string;
  product_code?: string;
  pb_product_id?: string;
  pb_product_name?: string;
  pb_component_id?: string;
  pb_component_name?: string;
  description?: string;
}

export interface ComponentProductMapping {
  component_id: string;
  component_name: string;
  product_id: string;
  product_name: string;
  business_unit?: string;
  ado_product?: string;
  description?: string;
}

// Default mapping configuration for when DB fetch fails
export const DEFAULT_HIERARCHY_MAPPING: HierarchyMappingConfig = {
  name: 'Default Mapping',
  description: 'Default mapping configuration for ProductBoard to Azure DevOps',
  pb_to_ado_mappings: [
    {
      pb_level: 'initiative',
      ado_type: 'Epic',
      description: 'Map ProductBoard Initiatives to Azure DevOps Epics'
    },
    {
      pb_level: 'feature',
      ado_type: 'Feature',
      description: 'Map ProductBoard Features to Azure DevOps Features'
    },
    {
      pb_level: 'subfeature',
      ado_type: 'User Story',
      description: 'Map ProductBoard Sub-features (Stories) to Azure DevOps User Stories'
    }
  ],
  area_path_mappings: [
    {
      mapping_type: 'epic',
      pb_initiative_name: 'Healthcare',
      ado_business_unit: 'Healthcare',
      area_path: 'Healthcare\\BU\\Healthcare',
      description: 'Map Healthcare initiatives to Healthcare business unit'
    }
  ],
  initiative_epic_mappings: [],
  user_team_mappings: [],
  component_product_mappings: []
};

/**
 * Fetch all hierarchy mapping configurations from Supabase
 * @param supabase The Supabase client instance
 * @returns Promise<HierarchyMappingConfig[]> Array of mapping configurations
 */
export async function fetchHierarchyMappings(supabase: any): Promise<HierarchyMappingConfig[]> {
  try {
    const { data, error } = await supabase
      .from('hierarchy_mappings')
      .select('*');
      
    if (error) {
      console.error('Error fetching hierarchy mappings:', error);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception in fetchHierarchyMappings:', err);
    // Return default mapping if there's an error
    return [DEFAULT_HIERARCHY_MAPPING];
  }
}

/**
 * Determine Product Board level based on item type and relationships
 * @param pbItemData The ProductBoard item data
 * @returns 'initiative' | 'feature' | 'subfeature'
 */
export function determinePbLevel(pbItemData: any): 'initiative' | 'feature' | 'subfeature' {
  const type = pbItemData?.data?.type;
  const parentId = pbItemData?.data?.parent_id;
  
  if (type === 'initiative') {
    return 'initiative';
  } else if (type === 'feature' && !parentId) {
    return 'feature';
  } else {
    // If it has a parent, it's likely a subfeature/story
    return 'subfeature';
  }
}

/**
 * Get the appropriate area path for a ProductBoard item based on the mapping configuration
 * @param pbItemData The ProductBoard item data
 * @param mappings The mapping configurations to use
 * @returns The area path for the item
 */
export function getAreaPathFromPbItem(pbItemData: any, mappings: HierarchyMappingConfig[]): string {
  if (!mappings || mappings.length === 0) {
    return 'Default';
  }

  // Use the first mapping configuration for now
  const mapping = mappings[0];
  
  // Extract relevant PB item data
  const componentId = pbItemData?.data?.component_id;
  const componentName = pbItemData?.data?.component?.name;
  const parentId = pbItemData?.data?.parent_id; // Initiative ID for features
  const parentName = pbItemData?.data?.parent?.name;
  const productId = pbItemData?.data?.product_id;
  const productName = pbItemData?.data?.product?.name;
  const ownerEmail = pbItemData?.data?.owner?.email;
  
  // Determine mapping type based on PB item level
  const pbLevel = determinePbLevel(pbItemData);
  const mappingType = pbLevel === 'initiative' ? 'epic' : 
                      pbLevel === 'feature' ? 'feature' : 'story';
  
  // Try to find exact match using PB identifiers first
  let areaPathMapping = mapping.area_path_mappings.find(m => {
    if (m.mapping_type !== mappingType) return false;
    
    if (mappingType === 'epic') {
      return m.pb_initiative_id === parentId || m.pb_initiative_name === parentName;
    } else if (mappingType === 'feature') {
      return m.pb_product_id === productId || m.pb_product_name === productName;
    } else { // story
      return (m.pb_component_id === componentId || m.pb_component_name === componentName) || 
             m.pb_user_email === ownerEmail;
    }
  });
  
  if (areaPathMapping) {
    console.log(`Found exact area path mapping for ${mappingType}: ${areaPathMapping.area_path}`);
    return areaPathMapping.area_path;
  }
  
  // If no match found using PB identifiers, try with ADO fields (legacy approach)
  // This is just a fallback and may not be accurate without proper extraction
  
  // Try all area path mappings as fallback
  areaPathMapping = mapping.area_path_mappings.find(m => m.mapping_type === mappingType);
  
  if (areaPathMapping) {
    console.log(`Found mapping type match for ${mappingType}: ${areaPathMapping.area_path}`);
    return areaPathMapping.area_path;
  }
  
  // Ultimate fallback - first area path or default
  return mapping.area_path_mappings[0]?.area_path || 'Default';
}

/**
 * Get the appropriate ADO work item type for a ProductBoard item based on the mapping configuration
 * @param pbItemData The ProductBoard item data
 * @param mappings The mapping configurations to use
 * @returns The ADO work item type for the item
 */
export function getAdoTypeFromPbItem(pbItemData: any, mappings: HierarchyMappingConfig[]): string {
  if (!mappings || mappings.length === 0) {
    // Default mapping for safety
    const pbLevel = determinePbLevel(pbItemData);
    return pbLevel === 'initiative' ? 'Epic' : 
           pbLevel === 'feature' ? 'Feature' : 'User Story';
  }

  // Use the first mapping configuration for now
  const mapping = mappings[0];
  
  // Determine PB level
  const pbLevel = determinePbLevel(pbItemData);
  
  // Find the matching PB to ADO mapping
  const pbToAdoMapping = mapping.pb_to_ado_mappings.find(m => m.pb_level === pbLevel);
  
  if (!pbToAdoMapping) {
    // Default mappings if not found
    return pbLevel === 'initiative' ? 'Epic' : 
           pbLevel === 'feature' ? 'Feature' : 'User Story';
  }
  
  return pbToAdoMapping.ado_type;
}

/**
 * Extract business context from ProductBoard item data
 * This provides information that can be used for area path determination
 */
export function extractBusinessContext(pbItemData: any): {
  businessUnit: string;
  productCode: string;
  team: string;
} {
  // Extract component, product, initiative info
  const componentName = pbItemData?.data?.component?.name || '';
  const productName = pbItemData?.data?.product?.name || '';
  const parentName = pbItemData?.data?.parent?.name || '';
  
  // This is a simplified approach - in a real implementation, 
  // we'd likely have more sophisticated mapping logic
  
  // Extract business unit (often from initiative or component)
  let businessUnit = parentName.split(' ')[0]; // Very simple extraction
  if (!businessUnit) {
    businessUnit = componentName.split('-')[0]; // Alternative extraction
  }
  
  // Extract product code (often from product name)
  const productCode = productName.replace(/\s+/g, ''); // Simple extraction - remove spaces
  
  // Extract team (could be from component or custom fields)
  const team = componentName.split('-')[1] || 'Default'; // Simple extraction
  
  return {
    businessUnit: businessUnit || 'Unknown',
    productCode: productCode || 'Unknown',
    team: team || 'Unknown'
  };
}
