import { supabase } from '../supabase';

/**
 * Interface for system configuration items
 */
export interface SystemConfigItem {
  id: number;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get a configuration value by key
 * @param key The configuration key to retrieve
 * @returns Promise<string> The configuration value, or empty string if not found
 */
export async function getSystemConfig(key: string): Promise<string> {
  try {
    console.log(`[SystemConfig] Getting system config: ${key}`);
    
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      console.error(`[SystemConfig] Error getting config ${key}:`, error.message);
      return '';
    }
    
    return data?.value || '';
  } catch (error) {
    console.error(`[SystemConfig] Exception getting config ${key}:`, error);
    return '';
  }
}

/**
 * Get all system configuration items
 * @returns Promise<SystemConfigItem[]> Array of configuration items
 */
export async function getAllSystemConfig(): Promise<SystemConfigItem[]> {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('key');
    
    if (error) {
      console.error('[SystemConfig] Error getting all config:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[SystemConfig] Exception getting all config:', error);
    return [];
  }
}

/**
 * Set a configuration value
 * @param key The configuration key to set
 * @param value The value to set
 * @param description Optional description of the config item
 * @returns Promise<boolean> True if successful, false otherwise
 */
export async function setSystemConfig(
  key: string,
  value: string,
  description?: string
): Promise<boolean> {
  try {
    console.log(`[SystemConfig] Setting system config: ${key}`);
    
    // Check if the key already exists
    const { data: existingData } = await supabase
      .from('system_config')
      .select('id')
      .eq('key', key)
      .single();
    
    const now = new Date().toISOString();
    
    if (existingData?.id) {
      // Update existing config
      const { error } = await supabase
        .from('system_config')
        .update({ 
          value, 
          description: description !== undefined ? description : undefined,
          updated_at: now 
        })
        .eq('id', existingData.id);
      
      if (error) {
        console.error(`[SystemConfig] Error updating config ${key}:`, error.message);
        return false;
      }
    } else {
      // Create new config
      const { error } = await supabase
        .from('system_config')
        .insert({ 
          key, 
          value, 
          description: description || '', 
          created_at: now, 
          updated_at: now 
        });
      
      if (error) {
        console.error(`[SystemConfig] Error creating config ${key}:`, error.message);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[SystemConfig] Exception setting config ${key}:`, error);
    return false;
  }
}

/**
 * Delete a configuration item
 * @param key The configuration key to delete
 * @returns Promise<boolean> True if successful, false otherwise
 */
export async function deleteSystemConfig(key: string): Promise<boolean> {
  try {
    console.log(`[SystemConfig] Deleting system config: ${key}`);
    
    const { error } = await supabase
      .from('system_config')
      .delete()
      .eq('key', key);
    
    if (error) {
      console.error(`[SystemConfig] Error deleting config ${key}:`, error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`[SystemConfig] Exception deleting config ${key}:`, error);
    return false;
  }
}
