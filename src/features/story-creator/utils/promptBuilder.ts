/**
 * Prompt Builder Utility
 * 
 * This utility provides functions for building AI prompts that incorporate
 * context, patterns, and examples to generate high-quality story content
 * and suggestions.
 */

import { PromptContext, PromptOptions, DetectedPattern } from '../types';

/**
 * Builds an AI prompt incorporating context and patterns for generating story content
 * @param basePrompt - The core instruction for the AI
 * @param context - Contextual information to include in the prompt
 * @param options - Configuration options for prompt generation
 * @returns Formatted prompt string
 */
export function buildPrompt(
  basePrompt: string,
  context: PromptContext,
  options: PromptOptions = {}
): string {
  const {
    includePatterns = true,
    includeContext = true,
    includeExamples = true,
    maxSiblings = 3,
    maxExamples = 2,
    format = 'json'
  } = options;

  // Start with base prompt and append the primary content
  let prompt = `${basePrompt}\n\n`;

  // Add existing story information if available
  if (context.title || context.description || context.acceptanceCriteria) {
    prompt += "Here is the current story information:\n";
    
    if (context.title) {
      prompt += `Title: ${context.title}\n`;
    }
    
    if (context.description) {
      prompt += `Description: ${context.description}\n\n`;
    }
    
    if (context.acceptanceCriteria && context.acceptanceCriteria.length > 0) {
      prompt += "Acceptance Criteria:\n";
      context.acceptanceCriteria.forEach((criterion, index) => {
        prompt += `${index + 1}. ${criterion}\n`;
      });
      prompt += "\n";
    }
  }

  // Add metadata information
  if (context.hierarchyLevel) {
    prompt += `Hierarchy Level: ${context.hierarchyLevel}\n`;
  }
  
  if (context.componentName) {
    prompt += `Component: ${context.componentName}\n`;
  }

  // Add parent context if available and requested
  if (includeContext && context.parentDetails) {
    prompt += "\nParent Information:\n";
    prompt += `Title: ${context.parentDetails.title}\n`;
    
    if (context.parentDetails.description) {
      prompt += `Description: ${context.parentDetails.description}\n`;
    }
    
    prompt += "\n";
  }

  // Add sibling context if available and requested
  if (includeContext && context.siblings && context.siblings.length > 0) {
    const limitedSiblings = context.siblings.slice(0, maxSiblings);
    
    prompt += "\nRelated Stories:\n";
    limitedSiblings.forEach((sibling, index) => {
      prompt += `${index + 1}. ${sibling.title}\n`;
      if (sibling.description) {
        const shortDescription = truncateText(sibling.description, 100);
        prompt += `   ${shortDescription}\n`;
      }
    });
    
    prompt += "\n";
  }

  // Add pattern information if available and requested
  if (includePatterns && context.patterns && context.patterns.length > 0) {
    prompt += "\nDetected Patterns:\n";
    context.patterns.forEach((pattern, index) => {
      prompt += `${index + 1}. ${pattern.patternName} (${pattern.patternType}) - Confidence: ${Math.round(pattern.confidence * 100)}%\n`;
      if (pattern.suggestedCompletion) {
        prompt += `   Suggestion: ${pattern.suggestedCompletion}\n`;
      }
    });
    
    prompt += "\n";
  }

  // Add formatting instructions
  prompt += formatInstructions(format);

  return prompt;
}

/**
 * Builds a specialized prompt specifically for analyzing relationships
 * @param storyData - The story data to analyze
 * @param parentData - The parent story/feature data
 * @param siblingData - Array of sibling stories
 * @returns Formatted relationship analysis prompt
 */
export function buildRelationshipAnalysisPrompt(
  storyData: { title: string; description?: string },
  parentData?: { title: string; description?: string },
  siblingData: Array<{ title: string; description?: string }> = []
): string {
  let prompt = `Please analyze the relationships between the following stories and identify patterns, dependencies, and connections.\n\n`;
  
  prompt += `Main Story:\nTitle: ${storyData.title}\n`;
  if (storyData.description) {
    prompt += `Description: ${storyData.description}\n\n`;
  }
  
  if (parentData) {
    prompt += `Parent Story:\nTitle: ${parentData.title}\n`;
    if (parentData.description) {
      prompt += `Description: ${parentData.description}\n\n`;
    }
  }
  
  if (siblingData.length > 0) {
    prompt += `Related Stories:\n`;
    siblingData.forEach((sibling, index) => {
      prompt += `${index + 1}. Title: ${sibling.title}\n`;
      if (sibling.description) {
        prompt += `   Description: ${truncateText(sibling.description, 100)}\n`;
      }
    });
    prompt += "\n";
  }
  
  prompt += `Please identify:\n`;
  prompt += `1. Dependencies between the main story and the others\n`;
  prompt += `2. Similarities and patterns across the stories\n`;
  prompt += `3. Potential gaps or inconsistencies\n`;
  prompt += `4. Suggested improvements based on the relationship analysis\n\n`;
  
  prompt += `Provide your analysis in JSON format with the following structure:
{
  "dependencies": [
    {"type": "depends-on", "target": "Story Title", "reason": "Explanation"}
  ],
  "similarities": [
    {"pattern": "Pattern Name", "stories": ["Story Title 1", "Story Title 2"], "description": "Explanation"}
  ],
  "gaps": [
    {"description": "Gap description", "suggestion": "How to address it"}
  ],
  "improvements": [
    {"field": "title|description|acceptance_criteria", "suggestion": "Suggested improvement", "reason": "Why this would be better"}
  ]
}`;

  return prompt;
}

