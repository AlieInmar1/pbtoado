import type { 
  Story, 
  Workspace, 
  Configuration, 
  AIPrompt, 
  FieldMapping, 
  StoryTemplate,
  GroomingSession,
  GroomingSessionStory,
  GroomingSessionParticipant,
  GroomingSessionTemplate,
  SyncLog,
  FeatureFlag,
  EntityMapping,
  RankingHistory,
  EntitySyncLog
} from '../../types/database';

export interface Repository<T> {
  getAll(workspaceId: string): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export interface StoryRepository extends Repository<Story> {
  getByWorkspace(workspaceId: string): Promise<Story[]>;
  getChildren(parentId: string): Promise<Story[]>;
  updateSyncStatus(id: string, status: string): Promise<void>;
  split(id: string, newStories: Partial<Story>[]): Promise<Story[]>;
}

export interface WorkspaceRepository extends Repository<Workspace> {
  getCurrentWorkspace(): Promise<Workspace | null>;
  setCurrentWorkspace(workspace: Workspace | null): void;
}

export interface ConfigurationRepository extends Repository<Configuration> {
  getByWorkspace(workspaceId: string): Promise<Configuration | null>;
  updateIntegrationSettings(workspaceId: string, settings: Partial<Configuration>): Promise<void>;
}

export interface AIPromptRepository extends Repository<AIPrompt> {
  getByCategory(category: string): Promise<AIPrompt[]>;
}

export interface FieldMappingRepository extends Repository<FieldMapping> {
  getByWorkspace(workspaceId: string): Promise<FieldMapping[]>;
  getByType(type: string): Promise<FieldMapping[]>;
}

export interface StoryTemplateRepository extends Repository<StoryTemplate> {
  getByLevel(level: 'epic' | 'feature' | 'story'): Promise<StoryTemplate[]>;
}

export interface FeatureFlagRepository extends Repository<FeatureFlag> {
  getEnabled(): Promise<FeatureFlag[]>;
  toggle(id: string): Promise<void>;
}

export interface GroomingSessionRepository extends Repository<GroomingSession> {
  getUpcoming(): Promise<GroomingSession[]>;
  getByStatus(status: string): Promise<GroomingSession[]>;
  updateTranscript(id: string, transcript: string): Promise<void>;
  
  // Session stories methods
  getSessionStories(sessionId: string): Promise<(GroomingSessionStory & { story: Story })[]>;
  addStoryToSession(sessionId: string, storyId: string): Promise<GroomingSessionStory>;
  removeStoryFromSession(sessionStoryId: string): Promise<boolean>;
  updateSessionStory(sessionStoryId: string, data: Partial<GroomingSessionStory>): Promise<GroomingSessionStory>;
  
  // Session participants methods
  getSessionParticipants(sessionId: string): Promise<GroomingSessionParticipant[]>;
  addParticipant(sessionId: string, participant: Partial<GroomingSessionParticipant>): Promise<GroomingSessionParticipant>;
  removeParticipant(participantId: string): Promise<boolean>;
  updateParticipant(participantId: string, data: Partial<GroomingSessionParticipant>): Promise<GroomingSessionParticipant>;
}

export interface EntityMappingRepository extends Repository<EntityMapping> {
  getByAdoId(adoId: string): Promise<EntityMapping | null>;
  getByProductBoardId(productboardId: string): Promise<EntityMapping | null>;
  getBySyncStatus(status: 'synced' | 'pending' | 'conflict'): Promise<EntityMapping[]>;
  
  // Ranking history methods
  createRankingHistory(rankingHistory: Omit<RankingHistory, 'id' | 'created_at'>): Promise<RankingHistory>;
  getRankingHistoryById(id: string): Promise<RankingHistory | null>;
  getLatestRankingHistory(productId: string, contextType: 'feature' | 'story' | 'mixed'): Promise<RankingHistory | null>;
  
  // Sync log methods
  createSyncLog(syncLog: Omit<EntitySyncLog, 'id' | 'created_at'>): Promise<EntitySyncLog>;
  getSyncLogsForEntityMapping(entityMappingId: string): Promise<EntitySyncLog[]>;
}

export interface DatabaseProvider {
  stories: StoryRepository;
  workspaces: WorkspaceRepository;
  configurations: ConfigurationRepository;
  aiPrompts: AIPromptRepository;
  fieldMappings: FieldMappingRepository;
  storyTemplates: StoryTemplateRepository;
  groomingSessions: GroomingSessionRepository;
  featureFlags: FeatureFlagRepository;
  entityMappings: EntityMappingRepository;
}
