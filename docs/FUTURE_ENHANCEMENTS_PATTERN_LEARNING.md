# Future Enhancements: Advanced Pattern Learning System

This document outlines planned enhancements to transform our current rule-based pattern detection system into a sophisticated machine learning system that improves over time based on user feedback and usage patterns.

## Overview

The Advanced Pattern Learning System will include four main components:

1. **Pattern Learning System**: Move beyond rule-based detection to learn from user feedback
2. **Auto-suggestion Refinement**: Improve suggestions based on acceptance rates
3. **Custom Pattern Creation**: Allow teams to define and save their own patterns
4. **Pattern Analytics**: Track which patterns lead to higher quality stories

Together, these enhancements will create a self-improving system that becomes more accurate and useful over time, adapting to the specific needs and patterns of different teams.

## 1. Database Schema Enhancements

### New Tables Required

```sql
-- Store user feedback on pattern suggestions
CREATE TABLE pattern_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID REFERENCES story_patterns(id),
  story_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'accepted', 'rejected', 'modified'
  original_suggestion TEXT,
  final_text TEXT,
  similarity_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB -- Additional context about the suggestion
);

-- Custom user-defined patterns
CREATE TABLE custom_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  pattern_regex TEXT,
  example_matches TEXT[],
  team_id UUID, -- NULL means global pattern
  confidence_threshold FLOAT DEFAULT 0.7,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INT DEFAULT 0,
  success_rate FLOAT DEFAULT 0.0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Pattern analytics
CREATE TABLE pattern_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  usage_count INT DEFAULT 0,
  acceptance_rate FLOAT DEFAULT 0.0,
  rejection_rate FLOAT DEFAULT 0.0,
  modification_rate FLOAT DEFAULT 0.0,
  story_quality_score FLOAT, -- Derived from subsequent ratings
  team_id UUID, -- For team-specific analytics
  UNIQUE(pattern_id, period_start, period_end, team_id)
);
```

### Modifications to Existing Tables

```sql
-- Add learning capabilities to existing story_patterns table
ALTER TABLE story_patterns
ADD COLUMN confidence_score FLOAT DEFAULT 0.7,
ADD COLUMN learning_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN version INT DEFAULT 1,
ADD COLUMN previous_versions JSONB;
```

## 2. Pattern Learning System

### Architecture

The Pattern Learning System will follow this architecture:

```
┌─────────────────────┐       ┌────────────────────┐
│  Pattern Detection  │       │  Feedback System   │
│     Component       │ ───── │    Component       │
└─────────────────────┘       └────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐       ┌────────────────────┐
│   Pattern Database  │ ───── │ Feedback Database  │
└─────────────────────┘       └────────────────────┘
           │                           │
           │                           │
           ▼                           ▼
┌────────────────────────────────────────────────┐
│             Pattern Learning Engine             │
└────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│              Pattern Optimizer                 │
└────────────────────────────────────────────────┘
```

### Key Components

#### 1. Feedback Collection Module

```typescript
// src/features/story-creator/components/patterns/PatternSuggestionCard.tsx

interface PatternSuggestionCardProps {
  suggestion: PatternSuggestion;
  storyId: string;
  onAccept: (suggestion: PatternSuggestion) => void;
  onReject: (suggestion: PatternSuggestion) => void;
  onModify: (suggestion: PatternSuggestion, modifiedText: string) => void;
}

export const PatternSuggestionCard: React.FC<PatternSuggestionCardProps> = ({
  suggestion,
  storyId,
  onAccept,
  onReject,
  onModify
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedText, setModifiedText] = useState(suggestion.text);
  
  const handleAccept = () => {
    onAccept(suggestion);
    recordFeedback({
      patternId: suggestion.patternId,
      storyId,
      action: 'accepted',
      originalSuggestion: suggestion.text,
      finalText: suggestion.text
    });
  };
  
  const handleReject = () => {
    onReject(suggestion);
    recordFeedback({
      patternId: suggestion.patternId,
      storyId,
      action: 'rejected',
      originalSuggestion: suggestion.text,
      finalText: null
    });
  };
  
  const handleModifySave = () => {
    onModify(suggestion, modifiedText);
    recordFeedback({
      patternId: suggestion.patternId,
      storyId,
      action: 'modified',
      originalSuggestion: suggestion.text,
      finalText: modifiedText,
      similarityScore: calculateSimilarity(suggestion.text, modifiedText)
    });
    setIsEditing(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-gray-800">{suggestion.patternName}</h4>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {Math.round(suggestion.confidence * 100)}% confidence
        </span>
      </div>
      
      {isEditing ? (
        <div className="mb-3">
          <Textarea
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            className="w-full"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleModifySave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 mb-3">{suggestion.text}</p>
      )}
      
      {!isEditing && (
        <div className="flex space-x-2">
          <Button 
            variant="success" 
            size="sm" 
            onClick={handleAccept}
          >
            Apply
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            Modify
          </Button>
        </div>
      )}
    </div>
  );
};
```

