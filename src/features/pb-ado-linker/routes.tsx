import React from 'react';
import { PbAdoLinker } from './components/PbAdoLinker';

/**
 * Routes for the ProductBoard-ADO Linker feature.
 */
export const pbAdoLinkerRoutes = [
  {
    // Using a path under admin for now, adjust if needed
    path: '/admin/pb-ado-linker',
    element: <PbAdoLinker />,
  },
  // Add other routes for this feature if necessary
];
