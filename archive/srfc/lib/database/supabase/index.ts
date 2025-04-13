import { createClient } from '@supabase/supabase-js';
import { SupabaseStoryRepository } from './repositories/StoryRepository';
import { SupabaseWorkspaceRepository } from './repositories/WorkspaceRepository';
import { SupabaseConfigurationRepository } from './repositories/ConfigurationRepository';
import { SupabaseAIPromptRepository } from './repositories/AIPromptRepository';
import { SupabaseFieldMappingRepository } from './repositories/FieldMappingRepository';
import { SupabaseStoryTemplateRepository } from './repositories/StoryTemplateRepository';
import { SupabaseGroomingSessionRepository } from './repositories/GroomingSessionRepository';
import { SupabaseFeatureFlagRepository } from './repositories/FeatureFlagRepository';
import { SupabaseEntityMappingRepository } from './repositories/EntityMappingRepository';
import type { DatabaseProvider } from '../types';

export class SupabaseDatabaseProvider implements DatabaseProvider {
  private client: ReturnType<typeof createClient>;
  
  stories: SupabaseStoryRepository;
  workspaces: SupabaseWorkspaceRepository;
  configurations: SupabaseConfigurationRepository;
  aiPrompts: SupabaseAIPromptRepository;
  fieldMappings: SupabaseFieldMappingRepository;
  storyTemplates: SupabaseStoryTemplateRepository;
  groomingSessions: SupabaseGroomingSessionRepository;
  featureFlags: SupabaseFeatureFlagRepository;
  entityMappings: SupabaseEntityMappingRepository;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);

    this.stories = new SupabaseStoryRepository(this.client);
    this.workspaces = new SupabaseWorkspaceRepository(this.client);
    this.configurations = new SupabaseConfigurationRepository(this.client);
    this.aiPrompts = new SupabaseAIPromptRepository(this.client);
    this.fieldMappings = new SupabaseFieldMappingRepository(this.client);
    this.storyTemplates = new SupabaseStoryTemplateRepository(this.client);
    this.groomingSessions = new SupabaseGroomingSessionRepository(this.client);
    this.featureFlags = new SupabaseFeatureFlagRepository(this.client);
    this.entityMappings = new SupabaseEntityMappingRepository(this.client);
  }
}
