# Future Enhancements: Visual Relationship Mapping

This document outlines the planned enhancements for introducing Visual Relationship Mapping to the AI Story/Feature Creator system, providing users with an interactive graph-based visualization of story relationships.

## Overview

The Visual Relationship Mapping feature will provide an interactive visualization showing how stories, features, and other entities are connected, making it easier to understand context, identify gaps, and navigate complex hierarchies.

Key capabilities:
- Interactive visualization of relationships between stories
- Navigation through relationship hierarchies
- Filtering and searching within the relationship graph
- Insight discovery through visual pattern identification

## Architecture

The architecture for the Visual Relationship Mapping feature consists of the following components:

```
┌─────────────────────┐      ┌─────────────────────┐
│ Relationship Data   │      │ Graph Rendering     │
│ Service             │      │ Engine              │
└─────────────────────┘      └─────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────────────────────────────────┐
│           Graph Data Transformer                │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│          Interactive Graph Component             │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│          Graph Interaction Manager               │
└─────────────────────────────────────────────────┘
```

## Key Components

### 1. Graph Data Model

```typescript
// src/features/story-creator/types/graph.ts

export interface GraphNode {
  id: string;
  label: string;
  type: 'story' | 'feature' | 'epic' | 'component' | 'team';
  data: {
    title?: string;
    description?: string;
    status?: string;
    complexity?: number;
    [key: string]: any;
  };
  meta: {
    size?: number;
    color?: string;
    icon?: string;
    selected?: boolean;
    highlighted?: boolean;
  };
}

export interface GraphEdge {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  label?: string;
  type: RelationshipType;
  data?: {
    strength?: number;
    direction?: 'directed' | 'undirected';
    [key: string]: any;
  };
  meta?: {
    width?: number;
    color?: string;
    dashed?: boolean;
    selected?: boolean;
    highlighted?: boolean;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### 2. Relationship Graph Service

```typescript
// src/features/story-creator/services/relationshipGraphService.ts

interface GraphOptions {
  includeComponents?: boolean;
  includeTeams?: boolean;
  maxDepth?: number;
  relationshipTypes?: string[];
  nodeTypes?: string[];
  highlightNode?: string;
  filterByTeam?: string;
  filterByComponent?: string;
}

export async function buildRelationshipGraph(
  rootId: string,
  options: GraphOptions = {}
): Promise<GraphData> {
  // Set defaults for options
  const finalOptions = {
    includeComponents: true,
    includeTeams: true,
    maxDepth: 2,
    relationshipTypes: ['parent-child', 'depends-on', 'related-to', 'similar-to'],
    nodeTypes: ['story', 'feature', 'epic'],
    ...options
  };
  
  // Get root node data
  const rootNode = await getEntityById(rootId);
  if (!rootNode) {
    throw new Error(`Node with ID ${rootId} not found`);
  }
  
  // Build initial graph with root node
  const graph: GraphData = {
    nodes: [{
      id: rootNode.id,
      label: rootNode.title,
      type: rootNode.type,
      data: rootNode,
      meta: {
        size: 20,
        color: getNodeColor(rootNode.type),
        icon: getNodeIcon(rootNode.type),
        selected: true,
        highlighted: options.highlightNode === rootNode.id
      }
    }],
    edges: []
  };
  
  // Recursively add nodes and edges
  await expandNode(rootNode.id, graph, finalOptions, 0);
  
  // Apply any post-processing
  applyGraphStyles(graph, finalOptions);
  
  return graph;
}

