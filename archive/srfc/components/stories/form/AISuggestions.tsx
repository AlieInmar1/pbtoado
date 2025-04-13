import React from 'react';

interface AISuggestionsProps {
  suggestions: Record<string, any> | null;
}

export function AISuggestions({ suggestions }: AISuggestionsProps) {
  if (!suggestions) return null;

  return (
    <div className="bg-blue-50 p-4 rounded-md">
      <h3 className="text-sm font-medium text-blue-800 mb-2">AI Suggestions</h3>
      <div className="space-y-2 text-sm text-blue-700">
        {Object.entries(suggestions).map(([key, value]) => (
          <div key={key}>
            <strong className="capitalize">{key.replace('_', ' ')}:</strong>{' '}
            {String(value)}
          </div>
        ))}
      </div>
    </div>
  );
}