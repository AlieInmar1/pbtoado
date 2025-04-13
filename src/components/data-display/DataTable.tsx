import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { Text } from '../ui/Typography';
import { Card } from '../ui/Card';

/**
 * Column definition for the DataTable component
 */
export interface DataTableColumn<T> {
  /** Unique identifier for the column */
  id: string;
  /** Header text to display */
  header: React.ReactNode;
  /** Function to render the cell content */
  cell: (item: T, index: number) => React.ReactNode;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Optional width or flex property for the column */
  width?: string;
  /** Optional class name for the column */
  className?: string;
}

/**
 * Props for the DataTable component
 */
export interface DataTableProps<T> {
  /** The data to display in the table */
  data: T[];
  /** The columns configuration */
  columns: DataTableColumn<T>[];
  /** An optional key function to get a unique key for each row */
  getRowKey?: (item: T, index: number) => string;
  /** Whether the table is in a loading state */
  isLoading?: boolean;
  /** Optional empty state content */
  emptyState?: React.ReactNode;
  /** Whether the table has a border */
  bordered?: boolean;
  /** Whether the table has a hover effect on rows */
  hoverable?: boolean;
  /** Whether the table has striped rows */
  striped?: boolean;
  /** Default column to sort by */
  defaultSortColumn?: string;
  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
  /** Additional class name for the table container */
  className?: string;
}

/**
 * DataTable component for displaying tabular data with sorting, styling options,
 * and responsive behavior.
 * 
 * @example
 * ```tsx
 * <DataTable
 *   data={users}
 *   columns={[
 *     {
 *       id: 'name',
 *       header: 'Name',
 *       cell: (user) => user.name,
 *       sortable: true
 *     },
 *     {
 *       id: 'email',
 *       header: 'Email',
 *       cell: (user) => user.email
 *     },
 *     {
 *       id: 'actions',
 *       header: '',
 *       cell: (user) => (
 *         <Button onClick={() => handleEdit(user)}>Edit</Button>
 *       )
 *     }
 *   ]}
 *   hoverable
 *   striped
 * />
 * ```
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey,
  isLoading = false,
  emptyState,
  bordered = false,
  hoverable = false,
  striped = false,
  defaultSortColumn,
  defaultSortDirection = 'asc',
  className
}: DataTableProps<T>) {
  // State for sorting
  const [sortColumn, setSortColumn] = useState<string | undefined>(defaultSortColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  
  // Sorted data
  const [sortedData, setSortedData] = useState<T[]>(data);
  
  // Effect to sort data when sort parameters or data change
  useEffect(() => {
    if (!sortColumn) {
      setSortedData(data);
      return;
    }
    
    const column = columns.find(col => col.id === sortColumn);
    
    if (!column?.sortable) {
      setSortedData(data);
      return;
    }
    
    const sorted = [...data].sort((a, b) => {
      const aValue = column.cell(a, 0);
      const bValue = column.cell(b, 0);
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
      
      // Handle other cases
      return 0;
    });
    
    setSortedData(sorted);
  }, [data, sortColumn, sortDirection, columns]);
  
  // Handle sort click
  const handleSortClick = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    
    if (!column?.sortable) {
      return;
    }
    
    if (sortColumn === columnId) {
      // Toggle direction if same column
      setSortDirection(prevDirection => 
        prevDirection === 'asc' ? 'desc' : 'asc'
      );
    } else {
      // Set new column and reset direction
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };
  
  // Get key for a row
  const getKey = (item: T, index: number) => {
    if (getRowKey) {
      return getRowKey(item, index);
    }
    
    // Fallback to index if no key function provided
    return `row-${index}`;
  };
  
  // Compute table classes
  const tableClasses = twMerge(
    'min-w-full divide-y divide-gray-200',
    bordered && 'border border-gray-200',
    className
  );
  
  // Compute row classes
  const getRowClasses = (index: number) => {
    return twMerge(
      'group',
      striped && index % 2 === 0 ? 'bg-gray-50' : 'bg-white',
      hoverable && 'hover:bg-gray-100 transition-colors duration-150',
    );
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="py-8 px-4 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-3"></div>
          <Text>Loading data...</Text>
        </div>
      </Card>
    );
  }
  
  // Empty state
  if (sortedData.length === 0) {
    if (emptyState) {
      return (
        <Card className="overflow-hidden">
          <div className="py-8 px-4 flex flex-col items-center justify-center">
            {emptyState}
          </div>
        </Card>
      );
    }
    
    return (
      <Card className="overflow-hidden">
        <div className="py-8 px-4 flex flex-col items-center justify-center">
          <Text size="lg" muted className="mb-1">No data to display</Text>
          <Text muted>There are no items to show at this time.</Text>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="overflow-x-auto shadow rounded-lg">
      <table className={tableClasses}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th
                key={column.id}
                scope="col"
                style={{ width: column.width }}
                className={twMerge(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:text-gray-700',
                  column.className
                )}
                onClick={() => handleSortClick(column.id)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  
                  {column.sortable && sortColumn === column.id && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item, index) => (
            <tr 
              key={getKey(item, index)}
              className={getRowClasses(index)}
            >
              {columns.map(column => (
                <td
                  key={`${getKey(item, index)}-${column.id}`}
                  className={twMerge(
                    'px-6 py-4 whitespace-nowrap',
                    column.className
                  )}
                >
                  {column.cell(item, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
