import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { StoryCreatorPage } from './pages/StoryCreatorPage';
import { TemplateManagementPage } from './pages/TemplateManagementPage';
import { StoryCreatorLandingPage } from './pages/StoryCreatorLandingPage';
import { IdeaToStoryGenerator } from './components/IdeaToStoryGenerator';

/**
 * Routes for the Story Creator feature module
 */
export const StoryCreatorRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<StoryCreatorLandingPage />} />
      <Route path="/new" element={<StoryCreatorPage />} />
      <Route path="/from-idea" element={<IdeaToStoryGenerator />} />
      <Route path="/edit/:id" element={<StoryCreatorPage />} />
      <Route path="/templates" element={<TemplateManagementPage />} />
    </Routes>
  );
};

export default StoryCreatorRoutes;

// Export with lowercase name to match import in App.tsx
export const storyCreatorRoutes = [
  { path: "/story-creator", element: <StoryCreatorLandingPage /> },
  { path: "/story-creator/new", element: <StoryCreatorPage /> },
  { path: "/story-creator/from-idea", element: <IdeaToStoryGenerator /> },
  { path: "/story-creator/edit/:id", element: <StoryCreatorPage /> },
  { path: "/story-creator/templates", element: <TemplateManagementPage /> }
];
