import { supabase } from '../supabase';

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

// Default mapping configuration
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
 * @returns Promise<HierarchyMappingConfig[]> Array of mapping configurations
 */
export async function fetchHierarchyMappings(): Promise<HierarchyMappingConfig[]> {
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
 * Save a hierarchy mapping configuration to Supabase
 * @param mapping The mapping configuration to save
 * @returns Promise<HierarchyMappingConfig> The saved mapping configuration
 */
export async function saveHierarchyMapping(mapping: HierarchyMappingConfig): Promise<HierarchyMappingConfig> {
  try {
    const { data, error } = await supabase
      .from('hierarchy_mappings')
      .upsert(mapping)
      .select()
      .single();
      
    if (error) {
      console.error('Error saving hierarchy mapping:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Exception in saveHierarchyMapping:', err);
    throw err;
  }
}

/**
 * Get the appropriate area path for a ProductBoard item based on the mapping configuration
 * @param businessUnit The business unit of the item
 * @param productCode The product code of the item
 * @param team The team of the item
 * @param mappings The mapping configurations to use
 * @returns The area path for the item
 */
export function getAreaPathForItem(
  businessUnit: string,
  productCode: string,
  team: string,
  mappings: HierarchyMappingConfig[]
): string {
  // Use the first mapping configuration for now
  // In the future, we could add logic to select the appropriate mapping
  const mapping = mappings[0];
  
  // Find the matching area path mapping - try new fields first
  const areaPathMapping = mapping.area_path_mappings.find(m => {
    if (m.mapping_type === 'epic') {
      return m.ado_business_unit === businessUnit;
    } else if (m.mapping_type === 'feature') {
      return m.ado_product === productCode;
    } else if (m.mapping_type === 'story') {
      return m.ado_team === team;
    }
    return false;
  });
  
  // If found with new fields, return the area path
  if (areaPathMapping) {
    return areaPathMapping.area_path;
  }
  
  // Legacy support - try the old fields
  const legacyMapping = mapping.area_path_mappings.find(m => 
    m.business_unit === businessUnit && 
    m.product_code === productCode && 
    m.team === team
  );
  
  // If no exact match, try to find a partial match
  if (!legacyMapping) {
    // Try matching just business unit and product code
    const partialMapping = mapping.area_path_mappings.find(m => 
      m.business_unit === businessUnit && 
      m.product_code === productCode
    );
    
    if (partialMapping) {
      return partialMapping.area_path;
    }
    
    // Try matching just business unit
    const businessUnitMapping = mapping.area_path_mappings.find(m => 
      m.business_unit === businessUnit
    );
    
    if (businessUnitMapping) {
      return businessUnitMapping.area_path;
    }
    
    // Default to the first mapping's area path
    return mapping.area_path_mappings[0]?.area_path || 'Unknown';
  }
  
  return legacyMapping.area_path;
}

/**
 * Get the appropriate team for a story based on user, component, and business unit
 * @param userEmail The email of the user (owner)
 * @param componentId The component ID
 * @param businessUnit The business unit
 * @param mappings The mapping configurations to use
 * @returns The team for the story
 */
export function getTeamForStory(
  userEmail: string,
  componentId: string,
  businessUnit: string,
  mappings: HierarchyMappingConfig[]
): string {
  // Use the first mapping configuration for now
  const mapping = mappings[0];
  
  // Find the component product mapping to get the product code
  const componentMapping = mapping.component_product_mappings.find(m => 
    m.component_id === componentId
  );
  
  const productCode = componentMapping?.product_name || '';
  
  // Find the matching user team mapping with exact match
  const userTeamMapping = mapping.user_team_mappings.find(m => 
    m.user_email === userEmail && 
    m.product_code === productCode && 
    m.business_unit === businessUnit
  );
  
  // If no exact match, try to find a partial match
  if (!userTeamMapping) {
    // Try matching just user email and product code
    const userProductMapping = mapping.user_team_mappings.find(m => 
      m.user_email === userEmail && 
      m.product_code === productCode
    );
    
    if (userProductMapping) {
      return userProductMapping.team;
    }
    
    // Try matching just user email and business unit
    const userBuMapping = mapping.user_team_mappings.find(m => 
      m.user_email === userEmail && 
      m.business_unit === businessUnit
    );
    
    if (userBuMapping) {
      return userBuMapping.team;
    }
    
    // Try matching just user email
    const userMapping = mapping.user_team_mappings.find(m => 
      m.user_email === userEmail
    );
    
    if (userMapping) {
      return userMapping.team;
    }
    
    // Try matching just product code and business unit
    const productBuMapping = mapping.user_team_mappings.find(m => 
      m.product_code === productCode && 
      m.business_unit === businessUnit
    );
    
    if (productBuMapping) {
      return productBuMapping.team;
    }
    
    // Try matching just product code
    const productMapping = mapping.user_team_mappings.find(m => 
      m.product_code === productCode
    );
    
    if (productMapping) {
      return productMapping.team;
    }
    
    // Try matching just business unit
    const buMapping = mapping.user_team_mappings.find(m => 
      m.business_unit === businessUnit
    );
    
    if (buMapping) {
      return buMapping.team;
    }
    
    // Default to the first mapping's team
    return mapping.user_team_mappings[0]?.team || 'Unknown';
  }
  
  return userTeamMapping.team;
}

/**
 * Get the appropriate product for a component
 * @param componentId The component ID
 * @param mappings The mapping configurations to use
 * @returns The product for the component
 */
export function getProductForComponent(
  componentId: string,
  mappings: HierarchyMappingConfig[]
): string {
  // Use the first mapping configuration for now
  const mapping = mappings[0];
  
  // Find the matching component product mapping
  const componentMapping = mapping.component_product_mappings.find(m => 
    m.component_id === componentId
  );
  
  if (!componentMapping) {
    // Default to unknown if no mapping found
    return 'Unknown';
  }
  
  return componentMapping.product_name;
}

/**
 * Get the appropriate business unit for an initiative
 * @param initiativeId The initiative ID
 * @param mappings The mapping configurations to use
 * @returns The business unit for the initiative
 */
export function getBusinessUnitForInitiative(
  initiativeId: string,
  mappings: HierarchyMappingConfig[]
): string {
  // Use the first mapping configuration for now
  const mapping = mappings[0];
  
  // Find the matching initiative epic mapping
  const initiativeMapping = mapping.initiative_epic_mappings.find(m => 
    m.pb_initiative_id === initiativeId
  );
  
  if (!initiativeMapping) {
    // Default to unknown if no mapping found
    return 'Unknown';
  }
  
  // Extract business unit from the epic name or description
  // This is a placeholder - in a real implementation, you would need to
  // determine how to extract the business unit from the initiative or epic
  return initiativeMapping.description?.split(' ')[0] || 'Unknown';
}

/**
 * Get the appropriate ADO work item type for a ProductBoard item based on the mapping configuration
 * @param pbLevel The ProductBoard level of the item
 * @param mappings The mapping configurations to use
 * @returns The ADO work item type for the item
 */
export function getAdoTypeForPbLevel(
  pbLevel: 'initiative' | 'feature' | 'subfeature',
  mappings: HierarchyMappingConfig[]
): 'Epic' | 'Feature' | 'User Story' {
  // Use the first mapping configuration for now
  const mapping = mappings[0];
  
  // Find the matching PB to ADO mapping
  const pbToAdoMapping = mapping.pb_to_ado_mappings.find(m => 
    m.pb_level === pbLevel
  );
  
  if (!pbToAdoMapping) {
    // Default mappings if not found
    switch (pbLevel) {
      case 'initiative':
        return 'Epic';
      case 'feature':
        return 'Feature';
      case 'subfeature':
        return 'User Story';
      default:
        return 'User Story';
    }
  }
  
  return pbToAdoMapping.ado_type;
}
