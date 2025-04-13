import axios from 'axios';

export interface ProductBoardCustomField {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: { id: string; name: string }[];
  [key: string]: any; // For additional fields
}

export interface ProductBoardObjective {
  id: string;
  name: string;
  description?: string;
  status?: string;
  timeframe?: string;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // For additional fields
}

export interface ProductBoardComponent {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  product?: {
    id: string;
    name: string;
  };
  [key: string]: any; // For additional fields
}

export interface ProductBoardProduct {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // For additional fields
}

export interface ProductBoardInitiative {
  id: string;
  name: string;
  description?: string;
  status?: string | { id: string; name: string };
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: {
    id: string;
    name: string;
  }[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // For additional fields
}

export interface ProductBoardBoard {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductBoardFeature {
  id: string;
  name: string;
  description?: string;
  status: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: {
    id: string;
    name: string;
  }[];
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
  };
  [key: string]: any; // For additional fields
}

export class ProductBoardClient {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(private apiKey: string) {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  
  /**
   * Get the API key
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Test the connection to ProductBoard
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/test-productboard`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ api_key: this.apiKey }),
        }
      );

      const data = await response.json();
      
      // Log detailed information for debugging
      console.log('ProductBoard test response:', {
        success: data.success,
        status: response.status,
        details: data.details,
        error: data.error
      });
      
      return data.success === true;
    } catch (error) {
      console.error('ProductBoard connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all boards from ProductBoard
   */
  async getBoards(): Promise<ProductBoardBoard[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-boards`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ api_key: this.apiKey }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if it's a 404 error, which likely means invalid API key
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || 'Failed to fetch ProductBoard boards');
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error('Error fetching ProductBoard boards:', error);
      throw error;
    }
  }

  /**
   * Get a board by ID
   */
  async getBoardById(id: string): Promise<ProductBoardBoard> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-boards`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            board_id: id
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if it's a 404 error, which likely means invalid API key
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch ProductBoard board ${id}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching ProductBoard board ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all features from ProductBoard
   */
  async getFeatures(params: Record<string, any> = {}): Promise<ProductBoardFeature[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-features`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            params
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if it's a 404 error, which likely means invalid API key
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || 'Failed to fetch ProductBoard features');
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error('Error fetching ProductBoard features:', error);
      throw error;
    }
  }

  /**
   * Get a feature by ID
   */
  async getFeatureById(id: string): Promise<ProductBoardFeature> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-features`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            feature_id: id
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if it's a 404 error, which likely means invalid API key
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch ProductBoard feature ${id}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching ProductBoard feature ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get features for a specific board
   */
  async getFeaturesForBoard(boardId: string): Promise<ProductBoardFeature[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-features`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            board_id: boardId
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if it's a 404 error, which likely means invalid API key
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch features for board ${boardId}`);
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error(`Error fetching features for board ${boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get features for a specific product
   */
  async getFeaturesForProduct(productId: string): Promise<ProductBoardFeature[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-features`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            product_id: productId
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if it's a 404 error, which likely means invalid API key
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch features for product ${productId}`);
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error(`Error fetching features for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get features for a specific component
   */
  async getFeaturesForComponent(componentId: string): Promise<ProductBoardFeature[]> {
    try {
      console.log(`Fetching features for component ${componentId}`);
      console.log(`Using API key starting with: ${this.apiKey.substring(0, 5)}...`);
      
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-features`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            component_id: componentId
          }),
        }
      );

      const data = await response.json();
      console.log(`Response for features of component ${componentId}:`, {
        status: response.status,
        success: data.success,
        error: data.error,
        details: data.details,
        dataLength: data.data?.data?.length
      });
      
      if (!response.ok || !data.success) {
        // Check if it's specifically an authentication error (401)
        if (data.status === 401 || (data.details && data.details.status === 401)) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        
        // If it's a 404, it might just mean no features found for this component
        if (data.status === 404 || (data.details && data.details.status === 404) || data.error?.includes('404')) {
          console.log(`No features found for component ${componentId} (404 response)`);
          return []; // Return empty array instead of throwing an error
        }
        
        throw new Error(data.error || `Failed to fetch features for component ${componentId}`);
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error(`Error fetching features for component ${componentId}:`, error);
      throw error;
    }
  }

  /**
   * Get subfeatures for a specific feature
   */
  async getSubfeaturesForFeature(featureId: string): Promise<ProductBoardFeature[]> {
    try {
      console.log(`Fetching subfeatures for feature ${featureId}`);
      console.log(`Using API key starting with: ${this.apiKey.substring(0, 5)}...`);
      
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-features`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            parent_id: featureId
          }),
        }
      );

      const data = await response.json();
      console.log(`Response for subfeatures of feature ${featureId}:`, {
        status: response.status,
        success: data.success,
        error: data.error,
        details: data.details,
        dataLength: data.data?.data?.length
      });
      
      if (!response.ok || !data.success) {
        // Check if it's specifically an authentication error (401)
        if (data.status === 401 || (data.details && data.details.status === 401)) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        
        // If it's a 404, it might just mean no subfeatures found for this feature
        if (data.status === 404 || (data.details && data.details.status === 404) || data.error?.includes('404')) {
          console.log(`No subfeatures found for feature ${featureId} (404 response)`);
          return []; // Return empty array instead of throwing an error
        }
        
        throw new Error(data.error || `Failed to fetch subfeatures for feature ${featureId}`);
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error(`Error fetching subfeatures for feature ${featureId}:`, error);
      throw error;
    }
  }

