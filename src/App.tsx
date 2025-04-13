import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import layout
import { MainLayout } from './components/layout/MainLayout';

// Import feature routes
import { dashboardRoutes } from './features/dashboard/routes';
import { featuresRoutes } from './features/features/routes';
import { hierarchyRoutes } from './features/hierarchy/routes';
import { rankingsRoutes } from './features/rankings/routes';
import { storiesRoutes } from './features/stories/routes';
import { groomingRoutes } from './features/grooming/routes';
import { syncRoutes } from './features/sync/routes';
import { adminRoutes } from './features/admin/routes'; // Import admin routes
import { authRoutes } from './features/auth/routes';

// Import context providers
import { AuthProvider } from './features/auth/AuthContext';

// Import components
import { PageNotFound } from './components/feedback/PageNotFound';

/**
 * Main application component that sets up routing and providers
 */
function App() {
  // Flatten all feature routes
  const routes = [
    ...dashboardRoutes,
    ...featuresRoutes,
    ...hierarchyRoutes,
    ...rankingsRoutes,
    ...storiesRoutes,
    ...groomingRoutes,
    ...syncRoutes,
    ...adminRoutes, // Add admin routes
    ...authRoutes
  ];

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Main layout with feature routes */}
          <Route element={<MainLayout />}>
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Route>
          
          {/* 404 fallback */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