async function expandNode(
  nodeId: string,
  graph: GraphData,
  options: GraphOptions,
  currentDepth: number
): Promise<void> {
  // Stop if we've reached max depth
  if (currentDepth >= options.maxDepth) {
    return;
  }
  
  // Get all relationships for the node
  const relationships = await getRelationships(nodeId, options.relationshipTypes);
  
  // Process each relationship
  for (const relationship of relationships) {
    const targetId = relationship.targetId;
    const sourceId = relationship.sourceId;
    
    // Skip if relationship is not from our node
    const isOutgoing = sourceId === nodeId;
    const relatedNodeId = isOutgoing ? targetId : sourceId;
    
    // Skip if we already have this node
    if (graph.nodes.some(n => n.id === relatedNodeId)) {
      // Just add the edge if needed
      if (!graph.edges.some(e => 
        (e.source === sourceId && e.target === targetId) || 
        (e.source === targetId && e.target === sourceId)
      )) {
        addEdgeToGraph(graph, relationship);
      }
      continue;
    }
    
    // Get the related node data
    const relatedNode = await getEntityById(relatedNodeId);
    if (!relatedNode) continue;
    
    // Skip if node type is not included
    if (!options.nodeTypes.includes(relatedNode.type)) {
      continue;
    }
    
    // Add the node to the graph
    graph.nodes.push({
      id: relatedNode.id,
      label: relatedNode.title,
      type: relatedNode.type,
      data: relatedNode,
      meta: {
        size: 15,
        color: getNodeColor(relatedNode.type),
        icon: getNodeIcon(relatedNode.type),
        highlighted: options.highlightNode === relatedNode.id
      }
    });
    
    // Add the edge to the graph
    addEdgeToGraph(graph, relationship);
    
    // Recursively expand this node
    await expandNode(relatedNodeId, graph, options, currentDepth + 1);
  }
  
  // Add component connections if requested
  if (options.includeComponents) {
    await addComponentConnections(nodeId, graph, options);
  }
  
  // Add team connections if requested
  if (options.includeTeams) {
    await addTeamConnections(nodeId, graph, options);
  }
}

function addEdgeToGraph(graph: GraphData, relationship: Relationship): void {
  graph.edges.push({
    id: relationship.id,
    source: relationship.sourceId,
    target: relationship.targetId,
    label: getEdgeLabel(relationship.type),
    type: relationship.type,
    data: {
      strength: relationship.strength,
      direction: getEdgeDirection(relationship.type)
    },
    meta: {
      width: getEdgeWidth(relationship.strength),
      color: getEdgeColor(relationship.type),
      dashed: relationship.type === 'similar-to'
    }
  });
}

// Helper functions for determining graph styling
function getNodeColor(type: string): string {
  const colorMap = {
    'story': '#60A5FA', // blue-400
    'feature': '#34D399', // green-400
    'epic': '#F87171', // red-400
    'component': '#A78BFA', // purple-400
    'team': '#FBBF24' // amber-400
  };
  
  return colorMap[type] || '#9CA3AF'; // gray-400 default
}

function getNodeIcon(type: string): string {
  const iconMap = {
    'story': 'file-text',
    'feature': 'package',
    'epic': 'target',
    'component': 'code',
    'team': 'users'
  };
  
  return iconMap[type] || 'circle';
}

function getEdgeColor(type: string): string {
  const colorMap = {
    'parent-child': '#4B5563', // gray-600
    'depends-on': '#EF4444', // red-500
    'related-to': '#3B82F6', // blue-500
    'similar-to': '#8B5CF6', // violet-500
    'part-of': '#10B981' // emerald-500
  };
  
  return colorMap[type] || '#9CA3AF'; // gray-400 default
}

function getEdgeLabel(type: string): string {
  return type.replace(/-/g, ' ');
}

function getEdgeWidth(strength: number): number {
  return 1 + (strength * 3); // Scale from 1 to 4 based on strength
}

function getEdgeDirection(type: string): 'directed' | 'undirected' {
  return ['parent-child', 'depends-on', 'part-of'].includes(type) 
    ? 'directed' 
    : 'undirected';
}
```

### 3. Interactive Graph Component

```tsx
// src/features/story-creator/components/RelationshipGraph.tsx

import React, { useEffect, useRef, useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { buildRelationshipGraph } from '../services/relationshipGraphService';
import { GraphData, GraphNode, GraphEdge } from '../types/graph';
import { Card, Dropdown, Tooltip, Button } from '../../ui';

interface RelationshipGraphProps {
  rootEntityId: string;
  onNodeSelect?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  initialOptions?: GraphOptions;
  height?: number;
  width?: number;
}

const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  rootEntityId,
  onNodeSelect,
  onNodeDoubleClick,
  initialOptions = {},
  height = 600,
  width = '100%'
}) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [options, setOptions] = useState<GraphOptions>(initialOptions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  const graphRef = useRef();
  
  // Load graph data when root entity or options change
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await buildRelationshipGraph(rootEntityId, options);
        setGraphData(data);
      } catch (err) {
        console.error('Error loading graph data:', err);
        setError('Failed to load relationship graph');
      } finally {
        setLoading(false);
      }
    };
    
    loadGraphData();
  }, [rootEntityId, options]);
  
  // Handle node select
