import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import type { Story } from '../../types/database';

interface DependencyGraphProps {
  story: Story;
  dependencies: Array<{
    id: string;
    story_id: string;
    depends_on_id: string;
    dependency_type: 'blocker' | 'related';
  }>;
  relatedStories: Story[];
}

export function DependencyGraph({ story, dependencies, relatedStories }: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create nodes for all stories
    const nodes = new DataSet([
      {
        id: story.id,
        label: story.pb_title,
        color: '#4F46E5',
        font: { color: '#FFFFFF' },
      },
      ...relatedStories.map((s) => ({
        id: s.id,
        label: s.pb_title,
        color: s.status === 'done' ? '#059669' : '#DC2626',
      })),
    ]);

    // Create edges for dependencies
    const edges = new DataSet(
      dependencies.map((d) => ({
        from: d.story_id,
        to: d.depends_on_id,
        arrows: 'to',
        color: d.dependency_type === 'blocker' ? '#DC2626' : '#6B7280',
        dashes: d.dependency_type === 'related',
      }))
    );

    // Configure network
    const data = { nodes, edges };
    const options = {
      nodes: {
        shape: 'box',
        margin: 10,
        borderWidth: 1,
        shadow: true,
      },
      edges: {
        width: 2,
        smooth: {
          type: 'continuous',
        },
      },
      physics: {
        enabled: true,
        hierarchicalRepulsion: {
          centralGravity: 0.0,
          springLength: 100,
          springConstant: 0.01,
          nodeDistance: 120,
        },
        solver: 'hierarchicalRepulsion',
      },
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
        },
      },
    };

    networkRef.current = new Network(containerRef.current, data, options);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [story, dependencies, relatedStories]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Dependencies</h3>
      </div>
      <div ref={containerRef} className="h-96" />
    </div>
  );
}