import React from 'react';
import { StoryWizard } from './StoryWizard';

interface StoryDraftModalProps {
  onClose: () => void;
  onSave: (story: any) => Promise<void>;
}

export function StoryDraftModal({ onClose, onSave }: StoryDraftModalProps) {
  return <StoryWizard onClose={onClose} onSave={onSave} />;
}