#### 2. Pattern Learning Service

```typescript
// src/features/story-creator/services/patternLearningService.ts

interface PatternMetrics {
  acceptanceRate: number;
  rejectionRate: number;
  modificationRate: number;
  modificationPatterns: ModificationPattern[];
  suggestedImprovements: string[];
}

interface ModificationPattern {
  type: 'addition' | 'removal' | 'replacement';
  frequency: number;
  examples: string[];
}

export async function analyzeFeedback(patternId: string): Promise<PatternMetrics> {
  // Retrieve all feedback for this pattern
  const feedback = await getPatternFeedback(patternId);
  
  if (feedback.length === 0) {
    return {
      acceptanceRate: 0,
      rejectionRate: 0,
      modificationRate: 0,
      modificationPatterns: [],
      suggestedImprovements: []
    };
  }
  
  // Calculate acceptance rate
  const acceptanceRate = feedback.filter(f => f.action === 'accepted').length / feedback.length;
  const rejectionRate = feedback.filter(f => f.action === 'rejected').length / feedback.length;
  
  // Analyze modifications to understand how suggestions are being changed
  const modifications = feedback.filter(f => f.action === 'modified');
  const modificationRate = modifications.length / feedback.length;
  
  // Analyze how suggestions are being modified
  const modificationPatterns = analyzeModifications(modifications);
  
  // Generate suggested improvements to the pattern
  const suggestedImprovements = generateImprovements(modificationPatterns);
  
  // Update pattern confidence based on feedback
  await updatePatternConfidence(patternId, calculateNewConfidence(feedback));
  
  return {
    acceptanceRate,
    rejectionRate,
    modificationRate,
    modificationPatterns,
    suggestedImprovements
  };
}

function analyzeModifications(modifications: PatternFeedback[]): ModificationPattern[] {
  // Implementation would use text diff algorithms to identify common changes
  // For example, using libraries like 'diff' or 'jsdiff'
  
  // This would identify patterns like:
  // - Adding specific qualifiers
  // - Removing certain phrases
  // - Changing tense or voice
  // - Adding or removing technical details
  
  // Example placeholder implementation
  return [
    {
      type: 'addition',
      frequency: 0.6,
      examples: ['adding acceptance criteria', 'adding technical context']
    },
    {
      type: 'removal',
      frequency: 0.3,
      examples: ['removing implementation details', 'simplifying language']
    }
  ];
}

function generateImprovements(patterns: ModificationPattern[]): string[] {
  // Convert patterns into actionable suggestions
  // This could use a combination of rules and ML
  
  // Example implementation
  const improvements: string[] = [];
  
  patterns.forEach(pattern => {
    if (pattern.type === 'addition' && pattern.frequency > 0.5) {
      improvements.push(`Consider adding ${pattern.examples[0]} to pattern template`);
    }
    else if (pattern.type === 'removal' && pattern.frequency > 0.5) {
      improvements.push(`Consider removing ${pattern.examples[0]} from pattern template`);
    }
  });
  
  return improvements;
}

function calculateNewConfidence(feedback: PatternFeedback[]): number {
  // Implement a confidence adjustment algorithm
  // This could be a simple weighted average or a more complex algorithm
  
  const acceptanceWeight = 1.0;
  const modificationWeight = 0.5;
  const rejectionWeight = -1.0;
  
  const acceptances = feedback.filter(f => f.action === 'accepted').length;
  const modifications = feedback.filter(f => f.action === 'modified').length;
  const rejections = feedback.filter(f => f.action === 'rejected').length;
  
  const totalWeight = acceptanceWeight * acceptances +
                     modificationWeight * modifications +
                     rejectionWeight * rejections;
                     
  const totalFeedback = feedback.length;
  
  // Convert to a confidence score between 0 and 1
  const baseScore = 0.5;
  const learningRate = 0.01;
  
  return Math.min(Math.max(baseScore + (totalWeight / totalFeedback) * learningRate, 0), 1);
}

export async function updatePatternConfidence(patternId: string, newConfidence: number): Promise<void> {
  // Update the pattern's confidence score in the database
  await supabase
    .from('story_patterns')
    .update({ confidence_score: newConfidence })
    .eq('id', patternId);
}
```

