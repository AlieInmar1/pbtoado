import React, { createContext, useContext, ReactNode } from 'react';

interface Functions {
  analyzeTranscript: (params: { sessionId: string; transcript: string }) => Promise<any>;
  analyzeStory: (params: { storyId: string; content: string }) => Promise<any>;
  // Add other functions as needed
}

interface FunctionContextType {
  functions: Functions | null;
  isLoading: boolean;
  error: Error | null;
}

const FunctionContext = createContext<FunctionContextType | undefined>(undefined);

interface FunctionProviderProps {
  children: ReactNode;
}

export const FunctionProvider: React.FC<FunctionProviderProps> = ({ children }) => {
  // Mock implementation of the functions
  const mockFunctions: Functions = {
    analyzeTranscript: async (params) => {
      console.log('Analyzing transcript for session:', params.sessionId);
      // In a real implementation, this would call the Supabase Edge Function
      // For now, just return a mock response after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        data: {
          actionItems: [
            { description: 'Update documentation', assignee: 'John', dueDate: '2025-04-21' },
            { description: 'Create test cases', assignee: 'Sarah', dueDate: '2025-04-22' }
          ],
          keyPoints: [
            'Need to improve performance',
            'Mobile responsiveness is a priority',
            'Consider accessibility requirements'
          ],
          decisions: [
            'Use React Query for data fetching',
            'Implement dark mode in next sprint',
            'Prioritize bug fixes over new features'
          ]
        }
      };
    },
    analyzeStory: async (params) => {
      console.log('Analyzing story:', params.storyId);
      // In a real implementation, this would call the Supabase Edge Function
      // For now, just return a mock response after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        data: {
          complexity: 'medium',
          riskAreas: ['performance', 'security'],
          suggestedImprovements: [
            'Add more detailed acceptance criteria',
            'Consider breaking into smaller stories',
            'Include technical constraints'
          ]
        }
      };
    }
  };

  const value = {
    functions: mockFunctions,
    isLoading: false,
    error: null,
  };

  return (
    <FunctionContext.Provider value={value}>
      {children}
    </FunctionContext.Provider>
  );
};

export const useFunctions = (): FunctionContextType => {
  const context = useContext(FunctionContext);
  if (context === undefined) {
    throw new Error('useFunctions must be used within a FunctionProvider');
  }
  return context;
};
