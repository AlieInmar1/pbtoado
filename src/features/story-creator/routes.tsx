import React from 'react';
import StoryCreatorPage from './pages/StoryCreatorPage';
import TemplateManagementPage from './pages/TemplateManagementPage';

// Define routes for the story creator feature
export const storyCreatorRoutes = [
  {
    path: '/story-creator',
    element: <StoryCreatorPage />
  },
  {
    path: '/story-creator/templates',
    element: <TemplateManagementPage />
  }
];
