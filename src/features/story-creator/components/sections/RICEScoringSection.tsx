import React, { useEffect } from 'react';
import { Story } from '../../../../types/story-creator';
import { REACH_RANGE, IMPACT_RANGE, CONFIDENCE_RANGE, EFFORT_RANGE } from '../../../../config/constants';

interface RICEScoringProps {
  story: Partial<Story>;
  onChange: (field: keyof Story, value: any) => void;
}

/**
 * RICEScoringSection allows users to input RICE scoring metrics
 * (Reach, Impact, Confidence, Effort) for prioritizing stories.
 * 
 * RICE Score = (Reach × Impact × Confidence) ÷ Effort
 */
export const RICEScoringSection: React.FC<RICEScoringProps> = ({
  story,
  onChange
}) => {
  // Calculate RICE score whenever the component inputs change
  useEffect(() => {
    if (
      story.reach_score !== undefined &&
      story.impact_score !== undefined &&
      story.confidence_score !== undefined &&
      story.effort_score !== undefined &&
      story.effort_score > 0
    ) {
      const rice = 
        (story.reach_score * story.impact_score * story.confidence_score) / 
        story.effort_score;
      
      // Round to 2 decimal places
      const riceScoreRounded = Math.round(rice * 100) / 100;
      onChange('rice_score', riceScoreRounded);
    }
  }, [story.reach_score, story.impact_score, story.confidence_score, story.effort_score, onChange]);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">RICE Prioritization Scoring</h2>
        <p className="text-gray-500 text-sm">
          Score each category to calculate the RICE prioritization score.
          RICE = (Reach × Impact × Confidence) ÷ Effort
        </p>
      </div>
      
      {/* Current RICE Score */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">RICE Score</div>
          <div 
            className={`text-2xl font-bold ${
              (story.rice_score || 0) > 10 
                ? 'text-green-600' 
                : (story.rice_score || 0) > 5 
                  ? 'text-yellow-600' 
                  : 'text-gray-600'
            }`}
          >
            {story.rice_score !== undefined ? story.rice_score : '-'}
          </div>
        </div>
        
        {story.rice_score !== undefined && (
          <div className="mt-2 text-xs text-gray-500">
            {story.rice_score > 10 
              ? 'High priority: This story has significant potential value.'
              : story.rice_score > 5
                ? 'Medium priority: This story has good potential value.'
                : 'Lower priority: Consider whether this story could be deferred.'
            }
          </div>
        )}
      </div>
      
      {/* Reach */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="reach_score" className="block text-sm font-medium text-gray-700">
            Reach ({REACH_RANGE.min}-{REACH_RANGE.max})
          </label>
          <span className="text-sm text-gray-500">
            Current: <span className="font-medium">{story.reach_score || '-'}</span>
          </span>
        </div>
        <div className="mt-1">
          <input
            type="range"
            id="reach_score"
            min={REACH_RANGE.min}
            max={REACH_RANGE.max}
            step={1}
            value={story.reach_score || REACH_RANGE.min}
            onChange={(e) => onChange('reach_score', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Small audience</span>
            <span>Large audience</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          How many people will this story affect? Higher numbers indicate a larger audience.
        </p>
      </div>
      
      {/* Impact */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="impact_score" className="block text-sm font-medium text-gray-700">
            Impact ({IMPACT_RANGE.min}-{IMPACT_RANGE.max})
          </label>
          <span className="text-sm text-gray-500">
            Current: <span className="font-medium">{story.impact_score || '-'}</span>
          </span>
        </div>
        <div className="mt-1">
          <input
            type="range"
            id="impact_score"
            min={IMPACT_RANGE.min}
            max={IMPACT_RANGE.max}
            step={1}
            value={story.impact_score || IMPACT_RANGE.min}
            onChange={(e) => onChange('impact_score', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Minimal impact</span>
            <span>Massive impact</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          How much will this story improve key metrics or user experience? Higher numbers indicate greater impact.
        </p>
      </div>
      
      {/* Confidence */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="confidence_score" className="block text-sm font-medium text-gray-700">
            Confidence ({CONFIDENCE_RANGE.min}-{CONFIDENCE_RANGE.max})
          </label>
          <span className="text-sm text-gray-500">
            Current: <span className="font-medium">{story.confidence_score || '-'}</span>
          </span>
        </div>
        <div className="mt-1">
          <input
            type="range"
            id="confidence_score"
            min={CONFIDENCE_RANGE.min}
            max={CONFIDENCE_RANGE.max}
            step={1}
            value={story.confidence_score || CONFIDENCE_RANGE.min}
            onChange={(e) => onChange('confidence_score', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low confidence</span>
            <span>High confidence</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          How confident are you in the estimates for reach and impact? Higher numbers indicate greater confidence.
        </p>
      </div>
      
      {/* Effort */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="effort_score" className="block text-sm font-medium text-gray-700">
            Effort ({EFFORT_RANGE.min}-{EFFORT_RANGE.max})
          </label>
          <span className="text-sm text-gray-500">
            Current: <span className="font-medium">{story.effort_score || '-'}</span>
          </span>
        </div>
        <div className="mt-1">
          <input
            type="range"
            id="effort_score"
            min={EFFORT_RANGE.min}
            max={EFFORT_RANGE.max}
            step={1}
            value={story.effort_score || EFFORT_RANGE.min}
            onChange={(e) => onChange('effort_score', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Minimal effort</span>
            <span>Significant effort</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          How much time and resources will this story take to implement? Higher numbers indicate greater effort.
        </p>
      </div>
      
      {/* Customer Importance */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="customer_importance_score" className="block text-sm font-medium text-gray-700">
            Customer Importance (1-10)
          </label>
          <span className="text-sm text-gray-500">
            Current: <span className="font-medium">{story.customer_importance_score || '-'}</span>
          </span>
        </div>
        <div className="mt-1">
          <input
            type="range"
            id="customer_importance_score"
            min={1}
            max={10}
            step={1}
            value={story.customer_importance_score || 1}
            onChange={(e) => onChange('customer_importance_score', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Nice to have</span>
            <span>Critical need</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          How important is this story to customers? Higher numbers indicate greater customer importance.
        </p>
      </div>
    </div>
  );
};
