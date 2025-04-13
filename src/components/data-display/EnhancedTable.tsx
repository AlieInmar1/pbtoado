import React, { useState, useCallback, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/shadcn/table';
import { Button } from '../ui/shadcn/button';
import { Input } from '../ui/shadcn/input';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Check,
  ArrowUpDown,
  ChevronDownSquare,
  ChevronRightSquare
} from 'lucide-react';

// Types for table columns and data
export type SortDirection = 'asc' | 'desc' | undefined;

export type ColumnDef<T> = {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  cell?: (props: { row: T; getValue: () => any }) => React.ReactNode;
  enableSorting?: boolean;
  sortingFn?: (a: T, b: T, direction: SortDirection) => number;
};

export type EnhancedTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  expandedContent?: (row: T) => React.ReactNode;
  initialSortColumn?: string;
  initialSortDirection?: SortDirection;
  pageSize?: number;
  className?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
};

/**
 * EnhancedTable component extends the basic table with sorting,
 * pagination, expandable rows, and row selection.
 */
export function EnhancedTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  expandedContent,
  initialSortColumn,
  initialSortDirection,
  pageSize = 10,
  className = '',
  selectable = false,
  onSelectionChange
}: EnhancedTableProps<T>) {
  // State for sorting
  const [sortColumn, setSortColumn] = useState<string | undefined>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // State for selected rows
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Toggle row expansion
  const toggleRowExpanded = useCallback((rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  }, []);

  // Toggle row selection
  const toggleRowSelected = useCallback((rowId: string) => {
    setSelectedRows(prev => {
      const newSelected = { ...prev, [rowId]: !prev[rowId] };
      
      // Notify parent of selection change
      if (onSelectionChange) {
        const selectedIds = Object.entries(newSelected)
          .filter(([_, isSelected]) => isSelected)
          .map(([id]) => id);
        onSelectionChange(selectedIds);
      }
      
      return newSelected;
    });
  }, [onSelectionChange]);

  // Toggle all rows selection
  const toggleAllSelected = useCallback(() => {
    const allSelected = data.length > 0 && data.every(row => selectedRows[getRowId(row)]);
    
    const newSelectedRows: Record<string, boolean> = {};
    data.forEach(row => {
      const rowId = getRowId(row);
      newSelectedRows[rowId] = !allSelected;
    });
    
    setSelectedRows(newSelectedRows);
    
    // Notify parent of selection change
    if (onSelectionChange) {
      const selectedIds = Object.entries(newSelectedRows)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      onSelectionChange(selectedIds);
    }
  }, [data, getRowId, selectedRows, onSelectionChange]);

  // Handle column header click for sorting
  const handleHeaderClick = useCallback((columnId: string, enableSorting?: boolean) => {
    if (!enableSorting) return;
    
    setSortColumn(columnId);
    setSortDirection(prev => {
      if (columnId !== sortColumn) return 'asc';
      if (prev === 'asc') return 'desc';
      if (prev === 'desc') return undefined;
      return 'asc';
    });
  }, [sortColumn]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;
    
    const column = columns.find(col => col.id === sortColumn);
    if (!column) return data;
    
    return [...data].sort((a, b) => {
      // Use custom sorting function if provided
      if (column.sortingFn) {
        return column.sortingFn(a, b, sortDirection);
      }
      
      // Get values to compare
      let valueA: any;
      let valueB: any;
      
      if (column.accessorFn) {
        valueA = column.accessorFn(a);
        valueB = column.accessorFn(b);
      } else if (column.accessorKey) {
        valueA = a[column.accessorKey];
        valueB = b[column.accessorKey];
      } else {
        return 0;
      }
      
      // Compare values
      if (valueA === valueB) return 0;
      
      // Handle undefined/null values
      if (valueA == null) return sortDirection === 'asc' ? -1 : 1;
      if (valueB == null) return sortDirection === 'asc' ? 1 : -1;
      
      // Compare based on type
      const result = typeof valueA === 'string' 
        ? valueA.localeCompare(valueB) 
        : valueA - valueB;
      
      return sortDirection === 'asc' ? result : -result;
    });
  }, [data, columns, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle page change
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Check if all rows on current page are selected
  const allSelected = paginatedData.length > 0 && 
    paginatedData.every(row => selectedRows[getRowId(row)]);
  
  // Check if some rows on current page are selected
  const someSelected = paginatedData.some(row => selectedRows[getRowId(row)]) && !allSelected;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Selection checkbox column */}
              {selectable && (
                <TableHead className="w-[40px]">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={toggleAllSelected}
                      className="h-4 w-4 rounded border border-gray-300 flex items-center justify-center"
                    >
                      {allSelected && <Check className="h-3 w-3" />}
                      {someSelected && <div className="h-2 w-2 bg-gray-500 rounded-sm" />}
                    </button>
                  </div>
                </TableHead>
              )}
              
              {/* Expandable row column */}
              {expandedContent && (
                <TableHead className="w-[40px]"></TableHead>
              )}
              
              {/* Data columns */}
              {columns.map((column) => (
                <TableHead 
                  key={column.id}
                  onClick={() => handleHeaderClick(column.id, column.enableSorting)}
                  className={column.enableSorting ? 'cursor-pointer select-none' : ''}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.enableSorting && (
                      <div className="ml-1">
                        {sortColumn === column.id ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : sortDirection === 'desc' ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => {
                const rowId = getRowId(row);
                const isExpanded = expandedContent ? !!expandedRows[rowId] : false;
                const isSelected = selectable ? !!selectedRows[rowId] : false;
                
                return (
                  <React.Fragment key={rowId}>
                    <TableRow 
                      className={`
                        ${onRowClick ? 'cursor-pointer' : ''}
                        ${isSelected ? 'bg-gray-50' : ''}
                      `}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      {/* Selection checkbox */}
                      {selectable && (
                        <TableCell className="p-2">
                          <div 
                            className="flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowSelected(rowId);
                            }}
                          >
                            <div className="h-4 w-4 rounded border border-gray-300 flex items-center justify-center">
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Expand/collapse button */}
                      {expandedContent && (
                        <TableCell className="p-2">
                          <div 
                            className="flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpanded(rowId);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDownSquare className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRightSquare className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Data cells */}
                      {columns.map((column) => (
                        <TableCell key={column.id}>
                          {column.cell ? (
                            column.cell({
                              row,
                              getValue: () => {
                                if (column.accessorFn) {
                                  return column.accessorFn(row);
                                }
                                if (column.accessorKey) {
                                  return row[column.accessorKey];
                                }
                                return undefined;
                              }
                            })
                          ) : column.accessorKey ? (
                            String(row[column.accessorKey] || '')
                          ) : column.accessorFn ? (
                            String(column.accessorFn(row) || '')
                          ) : null}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Expanded content */}
                    {expandedContent && isExpanded && (
                      <TableRow className="bg-gray-50">
                        <TableCell 
                          colSpan={columns.length + (selectable ? 2 : 1)}
                          className="p-4"
                        >
                          {expandedContent(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (expandedContent ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    goToPage(value);
                  }
                }}
                className="w-12 h-8 text-center"
              />
              <span className="text-sm text-gray-500">of {totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
