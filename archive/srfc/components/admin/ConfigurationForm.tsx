import React, { useState } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { FieldPropagationRules } from './FieldPropagationRules';
import type { Configuration } from '../../types/database';

interface ConfigurationFormProps {
  config: Partial<Configuration>;
  onUpdate: (data: Partial<Configuration>) => void;
}

export function ConfigurationForm({ config, onUpdate }: ConfigurationFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { db } = useDatabase();

  const handleUpdate = async (data: Partial<Configuration>) => {
    if (!db || !config.id) return;

    setIsSaving(true);
    try {
      await db.configurations.update(config.id!, data);
      await onUpdate(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-medium text-gray-900 mb-6">Advanced Settings</h2>
        <div className="space-y-6">
          <Input
            type="number"
            label="Risk Threshold (days)"
            min={1}
            max={30}
            value={config.risk_threshold_days || ''}
            onChange={(e) => handleUpdate({ risk_threshold_days: parseInt(e.target.value) })}
          />

          <FieldPropagationRules
            enabled={config.field_propagation_enabled || false}
            epicToFeatureRules={config.epic_to_feature_rules || {}}
            featureToStoryRules={config.feature_to_story_rules || {}}
            onUpdate={handleUpdate}
            disabled={isSaving}
          />
        </div>
      </CardContent>
    </Card>
  );
}