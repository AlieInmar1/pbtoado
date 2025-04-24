declare module 'pb-connect' {
  export interface PbConnectConfig {
    apiKey: string;
    baseUrl?: string;
  }

  export interface PbFeature {
    id: string;
    name: string;
    description?: string;
    status?: string;
    owner_email?: string;
    metadata?: Record<string, any>;
  }

  export interface PbInitiative {
    id: string;
    name: string;
    description?: string;
    status?: string;
  }

  export interface PbComponent {
    id: string;
    name: string;
    description?: string;
  }

  export interface PbUser {
    id: string;
    email: string;
    name?: string;
  }

  export interface PbProduct {
    id: string;
    name: string;
    description?: string;
  }

  export interface PbSyncResult {
    features: {
      added: number;
      updated: number;
      unchanged: number;
      failed: number;
    };
    initiatives: {
      added: number;
      updated: number;
      unchanged: number;
      failed: number;
    };
    components: {
      added: number;
      updated: number;
      unchanged: number;
      failed: number;
    };
    users: {
      added: number;
      updated: number;
      unchanged: number;
      failed: number;
    };
    products: {
      added: number;
      updated: number;
      unchanged: number;
      failed: number;
    };
  }

  export interface PbApi {
    getFeatures(): Promise<PbFeature[]>;
    getFeatureById(id: string): Promise<PbFeature>;
    getInitiatives(): Promise<PbInitiative[]>;
    getInitiativeById(id: string): Promise<PbInitiative>;
    getComponents(): Promise<PbComponent[]>;
    getComponentById(id: string): Promise<PbComponent>;
    getUsers(): Promise<PbUser[]>;
    getUserById(id: string): Promise<PbUser>;
    getProducts(): Promise<PbProduct[]>;
    getProductById(id: string): Promise<PbProduct>;
  }

  export interface PbDb {
    saveFeatures(features: PbFeature[]): Promise<number>;
    saveInitiatives(initiatives: PbInitiative[]): Promise<number>;
    saveComponents(components: PbComponent[]): Promise<number>;
    saveUsers(users: PbUser[]): Promise<number>;
    saveProducts(products: PbProduct[]): Promise<number>;
  }

  export interface PbTransformer {
    transformFeature(feature: any): PbFeature;
    transformInitiative(initiative: any): PbInitiative;
    transformComponent(component: any): PbComponent;
    transformUser(user: any): PbUser;
    transformProduct(product: any): PbProduct;
  }

  export interface PbSync {
    syncFeatures(): Promise<PbSyncResult['features']>;
    syncInitiatives(): Promise<PbSyncResult['initiatives']>;
    syncComponents(): Promise<PbSyncResult['components']>;
    syncUsers(): Promise<PbSyncResult['users']>;
    syncProducts(): Promise<PbSyncResult['products']>;
    syncAll(): Promise<PbSyncResult>;
  }

  export const api: PbApi;
  export const db: PbDb;
  export const transformer: PbTransformer;
  export const sync: PbSync;

  export function initialize(config: PbConnectConfig): void;
}
