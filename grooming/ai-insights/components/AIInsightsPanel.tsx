import React, { useState } from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import { AIInsight, ActionItem, Risk, Suggestion } from '../../types';

interface AIInsightsPanelProps {
  sessionId?: string;
  storyId?: string;
  className?: string;
}

export function AIInsightsPanel({ sessionId, storyId, className = '' }: AIInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');
  
  const { 
    insights, 
    actionItems, 
    risks, 
    suggestions, 
    isLoading, 
    error 
  } = useAIInsights(sessionId, storyId);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error.message}</span>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
        <p className="text-sm text-gray-500 mt-1">
          {sessionId ? 'Analysis of grooming session transcript' : 'Analysis of story details'}
        </p>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 px-4">
          <button
            className={`${
              activeTab === 'summary'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`${
              activeTab === 'actions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('actions')}
          >
            Action Items
            {actionItems.length > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {actionItems.length}
              </span>
            )}
          </button>
          <button
            className={`${
              activeTab === 'risks'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('risks')}
          >
            Risks
            {risks.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {risks.length}
              </span>
            )}
          </button>
          <button
            className={`${
              activeTab === 'suggestions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggestions
            {suggestions.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {suggestions.length}
              </span>
            )}
          </button>
        </nav>
      </div>
      
      <div className="p-4">
        {activeTab === 'summary' && <InsightsSummary insights={insights} />}
        {activeTab === 'actions' && <ActionItemsList actionItems={actionItems} />}
        {activeTab === 'risks' && <RiskHighlights risks={risks} />}
        {activeTab === 'suggestions' && <SuggestionsList suggestions={suggestions} />}
      </div>
    </div>
  );
}

// Placeholder components for the tabs
// In a real implementation, these would be in separate files

function InsightsSummary({ insights }: { insights: AIInsight[] }) {
  if (insights.length === 0) {
    return <p className="text-gray-500">No insights available.</p>;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-900">{insight.category}</span>
              <span className="text-xs text-gray-500">Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{insight.text}</p>
            {insight.source && (
              <p className="text-xs text-gray-500 mt-2">Source: {insight.source}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionItemsList({ actionItems }: { actionItems: ActionItem[] }) {
  if (actionItems.length === 0) {
    return <p className="text-gray-500">No action items identified.</p>;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Action Items</h3>
      <div className="space-y-3">
        {actionItems.map((item, index) => (
          <div key={index} className="flex items-start p-3 border border-gray-200 rounded-lg">
            <div className="flex-shrink-0 mr-3">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{item.text}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {item.assignee && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Assignee: {item.assignee}
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.priority === 'high' ? 'bg-red-100 text-red-800' :
                  item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.priority} priority
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskHighlights({ risks }: { risks: Risk[] }) {
  if (risks.length === 0) {
    return <p className="text-gray-500">No risks identified.</p>;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Identified Risks</h3>
      <div className="space-y-4">
        {risks.map((risk, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className={`p-3 ${
              risk.impact === 'high' || risk.likelihood === 'high' ? 'bg-red-50' :
              risk.impact === 'medium' || risk.likelihood === 'medium' ? 'bg-yellow-50' :
              'bg-green-50'
            }`}>
              <p className="text-sm font-medium text-gray-900">{risk.text}</p>
            </div>
            <div className="p-3 bg-white">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <span className="text-xs text-gray-500">Impact</span>
                  <div className={`mt-1 text-sm font-medium ${
                    risk.impact === 'high' ? 'text-red-700' :
                    risk.impact === 'medium' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Likelihood</span>
                  <div className={`mt-1 text-sm font-medium ${
                    risk.likelihood === 'high' ? 'text-red-700' :
                    risk.likelihood === 'medium' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {risk.likelihood.charAt(0).toUpperCase() + risk.likelihood.slice(1)}
                  </div>
                </div>
              </div>
              {risk.mitigation && (
                <div>
                  <span className="text-xs text-gray-500">Mitigation</span>
                  <p className="mt-1 text-sm text-gray-700">{risk.mitigation}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestionsList({ suggestions }: { suggestions: Suggestion[] }) {
  if (suggestions.length === 0) {
    return <p className="text-gray-500">No suggestions available.</p>;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Improvement Suggestions</h3>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                suggestion.category === 'improvement' ? 'bg-green-100 text-green-800' :
                suggestion.category === 'clarification' ? 'bg-blue-100 text-blue-800' :
                suggestion.category === 'alternative' ? 'bg-purple-100 text-purple-800' :
                'bg-red-100 text-red-800'
              }`}>
                {suggestion.category}
              </span>
              <span className="text-xs text-gray-500">
                Confidence: {(suggestion.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-700">{suggestion.text}</p>
            <div className="mt-3 flex justify-end space-x-2">
              <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Dismiss
              </button>
              <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