  /**
   * Get the complete product hierarchy (product -> components -> features -> subfeatures)
   */
  async getProductHierarchy(productId: string): Promise<{
    product: ProductBoardProduct;
    components: Array<{
      component: ProductBoardComponent;
      features: Array<{
        feature: ProductBoardFeature;
        subfeatures: ProductBoardFeature[];
      }>;
    }>;
  }> {
    console.log('getProductHierarchy called with productId:', productId);
    
    try {
      // Get the product details
      console.log('Fetching product details for productId:', productId);
      const product = await this.getProductById(productId);
      console.log('Product details:', product);
      
      // Get all components for the product
      console.log('Fetching components for productId:', productId);
      const components = await this.getComponentsForProduct(productId);
      console.log(`Found ${components.length} components for product ${productId}`);
      
      // For each component, get its features
      console.log('Fetching features for each component...');
      const componentsWithFeatures = await Promise.all(
        components.map(async (component) => {
          console.log(`Fetching features for component ${component.id} (${component.name})`);
          const features = await this.getFeaturesForComponent(component.id);
          console.log(`Found ${features.length} features for component ${component.id}`);
          
          // For each feature, get its subfeatures
          console.log('Fetching subfeatures for each feature...');
          const featuresWithSubfeatures = await Promise.all(
            features.map(async (feature) => {
              console.log(`Fetching subfeatures for feature ${feature.id} (${feature.name})`);
              const subfeatures = await this.getSubfeaturesForFeature(feature.id);
              console.log(`Found ${subfeatures.length} subfeatures for feature ${feature.id}`);
              return {
                feature,
                subfeatures,
              };
            })
          );
          
          return {
            component,
            features: featuresWithSubfeatures,
          };
        })
      );
      
      console.log('Product hierarchy successfully built');
      return {
        product,
        components: componentsWithFeatures,
      };
    } catch (error) {
      console.error(`Error fetching product hierarchy for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get all initiatives from ProductBoard
   */
  async getInitiatives(params: Record<string, any> = {}): Promise<ProductBoardInitiative[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-initiatives`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            params
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if it's a 404 error, which likely means invalid API key
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || 'Failed to fetch ProductBoard initiatives');
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error('Error fetching ProductBoard initiatives:', error);
      throw error;
    }
  }