## 3. Auto-suggestion Refinement System

The auto-suggestion refinement system will enhance the existing suggestion engine to provide more personalized and effective suggestions based on historical patterns of user interactions.

### Architecture

```
┌───────────────────┐      ┌────────────────────┐
│  Context Analysis │      │ User Preference    │
│      Engine       │      │     Model          │
└───────────────────┘      └────────────────────┘
         │                           │
         ▼                           ▼
┌────────────────────────────────────────────────┐
│             Suggestion Generator                │
└────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│           Suggestion Ranking Engine             │
└────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│             Suggestion Presentation             │
└────────────────────────────────────────────────┘
```

### Key Components

#### 1. Enhanced Suggestion Engine

```typescript
// src/features/story-creator/services/suggestionEngine.ts

interface StoryContext {
  userId: string;
  teamId: string;
  storyType: 'epic' | 'feature' | 'story' | 'task';
  componentId?: string;
  parentId?: string;
  workspaceId: string;
}

interface Suggestion {
  id: string;
  patternId: string;
  patternName: string;
  text: string;
  confidence: number;
  sourceType: 'pattern' | 'ai' | 'team' | 'custom';
  field: 'title' | 'description' | 'acceptance_criteria';
}

export async function generateSuggestions(
  content: string, 
  context: StoryContext
): Promise<Suggestion[]> {
  // 1. Get all applicable patterns
  const patterns = await getRelevantPatterns(context);
  
  // 2. Score patterns by historical success with similar content/context
  const scoredPatterns = await scorePatternsByRelevance(patterns, content, context);
  
  // 3. Generate suggestions using top patterns
  let suggestions = await Promise.all(
    scoredPatterns.slice(0, 5).map(pattern => 
      generateSuggestionFromPattern(pattern, content, context)
    )
  );
  
  // 4. Apply user preference model to rank suggestions
  suggestions = await rankSuggestionsByUserPreference(suggestions, context.userId);
  
  return suggestions;
}

async function getRelevantPatterns(
  context: StoryContext
): Promise<StoredPattern[]> {
  // Get patterns applicable to this context
  // This includes:
  // - Global patterns
  // - Team-specific patterns
  // - Patterns specific to the story type
  // - Custom patterns
  
  const { data, error } = await supabase
    .from('story_patterns')
    .select('*')
    .or(`team_id.is.null,team_id.eq.${context.teamId}`)
    .or(`story_type.is.null,story_type.eq.${context.storyType}`)
    .order('confidence_score', { ascending: false });
    
  if (error) {
    console.error('Error fetching patterns:', error);
    return [];
  }
  
  // Also get custom patterns
  const { data: customData, error: customError } = await supabase
    .from('custom_patterns')
    .select('*')
    .or(`team_id.is.null,team_id.eq.${context.teamId}`)
    .eq('is_active', true);
    
  if (customError) {
    console.error('Error fetching custom patterns:', customError);
    return data as StoredPattern[];
  }
  
  // Combine and format patterns
  return [
    ...data,
    ...customData.map(custom => ({
      id: custom.id,
      name: custom.name,
      description: custom.description,
      pattern_regex: custom.pattern_regex,
      confidence_score: custom.confidence_threshold,
      is_custom: true
    }))
  ];
}

async function scorePatternsByRelevance(
  patterns: StoredPattern[],
  content: string,
  context: StoryContext
): Promise<ScoredPattern[]> {
  // Score patterns based on:
  // 1. Base confidence score
  // 2. Historical performance in similar contexts
  // 3. Content relevance
  
  return Promise.all(patterns.map(async pattern => {
    // Get historical performance
    const historyScore = await getPatternHistoricalScore(pattern.id, context);
    
    // Calculate content relevance (e.g., using text similarity)
    const relevanceScore = calculatePatternRelevance(pattern, content);
    
    // Combine scores
    const finalScore = (
      pattern.confidence_score * 0.4 + 
      historyScore * 0.4 + 
      relevanceScore * 0.2
    );
    
    return {
      ...pattern,
      score: finalScore
    };
  }))
  .then(scoredPatterns => 
    scoredPatterns.sort((a, b) => b.score - a.score)
  );
}

async function generateSuggestionFromPattern(
  pattern: ScoredPattern,
  content: string,
  context: StoryContext
): Promise<Suggestion> {
  // For simple regex patterns, apply the pattern directly
  if (pattern.pattern_regex) {
    const suggestion = applyPatternRegex(pattern, content);
    if (suggestion) {
      return {
        id: uuid(),
        patternId: pattern.id,
        patternName: pattern.name,
        text: suggestion,
        confidence: pattern.score,
        sourceType: pattern.is_custom ? 'custom' : 'pattern',
        field: determineTargetField(pattern, content)
      };
    }
  }
  
  // For AI-assisted patterns, use the AI to generate a suggestion
  return await generateAISuggestion(pattern, content, context);
}

async function rankSuggestionsByUserPreference(
  suggestions: Suggestion[],
  userId: string
): Promise<Suggestion[]> {
  // Get user preference data
  const userPreferences = await getUserSuggestionPreferences(userId);
  
  if (!userPreferences) {
    return suggestions;
  }
  
  // Apply preference weights to adjust ranking
  return suggestions
    .map(suggestion => ({
      ...suggestion,
      score: calculateUserPreferenceScore(suggestion, userPreferences)
    }))
    .sort((a, b) => b.score - a.score);
}
```

