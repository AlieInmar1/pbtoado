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
import { groomingAssistantRoutes } from './features/grooming-assistant/routes';
import { syncRoutes } from './features/sync/routes';
import { adminRoutes } from './features/admin/routes'; // Import admin routes
import { authRoutes } from './features/auth/routes';
import { storyCreatorRoutes } from './features/story-creator/routes'; // Import story creator routes

// Import context providers
import { AuthProvider } from './features/auth/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { FunctionProvider } from './contexts/FunctionContext';

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
    ...groomingAssistantRoutes,
    ...syncRoutes,
    ...adminRoutes, // Add admin routes
    ...authRoutes,
    ...storyCreatorRoutes // Add story creator routes
  ];

  return (
    <AuthProvider>
      <WorkspaceProvider>
        <DatabaseProvider>
          <FunctionProvider>
            <BrowserRouter>
        <Routes>
          {/* Redirect root to admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          
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
          </FunctionProvider>
        </DatabaseProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
