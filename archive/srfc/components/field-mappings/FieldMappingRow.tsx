import React, { useState } from 'react';
import { TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { MappingRulesModal } from './MappingRulesModal';
import type { FieldMapping } from '../../types/database';

interface FieldMappingRowProps {
  mapping: FieldMapping;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<FieldMapping>) => void;
}

export function FieldMappingRow({ mapping, onDelete, onUpdate }: FieldMappingRowProps) {
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  const mappingTypes = [
    { value: 'direct', label: 'Direct' },
    { value: 'transform', label: 'Transform' },
    { value: 'lookup', label: 'Lookup' },
  ];

  const handleMappingTypeChange = (value: string) => {
    // Cast the string value to the appropriate type
    const mappingType = value as 'direct' | 'transform' | 'lookup' | 'epic_business_unit' | 'feature_product_code' | 'story_team';
    
    // Update the mapping type
    onUpdate(mapping.id, { mapping_type: mappingType });
    
    // If the mapping type is transform or lookup, show the rules modal
    if (mappingType === 'transform' || mappingType === 'lookup') {
      setShowRulesModal(true);
    }
  };

  return (
    <>
      <tr>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            value={mapping.pb_field}
            onChange={(e) => onUpdate(mapping.id, { pb_field: e.target.value })}
            placeholder="Enter Productboard field"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            value={mapping.ado_field}
            onChange={(e) => onUpdate(mapping.id, { ado_field: e.target.value })}
            placeholder="Enter Azure DevOps field"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Select
            value={mapping.mapping_type}
            options={mappingTypes}
            onChange={(e) => handleMappingTypeChange(e.target.value)}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
          <button
            onClick={() => setShowRulesModal(true)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Configure mapping rules"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(mapping.id)}
            className="text-red-600 hover:text-red-900"
            title="Delete mapping"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </td>
      </tr>
      
      {showRulesModal && (
        <MappingRulesModal
          mapping={mapping}
          onClose={() => setShowRulesModal(false)}
          onSave={(updatedMapping) => {
            onUpdate(mapping.id, updatedMapping);
            setShowRulesModal(false);
          }}
        />
      )}
    </>
  );
}
