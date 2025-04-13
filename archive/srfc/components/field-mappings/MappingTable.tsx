import React from 'react';
import { FieldMappingRow } from './FieldMappingRow';
import type { FieldMapping } from '../../types/database';

interface MappingTableProps {
  mappings: FieldMapping[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<FieldMapping>) => void;
}

export function MappingTable({ mappings, onDelete, onUpdate }: MappingTableProps) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Productboard Field
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Azure DevOps Field
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Mapping Type
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {mappings.map((mapping) => (
          <FieldMappingRow
            key={mapping.id}
            mapping={mapping}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
      </tbody>
    </table>
  );
}