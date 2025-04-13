import React, { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { toast } from 'sonner';
import { PageHeader } from '../components/admin/PageHeader';
import { ProductBoardInitiativeExplorer } from '../components/productboard/ProductBoardInitiativeExplorer';
import type { Configuration } from '../types/database';

export function ProductBoardInitiativeHierarchy() {
  const { db } = useDatabase();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Partial<Configuration>>({});

  useEffect(() => {
    if (!db) return;
    const workspaceId = '904559d5-3948-43ae-8f6f-eb9bc3b20c85';

    async function loadConfig() {
      try {
        const config = await db?.configurations.getByWorkspace(workspaceId);
        setConfig(config || {});
      } catch (error) {
        console.error('Error loading configuration:', error);
        toast.error('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [db]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="ProductBoard Initiative Hierarchy"
        description="Explore ProductBoard initiatives and their linked features"
      />
      
      <div className="flex justify-end mb-4 space-x-2">
        <a
          href="/admin/productboard"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          View Features
        </a>
        <a
          href="/admin/productboard/initiatives"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          View Initiatives
        </a>
        <a
          href="/admin/productboard/hierarchy"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Unified Explorer
        </a>
      </div>
      
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          This page allows you to explore the hierarchy of ProductBoard initiatives and their linked features. 
          Click on the arrow next to an initiative to view its linked features, and click on a feature to see its details.
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ProductBoardInitiativeExplorer apiKey={config.productboard_api_key || undefined} />
      )}
    </div>
  );
}
