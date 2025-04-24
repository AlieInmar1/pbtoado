/**
 * ProductBoard API types
 */

export interface ProductBoardFeature {
  id?: string;
  name: string;
  description: string;
  type: 'feature' | 'task' | 'epic' | 'initiative';
  status: string;
  parent_id?: string;
  product_id?: string;
  component_id?: string;
  custom_fields?: Record<string, any>;
  notes?: {
    content: string;
    type: 'acceptance_criteria' | 'customer_need' | 'technical_notes' | 'general';
  }[];
  links?: {
    url: string;
    title: string;
    type: 'general' | 'specification' | 'tracking';
  }[];
  user_id?: string;
}

export interface ProductBoardPushOptions {
  parentId?: string;
  productId?: string;
  componentId?: string;
  statusOverride?: string;
  includeTags?: boolean;
  includeAttachments?: boolean;
  includeRelationships?: boolean;
}

export interface ProductBoardPushResult {
  success: boolean;
  productboardId?: string;
  message?: string;
  errors?: any[];
  details?: any;
}