/**
 * Builds a prompt for detecting patterns in story content
 * @param content - Story content to analyze
 * @param knownPatterns - Array of known patterns to look for
 * @returns Pattern detection prompt
 */
export function buildPatternDetectionPrompt(
  content: string,
  knownPatterns: Array<{name: string, description: string}> = []
): string {
  let prompt = `Please analyze the following story content and identify any recurring patterns or templates it follows.\n\n`;
  
  prompt += `Content to analyze:\n${content}\n\n`;
  
  if (knownPatterns.length > 0) {
    prompt += `Check for these specific patterns:\n`;
    knownPatterns.forEach((pattern, index) => {
      prompt += `${index + 1}. ${pattern.name}: ${pattern.description}\n`;
    });
    prompt += "\n";
  }
  
  prompt += `For each pattern you identify, please provide:
1. Pattern name
2. Confidence level (0-1)
3. Matches in the content
4. Suggested completion or enhancement based on the pattern

Provide your analysis in JSON format with the following structure:
{
  "detectedPatterns": [
    {
      "patternName": "Pattern name",
      "patternType": "story_structure|acceptance_criteria|description_format",
      "confidence": 0.95,
      "matches": ["Text that matches the pattern"],
      "suggestedCompletion": "Suggestion based on pattern"
    }
  ]
}`;

  return prompt;
}

/**
 * Helper function to get format-specific instructions
 * @param format - Desired output format
 * @returns Formatting instructions
 */
function formatInstructions(format: 'json' | 'markdown' | 'text'): string {
  switch (format) {
    case 'json':
      return `Please provide your response in JSON format with the following structure:
{
  "title": "Generated or improved title",
  "description": "Generated or improved description",
  "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"],
  "technicalConsiderations": ["Consideration 1", "Consideration 2"],
  "complexity": 3,
  "suggestedFields": {
    "fieldName": "suggestedValue"
  },
  "explanation": "Brief explanation of your recommendations"
}`;
    
    case 'markdown':
      return `Please format your response in markdown with the following sections:
# Title
[Generated or improved title]

## Description
[Generated or improved description]

## Acceptance Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Technical Considerations
- [Consideration 1]
- [Consideration 2]

## Explanation
[Brief explanation of your recommendations]`;
    
    case 'text':
    default:
      return `Please provide your response in plain text with clear section headers.`;
  }
}

/**
 * Helper function to truncate text to a specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Extracts patterns from a given story content
 * @param content - The story content to analyze
 * @returns Array of detected patterns
 */
export function extractPatternsFromContent(content: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  
  // Example pattern: User story format ("As a [user], I want to [action] so that [benefit]")
  const userStoryRegex = /As an? ([^,]+), I want to ([^,]+) so that ([^,.]+)/gi;
  const userStoryMatches = Array.from(content.matchAll(userStoryRegex));
  
  if (userStoryMatches.length > 0) {
    patterns.push({
      patternType: 'story_structure',
      patternName: 'User Story Format',
      confidence: 0.9,
      matches: userStoryMatches.map(match => match[0]),
      suggestedCompletion: 'Continue using the "As a [user], I want to [action] so that [benefit]" format for consistency'
    });
  }
  
  // Example pattern: Acceptance criteria using Given/When/Then
  const gwt = /Given ([^,\.]+), When ([^,\.]+), Then ([^,\.]+)/gi;
  const gwtMatches = Array.from(content.matchAll(gwt));
  
  if (gwtMatches.length > 0) {
    patterns.push({
      patternType: 'acceptance_criteria',
      patternName: 'Given-When-Then Format',
      confidence: 0.85,
      matches: gwtMatches.map(match => match[0]),
      suggestedCompletion: 'Continue using Given/When/Then format for acceptance criteria'
    });
  }
  
  // Example pattern: Technical implementation details
  const techDetails = /implement using ([^,\.]+)/gi;
  const techMatches = Array.from(content.matchAll(techDetails));
  
  if (techMatches.length > 0) {
    patterns.push({
      patternType: 'implementation_details',
      patternName: 'Technical Implementation',
      confidence: 0.7,
      matches: techMatches.map(match => match[0]),
      suggestedCompletion: 'Add more specific technical requirements or constraints'
    });
  }
  
  return patterns;
}
