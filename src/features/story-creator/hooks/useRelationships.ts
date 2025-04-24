/**
 * Relationship Hook
 * 
 * This hook provides access to relationship and pattern functionality for the story creator,
 * including context intelligence, pattern detection, and relationship management.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  Relationship, 
  EntityType, 
  RelationshipType,
  DetectedPattern,
  ContextIntelligenceResult,
  ContextParams 
} from '../types';
import { 
  getRelationships, 
  createRelationship, 
  deleteRelationship,
  detectPatterns,
  getContextIntelligence,
  discoverRelationships
} from '../api/relationshipService';

export interface UseRelationshipsResult {
  // Relationship state
  relationships: Relationship[];
  isLoadingRelationships: boolean;
  relationshipError: Error | null;
  
  // Pattern state
  detectedPatterns: DetectedPattern[];
  isDetectingPatterns: boolean;
  patternError: Error | null;
  
  // Context state
  contextIntelligence: ContextIntelligenceResult | null;
  isLoadingContext: boolean;
  contextError: Error | null;
  
  // Actions
  fetchRelationships: (entityId: string, entityType: EntityType, relationshipType?: RelationshipType) => Promise<void>;
  addRelationship: (sourceId: string, sourceType: EntityType, targetId: string, targetType: EntityType, relationshipType: RelationshipType, strength?: number) => Promise<Relationship | null>;
  removeRelationship: (relationshipId: string) => Promise<boolean>;
  findPatterns: (content: string, workspaceId: string) => Promise<DetectedPattern[]>;
  getContext: (params: ContextParams) => Promise<void>;
  autoDiscover: (storyId: string, workspaceId: string) => Promise<Relationship[]>;
}

export function useRelationships(): UseRelationshipsResult {
  // Relationship state
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState<boolean>(false);
  const [relationshipError, setRelationshipError] = useState<Error | null>(null);
  
  // Pattern state
  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[]>([]);
  const [isDetectingPatterns, setIsDetectingPatterns] = useState<boolean>(false);
  const [patternError, setPatternError] = useState<Error | null>(null);
  
  // Context state
  const [contextIntelligence, setContextIntelligence] = useState<ContextIntelligenceResult | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState<boolean>(false);
  const [contextError, setContextError] = useState<Error | null>(null);
  
  /**
   * Fetches relationships for a specific entity
   */
  const fetchRelationships = useCallback(async (
    entityId: string, 
    entityType: EntityType,
    relationshipType?: RelationshipType
  ) => {
    setIsLoadingRelationships(true);
    setRelationshipError(null);
    
    try {
      const result = await getRelationships(entityId, entityType, relationshipType);
      setRelationships(result);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      setRelationshipError(error instanceof Error ? error : new Error('Failed to fetch relationships'));
    } finally {
      setIsLoadingRelationships(false);
    }
  }, []);
  
  /**
   * Adds a new relationship
   */
  const addRelationship = useCallback(async (
    sourceId: string, 
    sourceType: EntityType, 
    targetId: string, 
    targetType: EntityType, 
    relationshipType: RelationshipType,
    strength: number = 0.5
  ) => {
    setRelationshipError(null);
    
    try {
      const result = await createRelationship(
        sourceId, 
        sourceType, 
        targetId, 
        targetType, 
        relationshipType, 
        strength
      );
      
      // Update the relationships list
      setRelationships(prev => [...prev, result]);
      
      return result;
    } catch (error) {
      console.error('Error adding relationship:', error);
      setRelationshipError(error instanceof Error ? error : new Error('Failed to add relationship'));
      return null;
    }
  }, []);
  
  /**
   * Removes a relationship
   */
  const removeRelationship = useCallback(async (relationshipId: string) => {
    setRelationshipError(null);
    
    try {
      const success = await deleteRelationship(relationshipId);
      
      if (success) {
        // Remove from the relationships list
        setRelationships(prev => prev.filter(r => r.id !== relationshipId));
      }
      
      return success;
    } catch (error) {
      console.error('Error removing relationship:', error);
      setRelationshipError(error instanceof Error ? error : new Error('Failed to remove relationship'));
      return false;
    }
  }, []);
  
  /**
   * Detects patterns in content
   */
  const findPatterns = useCallback(async (content: string, workspaceId: string) => {
    setIsDetectingPatterns(true);
    setPatternError(null);
    
    try {
      const patterns = await detectPatterns(content, workspaceId);
      setDetectedPatterns(patterns);
      return patterns;
    } catch (error) {
      console.error('Error detecting patterns:', error);
      setPatternError(error instanceof Error ? error : new Error('Failed to detect patterns'));
      return [];
    } finally {
      setIsDetectingPatterns(false);
    }
  }, []);
  
  /**
   * Gets context intelligence for an entity
   */
  const getContext = useCallback(async (params: ContextParams) => {
    setIsLoadingContext(true);
    setContextError(null);
    
    try {
      const result = await getContextIntelligence(params);
      setContextIntelligence(result);
    } catch (error) {
      console.error('Error getting context intelligence:', error);
      setContextError(error instanceof Error ? error : new Error('Failed to get context intelligence'));
    } finally {
      setIsLoadingContext(false);
    }
  }, []);
  
  /**
   * Automatically discovers relationships
   */
  const autoDiscover = useCallback(async (storyId: string, workspaceId: string) => {
    setIsLoadingRelationships(true);
    setRelationshipError(null);
    
    try {
      const result = await discoverRelationships(storyId, workspaceId);
      
      // Update the relationships list
      setRelationships(prev => {
        // Filter out any that might be duplicates
        const existingIds = new Set(result.map(r => r.id));
        const filtered = prev.filter(r => !existingIds.has(r.id));
        return [...filtered, ...result];
      });
      
      return result;
    } catch (error) {
      console.error('Error auto-discovering relationships:', error);
      setRelationshipError(error instanceof Error ? error : new Error('Failed to auto-discover relationships'));
      return [];
    } finally {
      setIsLoadingRelationships(false);
    }
  }, []);
  
  return {
    // State
    relationships,
    isLoadingRelationships,
    relationshipError,
    detectedPatterns,
    isDetectingPatterns,
    patternError,
    contextIntelligence,
    isLoadingContext,
    contextError,
    
    // Actions
    fetchRelationships,
    addRelationship,
    removeRelationship,
    findPatterns,
    getContext,
    autoDiscover
  };
}
