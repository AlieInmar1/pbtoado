import React from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Save } from 'lucide-react';
import { SaveFooterProps } from './types';

/**
 * SaveFooter component for saving a mapping
 */
export const SaveFooter: React.FC<SaveFooterProps> = ({ 
  handleSave, 
  isSaving 
}) => {
  return (
    <div className="flex justify-end">
      <Button 
        variant="primary" 
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center"
      >
        {isSaving ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Mapping
          </>
        )}
      </Button>
    </div>
  );
};

export default SaveFooter;
