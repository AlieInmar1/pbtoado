import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { FieldMapping } from '../../types/database';

type MappingType = 'direct' | 'transform' | 'lookup' | 'epic_business_unit' | 'feature_product_code' | 'story_team';

interface MappingRulesModalProps {
  mapping: FieldMapping;
  onClose: () => void;
  onSave: (updatedMapping: Partial<FieldMapping>) => void;
}

export function MappingRulesModal({ mapping, onClose, onSave }: MappingRulesModalProps) {
  const [rules, setRules] = useState<Record<string, any>>(mapping.mapping_rules || {});
  const [mappingType, setMappingType] = useState<MappingType>(mapping.mapping_type);
  
  // For direct mappings, no additional rules are needed
  const renderDirectMappingForm = () => (
    <div className="p-4 bg-gray-50 rounded-md">
      <p className="text-sm text-gray-500">
        Direct mapping simply copies values from one field to another without transformation.
      </p>
    </div>
  );
  
  // For transform mappings, allow defining value transformations
  const renderTransformMappingForm = () => {
    const transformRules = rules.transforms || {};
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    
    const addTransform = () => {
      if (!newKey || !newValue) return;
      
      const updatedTransforms = {
        ...transformRules,
        [newKey]: newValue
      };
      
      setRules({
        ...rules,
        transforms: updatedTransforms
      });
      
      setNewKey('');
      setNewValue('');
    };
    
    const removeTransform = (key: string) => {
      const { [key]: _, ...rest } = transformRules;
      setRules({
        ...rules,
        transforms: rest
      });
    };
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 mb-2">
          Transform mappings allow you to define how values should be transformed when syncing.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-700 mb-2">Value Transformations</h4>
          
          {Object.keys(transformRules).length > 0 ? (
            <div className="mb-4 space-y-2">
              {Object.entries(transformRules).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div>
                    <span className="font-medium">{key}</span>
                    <span className="mx-2">→</span>
                    <span>{value as string}</span>
                  </div>
                  <button
                    onClick={() => removeTransform(key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No transformations defined yet.</p>
          )}
          
          <div className="grid grid-cols-5 gap-2">
            <Input
              className="col-span-2"
              placeholder="Source value"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <div className="flex items-center justify-center">
              <span className="text-gray-500">→</span>
            </div>
            <Input
              className="col-span-2"
              placeholder="Target value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
          
          <div className="mt-2 flex justify-end">
            <Button
              onClick={addTransform}
              disabled={!newKey || !newValue}
              className="text-sm py-1"
            >
              Add Transformation
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // For lookup mappings, allow defining a lookup table
  const renderLookupMappingForm = () => {
    const lookupTable = rules.lookupTable || {};
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    
    const addLookup = () => {
      if (!newKey || !newValue) return;
      
      const updatedLookupTable = {
        ...lookupTable,
        [newKey]: newValue
      };
      
      setRules({
        ...rules,
        lookupTable: updatedLookupTable
      });
      
      setNewKey('');
      setNewValue('');
    };
    
    const removeLookup = (key: string) => {
      const { [key]: _, ...rest } = lookupTable;
      setRules({
        ...rules,
        lookupTable: rest
      });
    };
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 mb-2">
          Lookup mappings use a reference table to map values between systems.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-700 mb-2">Lookup Table</h4>
          
          {Object.keys(lookupTable).length > 0 ? (
            <div className="mb-4 space-y-2">
              {Object.entries(lookupTable).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div>
                    <span className="font-medium">{key}</span>
                    <span className="mx-2">→</span>
                    <span>{value as string}</span>
                  </div>
                  <button
                    onClick={() => removeLookup(key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No lookup values defined yet.</p>
          )}
          
          <div className="grid grid-cols-5 gap-2">
            <Input
              className="col-span-2"
              placeholder="ProductBoard value"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <div className="flex items-center justify-center">
              <span className="text-gray-500">→</span>
            </div>
            <Input
              className="col-span-2"
              placeholder="Azure DevOps value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
          
          <div className="mt-2 flex justify-end">
            <Button
              onClick={addLookup}
              disabled={!newKey || !newValue}
              className="text-sm py-1"
            >
              Add Lookup
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  const handleSave = () => {
    onSave({
      mapping_type: mappingType,
      mapping_rules: rules
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Configure Mapping Rules
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mapping Type
            </label>
            <Select
              value={mappingType}
              onChange={(e) => setMappingType(e.target.value as MappingType)}
              options={[
                { value: 'direct', label: 'Direct Mapping' },
                { value: 'transform', label: 'Transform Mapping' },
                { value: 'lookup', label: 'Lookup Mapping' },
              ]}
            />
          </div>
          
          <div className="mt-6">
            {mappingType === 'direct' && renderDirectMappingForm()}
            {mappingType === 'transform' && renderTransformMappingForm()}
            {mappingType === 'lookup' && renderLookupMappingForm()}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
          >
            Save Rules
          </Button>
        </div>
      </div>
    </div>
  );
}
