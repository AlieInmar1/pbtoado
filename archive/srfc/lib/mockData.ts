import { v4 as uuidv4 } from 'uuid';
import type { Story, Workspace, Configuration } from '../types/database';

// Mock Workspaces
export const mockWorkspaces: Workspace[] = [
  {
    id: uuidv4(),
    name: 'Mobile App Project',
    pb_board_id: 'pb_123',
    ado_project_id: 'ado_456',
    pb_api_key: 'pb_key_123',
    ado_api_key: 'ado_key_456',
    sync_frequency: '01:00:00',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Web Platform',
    pb_board_id: 'pb_789',
    ado_project_id: 'ado_012',
    pb_api_key: 'pb_key_789',
    ado_api_key: 'ado_key_012',
    sync_frequency: '00:30:00',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock Stories
export const mockStories: Story[] = [
  {
    id: uuidv4(),
    workspace_id: mockWorkspaces[0].id,
    pb_id: 'PB-1',
    pb_title: 'Implement User Authentication',
    ado_id: 'ADO-101',
    ado_title: 'ENG-101: Implement User Authentication Flow',
    description: 'Add secure user authentication with email and password',
    status: 'in_progress',
    story_points: 5,
    completion_percentage: 60,
    sync_status: 'synced',
    needs_split: false,
    rice_score: {
      reach: 5000,
      impact: 8,
      confidence: 90,
      effort: 5,
      total: 7200
    },
    sprintable: true,
    completeness_score: 95,
    notes: 'Ready for development',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    workspace_id: mockWorkspaces[0].id,
    pb_id: 'PB-2',
    pb_title: 'Password Reset Flow',
    ado_id: 'ADO-102',
    ado_title: 'ENG-102: Implement Password Reset',
    description: 'Allow users to reset their password securely',
    status: 'open',
    story_points: 3,
    completion_percentage: 0,
    sync_status: 'pending',
    needs_split: false,
    rice_score: {
      reach: 3000,
      impact: 6,
      confidence: 85,
      effort: 3,
      total: 5100
    },
    sprintable: true,
    completeness_score: 85,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock Configurations
export const mockConfigurations: Configuration[] = [
  {
    id: uuidv4(),
    workspace_id: mockWorkspaces[0].id,
    openai_api_key: 'sk-mock-key-123',
    slack_api_key: 'xoxb-mock-slack-key',
    slack_channel_id: 'C123456',
    google_spaces_webhook_url: 'https://chat.googleapis.com/mock-webhook',
    field_propagation_rules: {
      epic_to_feature: ['category', 'priority'],
      feature_to_story: ['team', 'component']
    },
    risk_threshold_days: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];