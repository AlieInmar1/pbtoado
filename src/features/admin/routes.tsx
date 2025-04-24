import React from 'react';
import { AdminPage } from './components/AdminPage';
import { HierarchyMappingEditor } from './components/HierarchyMappingEditor';
import { MappingResultsPage } from './components/mapping-results/MappingResultsPage';
import { SystemConfigEditor } from './components/SystemConfigEditor';

// This file defines the routes for the admin feature module

// Define routes for the admin feature
export const adminRoutes = [
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/admin/hierarchy-mapping',
    element: <HierarchyMappingEditor />,
  },
  {
    path: '/admin/mapping-results',
    element: <MappingResultsPage />,
  },
  {
    path: '/admin/system-config',
    element: <SystemConfigEditor />,
  }
];
