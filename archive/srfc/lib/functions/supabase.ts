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

export class SupabaseFunctionProvider implements FunctionProvider {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  private async invokeFunctionWithRetry<T>(
    functionName: string,
    body: any,
    retries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(
          `${this.supabaseUrl}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Function ${functionName} failed`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Only retry on network errors or 5xx server errors
        if (error instanceof TypeError || (error as any).status >= 500) {
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            continue;
          }
        }
        
        throw lastError;
      }
    }

    throw lastError;
  }

  async analyzeStory(params: AnalyzeStoryParams): Promise<AnalyzeStoryResponse> {
    return this.invokeFunctionWithRetry<AnalyzeStoryResponse>('analyze-story', params);
  }

  async breakdownStory(params: BreakdownStoryParams): Promise<BreakdownStoryResponse> {
    return this.invokeFunctionWithRetry<BreakdownStoryResponse>('breakdown-story', params);
  }

  async generateStory(params: GenerateStoryParams): Promise<GenerateStoryResponse> {
    return this.invokeFunctionWithRetry<GenerateStoryResponse>('generate-story', params);
  }

  async analyzeTranscript(params: AnalyzeTranscriptParams): Promise<AnalyzeTranscriptResponse> {
    return this.invokeFunctionWithRetry<AnalyzeTranscriptResponse>('analyze-transcript', params);
  }
}