  /**
   * Get an initiative by ID
   */
  async getInitiativeById(id: string): Promise<ProductBoardInitiative> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-initiatives`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            initiative_id: id
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if it's a 404 error, which likely means invalid API key
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch ProductBoard initiative ${id}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching ProductBoard initiative ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all custom fields from ProductBoard
   */
  async getCustomFields(params: Record<string, any> = {}): Promise<ProductBoardCustomField[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-custom-fields`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            params
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || 'Failed to fetch ProductBoard custom fields');
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error('Error fetching ProductBoard custom fields:', error);
      throw error;
    }
  }

  /**
   * Get a custom field by ID
   */
  async getCustomFieldById(id: string): Promise<ProductBoardCustomField> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-custom-fields`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            custom_field_id: id
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch ProductBoard custom field ${id}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching ProductBoard custom field ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get custom field values for a specific entity
   */
  async getCustomFieldValues(entityType: 'feature' | 'initiative' | 'component' | 'product', entityId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-custom-fields`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            entity_type: entityType,
            entity_id: entityId
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch custom field values for ${entityType} ${entityId}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching custom field values for ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get all objectives from ProductBoard
   */
  async getObjectives(params: Record<string, any> = {}): Promise<ProductBoardObjective[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-objectives`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            params
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || 'Failed to fetch ProductBoard objectives');
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error('Error fetching ProductBoard objectives:', error);
      throw error;
    }
  }

  /**
   * Get an objective by ID
   */
  async getObjectiveById(id: string): Promise<ProductBoardObjective> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-objectives`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            objective_id: id
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch ProductBoard objective ${id}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching ProductBoard objective ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get objectives for a specific initiative
   */
  async getObjectivesForInitiative(initiativeId: string): Promise<ProductBoardObjective[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-objectives`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            initiative_id: initiativeId
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch objectives for initiative ${initiativeId}`);
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error(`Error fetching objectives for initiative ${initiativeId}:`, error);
      throw error;
    }
  }

  /**
   * Get all components from ProductBoard
   */
  async getComponents(params: Record<string, any> = {}): Promise<ProductBoardComponent[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-components`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            params
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || 'Failed to fetch ProductBoard components');
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error('Error fetching ProductBoard components:', error);
      throw error;
    }
  }

  /**
   * Get a component by ID
   */
  async getComponentById(id: string): Promise<ProductBoardComponent> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-components`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            component_id: id
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch ProductBoard component ${id}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching ProductBoard component ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all products from ProductBoard
   */
  async getProducts(params: Record<string, any> = {}): Promise<ProductBoardProduct[]> {
    try {
      console.log('Fetching ProductBoard products with params:', params);
      console.log('Using API key starting with:', this.apiKey.substring(0, 5) + '...');
      
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-products`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            params
          }),
        }
      );

      const data = await response.json();
      console.log('ProductBoard products response:', {
        status: response.status,
        success: data.success,
        error: data.error,
        dataLength: data.data?.data?.length
      });
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || 'Failed to fetch ProductBoard products');
      }
      
      const products = data.data.data || [];
      console.log(`Found ${products.length} ProductBoard products`);
      return products;
    } catch (error) {
      console.error('Error fetching ProductBoard products:', error);
      throw error;
    }
  }

  /**
   * Get a product by ID
   */
  async getProductById(id: string): Promise<ProductBoardProduct> {
    try {
      console.log(`Fetching product with ID ${id}`);
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-products`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            product_id: id
          }),
        }
      );

      const data = await response.json();
      console.log(`Response for product ${id}:`, {
        status: response.status,
        success: data.success,
        error: data.error
      });
      
      if (!response.ok || !data.success) {
        if (data.status === 404 || data.error?.includes('404')) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        throw new Error(data.error || `Failed to fetch ProductBoard product ${id}`);
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching ProductBoard product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get components for a specific product
   */
  async getComponentsForProduct(productId: string): Promise<ProductBoardComponent[]> {
    try {
      console.log(`Fetching components for product ${productId}`);
      console.log(`Using API key starting with: ${this.apiKey.substring(0, 5)}...`);
      
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-components`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            product_id: productId
          }),
        }
      );

      const data = await response.json();
      console.log(`Response for components of product ${productId}:`, {
        status: response.status,
        success: data.success,
        error: data.error,
        details: data.details,
        dataLength: data.data?.data?.length
      });
      
      // Handle all error cases more gracefully
      if (!response.ok || !data.success) {
        // Authentication errors (401)
        if (data.status === 401 || (data.details && data.details.status === 401)) {
          console.warn('Authentication error when fetching components');
          return []; // Return empty array instead of throwing
        }
        
        // Not found errors (404) - product doesn't exist or has no components
        if (data.status === 404 || (data.details && data.details.status === 404) || data.error?.includes('404')) {
          console.log(`No components found for product ${productId} (404 response)`);
          return []; // Return empty array
        }
        
        // Bad request errors (400) - likely invalid product ID format
        if (data.status === 400 || (data.details && data.details.status === 400)) {
          console.warn(`Bad request when fetching components for product ${productId}`);
          return []; // Return empty array
        }
        
        // For any other errors, log but don't throw
        console.error(`Error fetching components for product ${productId}:`, data.error);
        return []; // Return empty array for all other errors
      }
      
      return data.data.data || [];
    } catch (error) {
      // Catch any network or parsing errors
      console.error(`Error fetching components for product ${productId}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get features linked to a specific initiative
   */
  async getFeaturesForInitiative(initiativeId: string): Promise<ProductBoardFeature[]> {
    try {
      console.log(`Fetching features for initiative ${initiativeId}`);
      console.log(`Using API key starting with: ${this.apiKey.substring(0, 5)}...`);
      
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/get-productboard-initiative-features`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: this.apiKey,
            initiative_id: initiativeId
          }),
        }
      );

      const data = await response.json();
      console.log(`Response for features of initiative ${initiativeId}:`, {
        status: response.status,
        success: data.success,
        error: data.error,
        details: data.details,
        dataLength: data.data?.data?.length
      });
      
      if (!response.ok || !data.success) {
        // Check if it's specifically an authentication error (401)
        if (data.status === 401 || (data.details && data.details.status === 401)) {
          throw new Error('Invalid ProductBoard API key. Please check your API key and try again.');
        }
        
        // If it's a 404, it might just mean no features found for this initiative
        if (data.status === 404 || (data.details && data.details.status === 404) || data.error?.includes('404')) {
          console.log(`No features found for initiative ${initiativeId} (404 response)`);
          return []; // Return empty array instead of throwing an error
        }
        
        throw new Error(data.error || `Failed to fetch features for initiative ${initiativeId}`);
      }
      
      return data.data.data || [];
    } catch (error) {
      console.error(`Error fetching features for initiative ${initiativeId}:`, error);
      throw error;
    }
  }

  /**
   * Get all available boards with their names and IDs
   */
  async getBoardsWithNames(): Promise<{ id: string; name: string }[]> {
    try {
      // First get all boards (which are actually features in the API)
      const boards = await this.getBoards();
      
      // Transform the data to a simpler format with just id and name
      return boards.map(board => ({
        id: board.id,
        name: board.name || `Board ${board.id}`
      }));
    } catch (error) {
      console.error('Error fetching ProductBoard boards:', error);
      throw error;
    }
  }
}
