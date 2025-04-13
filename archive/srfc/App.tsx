import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { NotificationProvider } from './components/NotificationProvider';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { WorkspaceSettings } from './pages/WorkspaceSettings';
import { FieldMappings } from './pages/FieldMappings';
import { FeatureFlags } from './pages/FeatureFlags';
import { AIPrompts } from './pages/AIPrompts';
import { StoryTemplates } from './pages/StoryTemplates';
import { GroomingSessions } from './pages/GroomingSessions';
import { SessionDetail } from './pages/SessionDetail';
import { DatabaseSettings } from './pages/DatabaseSettings';
import { ProductBoard } from './pages/ProductBoard';
import { ProductBoardInitiatives } from './pages/ProductBoardInitiatives';
import ProductBoardRankings from './pages/ProductBoardRankings';
import { ProductBoardInitiativeHierarchy } from './pages/ProductBoardInitiativeHierarchy';
import ProductBoardHierarchy from './pages/ProductBoardHierarchy';
import ProductBoardRankingSettings from './pages/ProductBoardRankingSettings';
import { ProductBoardFeatures } from './pages/ProductBoardFeatures';
import EntityMappingsPage from './pages/EntityMappings';
import TokenCapturePage from './pages/TokenCapturePage';

function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}

// Separate component for routes to avoid React Router warnings
function AppRoutes() {
  return (
    <Routes>
      {/* Token capture page is completely standalone */}
      <Route path="token-capture" element={<TokenCapturePage />} />
      
      {/* Main app routes with layout */}
      <Route path="/" element={<AppContent />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="admin/workspace/:id" element={<WorkspaceSettings />} />
        <Route path="admin/field-mappings" element={<FieldMappings />} />
        <Route path="admin/feature-flags" element={<FeatureFlags />} />
        <Route path="admin/ai-prompts" element={<AIPrompts />} />
        <Route path="admin/story-templates" element={<StoryTemplates />} />
        <Route path="admin/database" element={<DatabaseSettings />} />
        <Route path="admin/productboard" element={<ProductBoard />} />
        <Route path="admin/productboard/initiatives" element={<ProductBoardInitiatives />} />
        <Route path="admin/productboard/rankings" element={<ProductBoardRankings />} />
        <Route path="admin/productboard/rankings/:workspaceId/:boardId" element={<ProductBoardRankings />} />
        <Route path="admin/productboard/ranking-settings" element={<ProductBoardRankingSettings />} />
        <Route path="admin/productboard/initiative-hierarchy" element={<ProductBoardInitiativeHierarchy />} />
        <Route path="admin/productboard/hierarchy" element={<ProductBoardHierarchy />} />
        <Route path="admin/productboard/features" element={<ProductBoardFeatures />} />
        <Route path="admin/entity-mappings" element={<EntityMappingsPage />} />
        <Route path="grooming" element={<GroomingSessions />} />
        <Route path="grooming/session/:sessionId" element={<SessionDetail />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

// Content with layout wrapper
function AppContent() {
  // We're using these values in the Layout component
  useWorkspace();
  return <Layout />;
}

export default App;
