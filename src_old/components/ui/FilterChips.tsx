import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterOption {
  id: string;
  label: string;
  color?: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  selectedFilters: string[];
  onChange: (selected: string[]) => void;
}

export function FilterChips({ options, selectedFilters, onChange }: FilterChipsProps) {
  const handleToggle = (id: string) => {
    if (selectedFilters.includes(id)) {
      onChange(selectedFilters.filter(filterId => filterId !== id));
    } else {
      onChange([...selectedFilters, id]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const getChipColor = (option: FilterOption, isSelected: boolean) => {
    if (option.color) {
      return option.color;
    }
    
    // Default colors based on selection state
    if (isSelected) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {options.map(option => {
        const isSelected = selectedFilters.includes(option.id);
        const chipColor = getChipColor(option, isSelected);
        
        return (
          <button
            key={option.id}
            onClick={() => handleToggle(option.id)}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${chipColor} transition-colors duration-200`}
          >
            {option.label}
            {isSelected && (
              <XMarkIcon className="ml-1 h-4 w-4" />
            )}
          </button>
        );
      })}
      
      {selectedFilters.length > 0 && (
        <button
          onClick={handleClear}
          className="text-sm text-gray-500 hover:text-gray-700 ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
