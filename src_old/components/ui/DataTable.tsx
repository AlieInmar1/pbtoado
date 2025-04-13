import React, { ReactNode } from 'react';

interface DataTableProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

interface DataTableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface DataTableBodyProps {
  children: ReactNode;
  className?: string;
}

interface DataTableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface DataTableCellProps {
  children: ReactNode;
  className?: string;
  header?: boolean;
  colSpan?: number;
}

export function DataTable({ children, className = '', compact = false }: DataTableProps) {
  const sizeClass = compact ? 'text-xs' : 'text-sm';
  
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${sizeClass} ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function DataTableHeader({ children, className = '' }: DataTableHeaderProps) {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      {children}
    </thead>
  );
}

export function DataTableBody({ children, className = '' }: DataTableBodyProps) {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  );
}

export function DataTableRow({ children, className = '', onClick }: DataTableRowProps) {
  return (
    <tr 
      className={`${className} ${onClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({ children, className = '', header = false, colSpan }: DataTableCellProps) {
  if (header) {
    return (
      <th 
        scope="col" 
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
        colSpan={colSpan}
      >
        {children}
      </th>
    );
  }
  
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
