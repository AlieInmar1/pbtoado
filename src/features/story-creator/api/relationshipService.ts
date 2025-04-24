/**
 * Relationship Service
 * 
 * This service handles API operations related to story relationships,
 * patterns, and contextual data. It provides methods for creating, retrieving,
 * and analyzing relationships between stories, features, and components.
 */

import { supabase } from '../../../lib/supabase';
import { 
  Relationship, 
  EntityType,
  RelationshipType,
  StoryPattern,
  DetectedPattern,
  FeedbackData,
  ContextIntelligenceResult,
  ContextParams
} from '../types';
import { extractPatternsFromContent } from '../utils/promptBuilder';

/**
 * Creates a new relationship between two entities
 * @param sourceId - Source entity ID
 * @param sourceType - Source entity type
 * @param targetId - Target entity ID
 * @param targetType - Target entity type
 * @param relationshipType - Type of relationship
 * @param strength - Relationship strength (0-1)
 * @param metadata - Additional metadata about the relationship
 * @returns The created relationship
 */
export async function createRelationship(
  sourceId: string,
  sourceType: EntityType,
  targetId: string, 
  targetType: EntityType,
  relationshipType: RelationshipType,
  strength: number = 0.5,
  metadata: Record<string, any> = {}
): Promise<Relationship> {
  try {
    const { data, error } = await supabase
      .from('story_relationships')
      .insert({
        source_id: sourceId,
        source_type: sourceType,
        target_id: targetId,
        target_type: targetType,
        relationship_type: relationshipType,
        strength,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating relationship:', error);
      throw error;
    }

    return {
      id: data.id,
      sourceId: data.source_id,
      sourceType: data.source_type,
      targetId: data.target_id,
      targetType: data.target_type,
      relationshipType: data.relationship_type,
      strength: data.strength,
      metadata: data.metadata,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error in createRelationship:', error);
    throw error;
  }
}

/**
 * Gets relationships for a specific entity
 * @param entityId - ID of the entity
 * @param entityType - Type of the entity
 * @param relationshipType - Optional filter for relationship type
 * @returns Array of relationships
 */
export async function getRelationships(
  entityId: string,
  entityType: EntityType,
  relationshipType?: RelationshipType
): Promise<Relationship[]> {
  try {
    // Build the query
    let query = supabase
      .from('story_relationships')
      .select('*')
      .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);
    
    // Add filters if provided
    if (entityType) {
      query = query.or(`source_type.eq.${entityType},target_type.eq.${entityType}`);
    }
    
    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error getting relationships:', error);
      throw error;
    }

    // Map the data to the Relationship interface
    return data.map(item => ({
      id: item.id,
      sourceId: item.source_id,
      sourceType: item.source_type,
      targetId: item.target_id,
      targetType: item.target_type,
      relationshipType: item.relationship_type,
      strength: item.strength,
      metadata: item.metadata,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Error in getRelationships:', error);
    throw error;
  }
}

/**
 * Deletes a relationship
 * @param relationshipId - ID of the relationship to delete
 * @returns Success status
 */
export async function deleteRelationship(relationshipId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('story_relationships')
      .delete()
      .eq('id', relationshipId);

    if (error) {
      console.error('Error deleting relationship:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteRelationship:', error);
    throw error;
  }
}

/**
 * Automatically discovers and creates relationships based on content analysis
 * @param storyId - ID of the story to analyze
 * @param workspaceId - ID of the workspace
 * @returns Array of created relationships
 */
export async function discoverRelationships(storyId: string, workspaceId: string): Promise<Relationship[]> {
  try {
    // Step 1: Get the story content
    const { data: storyData, error: storyError } = await supabase
      .from('grooming_stories')
      .select('title, description, parent_story_id')
      .eq('id', storyId)
      .single();

    if (storyError) {
      console.error('Error fetching story:', storyError);
      throw storyError;
    }

    // Step 2: Find potential relationships based on content similarity
    const { data: otherStories, error: storiesError } = await supabase
      .from('grooming_stories')
      .select('id, title, description')
      .neq('id', storyId)
      .eq('workspace_id', workspaceId)
      .limit(50); // Limit to 50 stories for performance

    if (storiesError) {
      console.error('Error fetching other stories:', storiesError);
      throw storiesError;
    }

    const createdRelationships: Relationship[] = [];

    // Step 3: If there's a parent story, create a parent-child relationship
    if (storyData.parent_story_id) {
      const parentRelationship = await createRelationship(
        storyData.parent_story_id,
        'story',
        storyId,
        'story',
        'parent-child',
        0.9,
        { discoveredAutomatically: true }
      );
      createdRelationships.push(parentRelationship);
    }

    // Step 4: Analyze content similarity with other stories
    for (const otherStory of otherStories) {
      // Skip if this is the parent story (we already created that relationship)
      if (otherStory.id === storyData.parent_story_id) continue;

      const similarityScore = calculateSimilarity(
        `${storyData.title} ${storyData.description}`,
        `${otherStory.title} ${otherStory.description}`
      );

      // Only create relationships for significant similarity
      if (similarityScore > 0.5) {
        const relationship = await createRelationship(
          storyId,
          'story',
          otherStory.id,
          'story',
          'similar-to',
          similarityScore,
          { discoveredAutomatically: true }
        );
        createdRelationships.push(relationship);
      }
    }

    return createdRelationships;
  } catch (error) {
    console.error('Error in discoverRelationships:', error);
    throw error;
  }
}

/**
 * Creates a new pattern
 * @param patternName - Name of the pattern
 * @param patternType - Type of pattern
 * @param patternData - Pattern data
 * @param examples - Example texts
 * @param workspaceId - Workspace ID
 * @returns The created pattern
 */
export async function createPattern(
  patternName: string,
  patternType: string,
  patternData: any,
  examples: string[],
  workspaceId: string
): Promise<StoryPattern> {
  try {
    const { data, error } = await supabase
      .from('story_patterns')
      .insert({
        pattern_name: patternName,
        pattern_type: patternType,
        pattern_data: patternData,
        examples,
        workspace_id: workspaceId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pattern:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.pattern_name,
      type: data.pattern_type,
      data: data.pattern_data,
      examples: data.examples,
      frequency: data.frequency,
      successRate: data.success_rate,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error in createPattern:', error);
    throw error;
  }
}

/**
 * Gets patterns for a workspace
 * @param workspaceId - ID of the workspace
 * @param patternType - Optional filter for pattern type
 * @returns Array of patterns
 */
export async function getPatterns(workspaceId: string, patternType?: string): Promise<StoryPattern[]> {
  try {
    // Build the query
    let query = supabase
      .from('story_patterns')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    // Add filter if provided
    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error getting patterns:', error);
      throw error;
    }

    // Map the data to the StoryPattern interface
    return data.map(item => ({
      id: item.id,
      name: item.pattern_name,
      type: item.pattern_type,
      data: item.pattern_data,
      examples: item.examples,
      frequency: item.frequency,
      successRate: item.success_rate,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Error in getPatterns:', error);
    throw error;
  }
}

/**
 * Records feedback on a pattern usage
 * @param patternId - ID of the pattern
 * @param storyId - ID of the story
 * @param success - Whether the pattern was successfully applied
 * @param feedback - Optional feedback
 * @param userId - Optional user ID
 * @param workspaceId - Workspace ID
 * @returns Success status
 */
export async function recordPatternFeedback(
  patternId: string,
  storyId: string,
  success: boolean,
  feedback?: string,
  userId?: string,
  workspaceId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pattern_usage')
      .insert({
        pattern_id: patternId,
        story_id: storyId,
        success,
        feedback,
        user_id: userId,
        workspace_id: workspaceId
      });

    if (error) {
      console.error('Error recording pattern feedback:', error);
      throw error;
    }

    // Update pattern statistics
    await updatePatternStatistics(patternId);

    return true;
  } catch (error) {
    console.error('Error in recordPatternFeedback:', error);
    throw error;
  }
}

/**
 * Analyzes story content to detect patterns
 * @param content - Story content to analyze
 * @param workspaceId - Workspace ID to fetch known patterns
 * @returns Array of detected patterns
 */
export async function detectPatterns(content: string, workspaceId: string): Promise<DetectedPattern[]> {
  try {
    // Get known patterns from the database
    const patterns = await getPatterns(workspaceId);
    
    // First, use the built-in pattern detection
    const detectedPatterns = extractPatternsFromContent(content);
    
    // TODO: Enhance with AI-based pattern detection using Edge Functions
    // For now, we're using the local pattern detection
    
    return detectedPatterns;
  } catch (error) {
    console.error('Error in detectPatterns:', error);
    throw error;
  }
}

/**
 * Gets context intelligence for entity
 * @param params - Context parameters
 * @returns Context intelligence result
 */
export async function getContextIntelligence(
  params: ContextParams
): Promise<ContextIntelligenceResult> {
  try {
    const result: ContextIntelligenceResult = {};
    
    // Get parent context if parent ID is provided
    if (params.parentId) {
      const { data: parentData, error: parentError } = await supabase
        .from('grooming_stories')
        .select('id, title, description, story_type')
        .eq('id', params.parentId)
        .single();
        
      if (!parentError && parentData) {
        result.parentContext = {
          id: parentData.id,
          title: parentData.title,
          description: parentData.description,
          type: parentData.story_type
        };
      }
    }
    
    // Get component context if component ID is provided
    if (params.componentId) {
      const { data: componentData, error: componentError } = await supabase
        .from('productboard_components')
        .select('id, name')
        .eq('productboard_id', params.componentId)
        .single();
        
      if (!componentError && componentData) {
        // Get component statistics
        const { data: statsData } = await supabase
          .from('grooming_stories')
          .select('id, complexity')
          .eq('component_id', params.componentId);
        
        // Ensure statsData is defined and handle it safely
        const storyCount = statsData?.length || 0;
        const averageComplexity = statsData ? 
          statsData.reduce((sum, story) => sum + (story.complexity || 0), 0) / Math.max(storyCount, 1) : 
          0;
        
        result.componentContext = {
          id: componentData.id,
          name: componentData.name,
          statistics: {
            storyCount,
            averageComplexity
          }
        };
      }
    }
    
    // Get sibling context if entityId and entityType are provided
    if (params.entityId && params.entityType === 'story' && params.parentId) {
      const { data: siblingData, error: siblingError } = await supabase
        .from('grooming_stories')
        .select('id, title, story_type')
        .eq('parent_story_id', params.parentId)
        .neq('id', params.entityId)
        .limit(10);
        
      if (!siblingError && siblingData && siblingData.length > 0) {
        result.siblingContext = siblingData.map(sibling => ({
          id: sibling.id,
          title: sibling.title,
          type: sibling.story_type
        }));
      }
    }
    
    // Get pattern suggestions if requested
    if (params.includePatterns) {
      const patterns = await getPatterns(params.workspace_id);
      
      // Filter to the top 5 patterns by success rate
      const topPatterns = patterns
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);
        
      result.suggestedPatterns = topPatterns.map(pattern => ({
        id: pattern.id,
        name: pattern.name,
        type: pattern.type,
        frequency: pattern.frequency,
        successRate: pattern.successRate
      }));
    }
    
    return result;
  } catch (error) {
    console.error('Error in getContextIntelligence:', error);
    throw error;
  }
}

/**
 * Records AI suggestion feedback
 * @param targetId - ID of the target entity
 * @param targetType - Type of the target entity
 * @param fieldName - Field that received the suggestion
 * @param suggestion - The suggestion text
 * @param accepted - Whether the suggestion was accepted
 * @param confidence - Confidence level
 * @param userId - Optional user ID
 * @param workspaceId - Workspace ID
 * @returns Success status
 */
export async function recordSuggestionFeedback(
  targetId: string,
  targetType: EntityType,
  fieldName: string,
  suggestion: string,
  accepted: boolean,
  confidence: number = 0.5,
  userId?: string,
  workspaceId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_suggestion_feedback')
      .insert({
        target_id: targetId,
        target_type: targetType,
        field_name: fieldName,
        suggestion,
        accepted,
        confidence,
        user_id: userId,
        workspace_id: workspaceId
      });

    if (error) {
      console.error('Error recording suggestion feedback:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in recordSuggestionFeedback:', error);
    throw error;
  }
}

// Helper function to calculate text similarity (simple implementation)
function calculateSimilarity(text1: string, text2: string): number {
  // Convert to lowercase and remove special characters
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '');
  
  const normalizedText1 = normalize(text1);
  const normalizedText2 = normalize(text2);
  
  // Create word sets
  const words1 = new Set(normalizedText1.split(/\s+/));
  const words2 = new Set(normalizedText2.split(/\s+/));
  
  // Count shared words
  let sharedWords = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      sharedWords++;
    }
  }
  
  // Calculate Jaccard similarity
  const unionSize = words1.size + words2.size - sharedWords;
  return unionSize === 0 ? 0 : sharedWords / unionSize;
}

// Helper function to update pattern statistics
async function updatePatternStatistics(patternId: string): Promise<void> {
  try {
    // Get all usage records for this pattern
    const { data, error } = await supabase
      .from('pattern_usage')
      .select('success')
      .eq('pattern_id', patternId);
      
    if (error) {
      console.error('Error fetching pattern usage:', error);
      return;
    }
    
    // Ensure data is defined
    if (!data) {
      console.error('No data returned from pattern usage query');
      return;
    }
    
    // Calculate new statistics
    const frequency = data.length;
    let successCount = 0;
    
    for (const record of data) {
      if (record.success) {
        successCount++;
      }
    }
    
    const successRate = frequency > 0 ? successCount / frequency : 0;
    
    // Update the pattern
    await supabase
      .from('story_patterns')
      .update({
        frequency,
        success_rate: successRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', patternId);
      
  } catch (error) {
    console.error('Error updating pattern statistics:', error);
  }
}