#### 2. User Preference Learning

```typescript
// src/features/story-creator/services/userPreferenceService.ts

interface UserPreference {
  userId: string;
  patternPreferences: Record<string, number>; // pattern ID -> preference score
  sourceTypePreferences: Record<string, number>; // sourceType -> preference score
  fieldPreferences: Record<string, number>; // field -> preference score
  lastUpdated: string;
}

export async function getUserSuggestionPreferences(
  userId: string
): Promise<UserPreference | null> {
  // Fetch from database or cache
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
  
  return data;
}

export function calculateUserPreferenceScore(
  suggestion: Suggestion,
  preferences: UserPreference
): number {
  let score = suggestion.confidence;
  
  // Apply pattern-specific preference
  if (preferences.patternPreferences[suggestion.patternId]) {
    score *= (1 + preferences.patternPreferences[suggestion.patternId]);
  }
  
  // Apply source type preference
  if (preferences.sourceTypePreferences[suggestion.sourceType]) {
    score *= (1 + preferences.sourceTypePreferences[suggestion.sourceType]);
  }
  
  // Apply field preference
  if (preferences.fieldPreferences[suggestion.field]) {
    score *= (1 + preferences.fieldPreferences[suggestion.field]);
  }
  
  return score;
}

export async function updateUserPreferenceFromFeedback(
  userId: string,
  feedback: PatternFeedback
): Promise<void> {
  // Get pattern details
  const { data: pattern } = await supabase
    .from('story_patterns')
    .select('*')
    .eq('id', feedback.patternId)
    .single();
    
  if (!pattern) {
    console.error('Pattern not found:', feedback.patternId);
    return;
  }
  
  // Get current preferences
  let preferences = await getUserSuggestionPreferences(userId);
  
  if (!preferences) {
    // Create default preferences
    preferences = {
      userId,
      patternPreferences: {},
      sourceTypePreferences: {},
      fieldPreferences: {},
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Update preference based on feedback
  const adjustmentFactor = feedback.action === 'accepted' ? 0.1 :
                         feedback.action === 'modified' ? 0.05 :
                         -0.1; // rejected
  
  // Update pattern preference
  preferences.patternPreferences[feedback.patternId] = 
    (preferences.patternPreferences[feedback.patternId] || 0) + adjustmentFactor;
    
  // Update source type preference
  preferences.sourceTypePreferences[pattern.source_type] = 
    (preferences.sourceTypePreferences[pattern.source_type] || 0) + adjustmentFactor;
    
  // Update field preference
  preferences.fieldPreferences[pattern.target_field] = 
    (preferences.fieldPreferences[pattern.target_field] || 0) + adjustmentFactor;
    
  // Update last updated timestamp
  preferences.lastUpdated = new Date().toISOString();
  
  // Save updated preferences
  await supabase
    .from('user_preferences')
    .upsert(preferences);
}
```

