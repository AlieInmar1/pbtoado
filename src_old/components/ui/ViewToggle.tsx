import React from 'react';
import { TableCellsIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

export type ViewMode = 'table' | 'card';

interface ViewToggleProps {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ activeView, onChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`}>
      <button
        type="button"
        className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
          activeView === 'table'
            ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
        onClick={() => onChange('table')}
        aria-current={activeView === 'table' ? 'page' : undefined}
      >
        <TableCellsIcon className="h-4 w-4 mr-2" />
        Table
      </button>
      <button
        type="button"
        className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
          activeView === 'card'
            ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
        onClick={() => onChange('card')}
        aria-current={activeView === 'card' ? 'page' : undefined}
      >
        <Squares2X2Icon className="h-4 w-4 mr-2" />
        Cards
      </button>
    </div>
  );
}
