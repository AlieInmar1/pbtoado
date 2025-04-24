import React from 'react';
import { MappingHeaderProps } from './types';

/**
 * MappingHeader component for editing the name and description of a mapping
 */
export const MappingHeader: React.FC<MappingHeaderProps> = ({ 
  editedMapping, 
  handleUpdateMappingInfo 
}) => {
  if (!editedMapping) return null;
  
  return (
    <>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded-md"
        value={editedMapping.name}
        onChange={(e) => handleUpdateMappingInfo('name', e.target.value)}
        placeholder="Mapping Name"
      />
      <textarea
        className="w-full p-2 border border-gray-300 rounded-md"
        value={editedMapping.description || ''}
        onChange={(e) => handleUpdateMappingInfo('description', e.target.value)}
        placeholder="Mapping Description"
        rows={2}
      />
    </>
  );
};

export default MappingHeader;
