import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Switch } from '../ui/Switch';

interface FieldPropagationRulesProps {
  enabled: boolean;
  epicToFeatureRules: Record<string, any>;
  featureToStoryRules: Record<string, any>;
  onUpdate: (data: {
    field_propagation_enabled?: boolean;
    epic_to_feature_rules?: Record<string, any>;
    feature_to_story_rules?: Record<string, any>;
  }) => void;
  disabled?: boolean;
}

export function FieldPropagationRules({
  enabled,
  epicToFeatureRules,
  featureToStoryRules,
  onUpdate,
  disabled = false,
}: FieldPropagationRulesProps) {
  const [isValidJson, setIsValidJson] = useState({ epic: true, feature: true });

  const validateAndUpdateRules = (type: 'epic' | 'feature', value: string) => {
    try {
      const rules = JSON.parse(value);
      setIsValidJson({ ...isValidJson, [type]: true });
      onUpdate({
        [type === 'epic' ? 'epic_to_feature_rules' : 'feature_to_story_rules']: rules
      });
    } catch (error) {
      setIsValidJson({ ...isValidJson, [type]: false });
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Field Propagation</h3>
            <p className="text-sm text-gray-500">
              Control how fields are propagated between different levels
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={(checked) => onUpdate({ field_propagation_enabled: checked })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Epic to Feature</h4>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Define how fields are propagated from epics to features</p>
            <textarea
              className={`w-full h-32 font-mono text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                !isValidJson.epic ? 'border-red-500' : ''
              }`}
              value={JSON.stringify(epicToFeatureRules, null, 2)}
              onChange={(e) => validateAndUpdateRules('epic', e.target.value)}
              disabled={disabled}
            />
            {!isValidJson.epic && (
              <p className="text-xs text-red-500">Invalid JSON format</p>
            )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Feature to Story</h4>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Define how fields are propagated from features to stories</p>
            <textarea
              className={`w-full h-32 font-mono text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                !isValidJson.feature ? 'border-red-500' : ''
              }`}
              value={JSON.stringify(featureToStoryRules, null, 2)}
              onChange={(e) => validateAndUpdateRules('feature', e.target.value)}
              disabled={disabled}
            />
            {!isValidJson.feature && (
              <p className="text-xs text-red-500">Invalid JSON format</p>
            )}
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Example Rule Format</h5>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify({
                "field_mappings": {
                  "source_field": "target_field",
                  "priority": "importance"
                },
                "transformations": {
                  "priority": {
                    "high": "1",
                    "medium": "2",
                    "low": "3"
                  }
                }
              }, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}