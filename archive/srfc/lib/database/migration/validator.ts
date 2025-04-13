import { z } from 'zod';
import type { 
  Workspace, 
  Story, 
  StoryTemplate, 
  Configuration, 
  FieldMapping,
  FeatureFlag,
  AIPrompt,
  GroomingSession
} from '../../types/database';

/**
 * Schema for validating workspace data
 */
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  pb_board_id: z.string(),
  ado_project_id: z.string(),
  pb_api_key: z.string(),
  ado_api_key: z.string(),
  sync_frequency: z.string(),
  last_sync_timestamp: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Schema for validating story data
 */
export const StorySchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  pb_id: z.string(),
  pb_title: z.string(),
  ado_id: z.string().nullable(),
  ado_title: z.string().nullable(),
  description: z.string().nullable(),
  status: z.string(),
  story_points: z.number().nullable(),
  completion_percentage: z.number(),
  sync_status: z.string(),
  needs_split: z.boolean(),
  rice_score: z.object({
    reach: z.number(),
    impact: z.number(),
    confidence: z.number(),
    effort: z.number(),
    total: z.number(),
  }).nullable(),
  sprintable: z.boolean().nullable(),
  completeness_score: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Schema for validating story template data
 */
export const StoryTemplateSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.enum(['epic', 'feature', 'story']),
  template_data: z.object({
    title_template: z.string().optional(),
    description_template: z.string().optional(),
    acceptance_criteria_template: z.array(z.string()).optional(),
    product_line: z.string().optional(),
    growth_driver: z.string().optional(),
    investment_category: z.string().optional(),
  }),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Schema for validating configuration data
 */
export const ConfigurationSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  openai_api_key: z.string().nullable(),
  slack_api_key: z.string().nullable(),
  slack_channel_id: z.string().nullable(),
  google_spaces_webhook_url: z.string().nullable(),
  field_propagation_enabled: z.boolean(),
  epic_to_feature_rules: z.record(z.any()),
  feature_to_story_rules: z.record(z.any()),
  risk_threshold_days: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Schema for validating field mapping data
 */
export const FieldMappingSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  pb_field: z.string(),
  ado_field: z.string(),
  mapping_type: z.enum(['direct', 'transform', 'lookup', 'epic_business_unit', 'feature_product_code', 'story_team']),
  mapping_rules: z.record(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Schema for validating feature flag data
 */
export const FeatureFlagSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  enabled: z.boolean(),
  conditions: z.record(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

/**
 * Schema for validating AI prompt data
 */
export const AIPromptSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  prompt_template: z.string(),
  category: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Schema for validating export data
 */
export const ExportDataSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  data: z.object({
    workspaces: z.array(WorkspaceSchema),
    stories: z.array(StorySchema),
    configurations: z.array(ConfigurationSchema),
    templates: z.array(StoryTemplateSchema),
    fieldMappings: z.array(FieldMappingSchema),
    featureFlags: z.array(FeatureFlagSchema).optional(),
    aiPrompts: z.array(AIPromptSchema).optional(),
  }),
});

/**
 * Utility class for validating data during import and export operations
 */
export class DataValidator {
  /**
   * Validate workspace data
   * @param data The workspace data to validate
   * @returns The validated workspace data
   * @throws If the data is invalid
   */
  static validateWorkspace(data: unknown): Workspace {
    return WorkspaceSchema.parse(data);
  }

  /**
   * Validate story data
   * @param data The story data to validate
   * @returns The validated story data
   * @throws If the data is invalid
   */
  static validateStory(data: unknown): Story {
    return StorySchema.parse(data);
  }

  /**
   * Validate story template data
   * @param data The story template data to validate
   * @returns The validated story template data
   * @throws If the data is invalid
   */
  static validateStoryTemplate(data: unknown): StoryTemplate {
    return StoryTemplateSchema.parse(data);
  }

  /**
   * Validate configuration data
   * @param data The configuration data to validate
   * @returns The validated configuration data
   * @throws If the data is invalid
   */
  static validateConfiguration(data: unknown): Configuration {
    return ConfigurationSchema.parse(data);
  }

  /**
   * Validate field mapping data
   * @param data The field mapping data to validate
   * @returns The validated field mapping data
   * @throws If the data is invalid
   */
  static validateFieldMapping(data: unknown): FieldMapping {
    return FieldMappingSchema.parse(data);
  }

  /**
   * Validate feature flag data
   * @param data The feature flag data to validate
   * @returns The validated feature flag data
   * @throws If the data is invalid
   */
  static validateFeatureFlag(data: unknown): FeatureFlag {
    return FeatureFlagSchema.parse(data);
  }

  /**
   * Validate AI prompt data
   * @param data The AI prompt data to validate
   * @returns The validated AI prompt data
   * @throws If the data is invalid
   */
  static validateAIPrompt(data: unknown): AIPrompt {
    return AIPromptSchema.parse(data);
  }

  /**
   * Validate export data
   * @param data The export data to validate
   * @returns The validated export data
   * @throws If the data is invalid
   */
  static validateExportData(data: unknown): z.infer<typeof ExportDataSchema> {
    return ExportDataSchema.parse(data);
  }

  /**
   * Validate import data and check for foreign key constraints
   * @param data The import data to validate
   * @returns An object containing validation results and any errors
   */
  static validateImportData(data: unknown): {
    valid: boolean;
    errors: string[];
    data: z.infer<typeof ExportDataSchema> | null;
  } {
    try {
      // First, validate the overall structure
      const validatedData = ExportDataSchema.parse(data);
      const errors: string[] = [];

      // Check for foreign key constraints
      const workspaceIds = new Set(validatedData.data.workspaces.map(w => w.id));

      // Check stories
      validatedData.data.stories.forEach(story => {
        if (!workspaceIds.has(story.workspace_id)) {
          errors.push(`Story ${story.id} references non-existent workspace ${story.workspace_id}`);
        }
      });

      // Check configurations
      validatedData.data.configurations.forEach(config => {
        if (!workspaceIds.has(config.workspace_id)) {
          errors.push(`Configuration ${config.id} references non-existent workspace ${config.workspace_id}`);
        }
      });

      // Check templates
      validatedData.data.templates.forEach(template => {
        if (!workspaceIds.has(template.workspace_id)) {
          errors.push(`Template ${template.id} references non-existent workspace ${template.workspace_id}`);
        }
      });

      // Check field mappings
      validatedData.data.fieldMappings.forEach(mapping => {
        if (!workspaceIds.has(mapping.workspace_id)) {
          errors.push(`Field mapping ${mapping.id} references non-existent workspace ${mapping.workspace_id}`);
        }
      });

      // Check feature flags
      validatedData.data.featureFlags?.forEach(flag => {
        if (!workspaceIds.has(flag.workspace_id)) {
          errors.push(`Feature flag ${flag.id} references non-existent workspace ${flag.workspace_id}`);
        }
      });

      // Check AI prompts
      validatedData.data.aiPrompts?.forEach(prompt => {
        if (!workspaceIds.has(prompt.workspace_id)) {
          errors.push(`AI prompt ${prompt.id} references non-existent workspace ${prompt.workspace_id}`);
        }
      });

      return {
        valid: errors.length === 0,
        errors,
        data: validatedData,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        data: null,
      };
    }
  }
}
