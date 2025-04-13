import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/shadcn/input';
import { Badge } from '../ui/shadcn/badge';
import { Button } from '../ui/shadcn/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/shadcn/select';
import { X, Search, Filter } from 'lucide-react';

// Types for filter options
export type FilterOption = {
  label: string;
  value: string;
};

export type FilterConfig = {
  id: string;
  type: 'select' | 'text' | 'multiselect';
  label: string;
  placeholder?: string;
  options?: FilterOption[];
};

export type FilterValues = {
  [key: string]: string | string[] | undefined;
};

export type FilterBarProps = {
  filters: FilterConfig[];
  onFilterChange: (filters: FilterValues) => void;
  initialValues?: FilterValues;
  className?: string;
};

/**
 * FilterBar component provides a consistent filtering interface
 * with text search, dropdown filters, and filter chips.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  initialValues = {},
  className = '',
}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>(initialValues);
  const [searchText, setSearchText] = useState<string>('');
  const [expanded, setExpanded] = useState(false);

  // Apply filters when values change
  useEffect(() => {
    onFilterChange(filterValues);
  }, [filterValues, onFilterChange]);

  // Handle text search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchText !== undefined) {
        setFilterValues(prev => ({
          ...prev,
          search: searchText.trim() === '' ? undefined : searchText
        }));
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  // Handle select filter change
  const handleSelectChange = useCallback((id: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [id]: value === '' || value === `_all_${id}` ? undefined : value
    }));
  }, []);

  // Clear a single filter
  const clearFilter = useCallback((id: string) => {
    setFilterValues(prev => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });

    // Also clear search text if that's the filter being cleared
    if (id === 'search') {
      setSearchText('');
    }
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilterValues({});
    setSearchText('');
  }, []);

  // Get active filter count
  const activeFilterCount = Object.keys(filterValues).length;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search input */}
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Filter button (mobile) */}
        <div className="sm:hidden">
          <Button 
            variant="outline" 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter selects (desktop) */}
        <div className={`flex-wrap gap-2 ${expanded ? 'flex' : 'hidden sm:flex'}`}>
          {filters.filter(f => f.type === 'select' && f.options).map((filter) => (
            <Select
              key={filter.id}
              value={filterValues[filter.id] as string || ''}
              onValueChange={(value) => handleSelectChange(filter.id, value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={`_all_${filter.id}`}>All {filter.label}</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Clear all button */}
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filterValues).map(([id, value]) => {
            if (!value) return null;
            
            // Find the filter config
            const filterConfig = filters.find(f => f.id === id);
            
            // For search filter
            if (id === 'search') {
              return (
                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                  <span>Search: {value}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter(id)}
                  />
                </Badge>
              );
            }
            
            // For select filters
            if (filterConfig?.type === 'select') {
              const option = filterConfig.options?.find(o => o.value === value);
              return (
                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                  <span>{filterConfig.label}: {option?.label || value}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter(id)}
                  />
                </Badge>
              );
            }
            
            return null;
          })}
        </div>
      )}
    </div>
  );
};