## 4. Custom Pattern Creation

The Custom Pattern Creation feature will allow teams and individuals to create their own pattern templates that can be used for story suggestions.

### User Interface

#### Pattern Management Page

```tsx
// src/features/story-creator/pages/PatternManagementPage.tsx

const PatternManagementPage: React.FC = () => {
  const [patterns, setPatterns] = useState<CustomPattern[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    fetchCustomPatterns();
  }, []);
  
  const fetchCustomPatterns = async () => {
    const { data, error } = await supabase
      .from('custom_patterns')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching patterns:', error);
      return;
    }
    
    setPatterns(data);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Custom Pattern Management</h1>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Create New Pattern
        </Button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pattern Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Success Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patterns.map(pattern => (
              <tr key={pattern.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{pattern.name}</div>
                  <div className="text-sm text-gray-500">{pattern.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {pattern.team_id ? getTeamName(pattern.team_id) : 'Global'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{pattern.usage_count}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(pattern.success_rate * 100).toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pattern.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pattern.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button 
                    onClick={() => handleEdit(pattern)}
                    variant="link"
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleToggleActive(pattern)}
                    variant="link"
                    className={pattern.is_active 
                      ? 'text-red-600 hover:text-red-900' 
                      : 'text-green-600 hover:text-green-900'
                    }
                  >
                    {pattern.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isCreating && (
        <CustomPatternEditor
          onClose={() => setIsCreating(false)}
          onSave={handleSavePattern}
        />
      )}
    </div>
  );
}
```

#### Pattern Editor Component

```tsx
// src/features/story-creator/components/patterns/CustomPatternEditor.tsx

interface CustomPatternEditorProps {
  initialPattern?: CustomPattern;
  teamId?: string;
  onSave: (pattern: CustomPattern) => void;
  onClose: () => void;
}

const CustomPatternEditor: React.FC<CustomPatternEditorProps> = ({
  initialPattern,
  teamId,
  onSave,
  onClose
}) => {
  const [pattern, setPattern] = useState<CustomPattern>(
    initialPattern || {
      id: '',
      name: '',
      description: '',
      pattern_regex: '',
      example_matches: [],
      team_id: teamId || null,
      confidence_threshold: 0.7,
      created_by: getCurrentUserId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usage_count: 0,
      success_rate: 0.0,
      is_active: true
    }
  );
  
  const [testContent, setTestContent] = useState('');
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updatePattern = (field: keyof CustomPattern, value: any) => {
    setPattern(prev => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toISOString()
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validatePattern = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!pattern.name.trim()) {
      newErrors.name = 'Pattern name is required';
    }
    
    if (!pattern.pattern_regex.trim()) {
      newErrors.pattern_regex = 'Pattern definition is required';
    }
    
    // Validate regex syntax
    try {
      new RegExp(pattern.pattern_regex);
    } catch (e) {
      newErrors.pattern_regex = 'Invalid regular expression syntax';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = () => {
    if (validatePattern()) {
      onSave(pattern);
    }
  };
  
  const testPattern = async () => {
    if (!testContent.trim()) {
      setErrors(prev => ({
        ...prev,
        testContent: 'Please enter some content to test'
      }));
      return;
    }
    
    try {
      const regex = new RegExp(pattern.pattern_regex, 'g');
      const matches = [...testContent.matchAll(regex)
