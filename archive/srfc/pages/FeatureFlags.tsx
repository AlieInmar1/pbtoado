import React from 'react';
import { PageHeader } from '../components/admin/PageHeader';
import { FeatureFlagManager } from '../components/admin/FeatureFlagManager';

export function FeatureFlags() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Feature Flags"
        description="Manage feature flags and toggles"
      />
      <FeatureFlagManager />
    </div>
  );
}