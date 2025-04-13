import React from 'react';
import { AdminPage } from './components/AdminPage';
import { HierarchyMappingEditor } from './components/HierarchyMappingEditor';

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
  }
];
