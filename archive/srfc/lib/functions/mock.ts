import { FunctionProvider } from './types';
import type {
  AnalyzeStoryParams,
  AnalyzeStoryResponse,
  BreakdownStoryParams,
  BreakdownStoryResponse,
  GenerateStoryParams,
  GenerateStoryResponse,
  AnalyzeTranscriptParams,
  AnalyzeTranscriptResponse,
} from './types';

export class MockFunctionProvider implements FunctionProvider {
  async analyzeStory(params: AnalyzeStoryParams): Promise<AnalyzeStoryResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      isSprintable: true,
      reasons: ['Clear scope', 'Well-defined acceptance criteria'],
      suggestions: ['Consider adding performance metrics'],
      improvements: {
        title: 'Improved: ' + params.storyData.title,
        description: params.storyData.description + '\n\nAdditional context...',
        acceptanceCriteria: params.storyData.acceptanceCriteria?.map(ac => 'Enhanced: ' + ac) || [],
      },
    };
  }

  async breakdownStory(params: BreakdownStoryParams): Promise<BreakdownStoryResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      title: 'Broken down: ' + params.storyData.title,
      description: params.storyData.description,
      storyPoints: 5,
      acceptanceCriteria: [
        'First acceptance criterion',
        'Second acceptance criterion',
      ],
      technicalNotes: 'Technical implementation details...',
      dependencies: ['Authentication service', 'API gateway'],
      risks: ['Data migration required', 'Performance impact'],
    };
  }

  async generateStory(params: GenerateStoryParams): Promise<GenerateStoryResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      title: 'Generated Story: ' + params.prompt.slice(0, 30),
      description: 'Generated description based on: ' + params.prompt,
      acceptanceCriteria: [
        'Must handle edge cases',
        'Should be performant',
        'Must be secure',
      ],
      riceScore: {
        reach: 1000,
        impact: 8,
        confidence: 80,
        effort: 5,
        total: 128000,
      },
      sprintable: true,
      completenessScore: 85,
    };
  }

  async analyzeTranscript(params: AnalyzeTranscriptParams): Promise<AnalyzeTranscriptResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      summary: 'Mock analysis of transcript...',
      story_updates: [
        {
          id: 'story-1',
          title: 'Updated Story Title',
          description: 'Updated description based on discussion',
          acceptance_criteria: ['New criterion 1', 'New criterion 2'],
          technical_notes: 'Technical implementation details discussed...',
          discussion_points: ['Point 1', 'Point 2'],
          decisions: ['Decision 1', 'Decision 2'],
        },
      ],
      action_items: [
        {
          description: 'Follow up on technical requirements',
          assignee: 'tech.lead@company.com',
          due_date: '2024-04-08',
        },
      ],
      next_steps: [
        'Schedule technical design review',
        'Update acceptance criteria',
      ],
    };
  }
}