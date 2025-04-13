import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/admin/PageHeader';
import { MappingTable } from '../components/field-mappings/MappingTable';
import { toast } from 'sonner';
import type { FieldMapping } from '../types/database';

export function FieldMappings() {
  const { currentWorkspace } = useWorkspace();
  const { db, loading: dbLoading } = useDatabase();
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace || !db) {
      setLoading(false);
      return;
    }

    async function loadMappings() {
      try {
        // Use non-null assertion since we've already checked above
        const fieldMappings = await db!.fieldMappings.getByWorkspace(currentWorkspace!.id);
        setMappings(fieldMappings);
      } catch (error) {
        console.error('Error loading field mappings:', error);
        toast.error('Failed to load field mappings');
      } finally {
        setLoading(false);
      }
    }

    loadMappings();
  }, [currentWorkspace, db]);

  const addMapping = async () => {
    if (!currentWorkspace || !db) return;

    try {
      // Create a new mapping
      const newMapping = await db.fieldMappings.create({
        workspace_id: currentWorkspace.id,
        pb_field: '',
        ado_field: '',
        mapping_type: 'direct',
        mapping_rules: {},
      });
      
      // Add the new mapping to the state
      setMappings([...mappings, newMapping]);
      toast.success('New field mapping added');
    } catch (error) {
      console.error('Error adding field mapping:', error);
      toast.error('Failed to add field mapping');
    }
  };

  const updateMapping = async (id: string, updatedData: Partial<FieldMapping>) => {
    if (!db) return;
    
    try {
      // Update the mapping
      await db.fieldMappings.update(id, updatedData);
      
      // Update the local state
      setMappings(mappings.map(mapping => 
        mapping.id === id ? { ...mapping, ...updatedData } : mapping
      ));
      
      toast.success('Field mapping updated');
    } catch (error) {
      console.error('Error updating field mapping:', error);
      toast.error('Failed to update field mapping');
    }
  };

  const deleteMapping = async (id: string) => {
    if (!db) return;
    
    try {
      // Delete the mapping
      const success = await db.fieldMappings.delete(id);
      
      if (success) {
        // Update local state
        setMappings(mappings.filter((m) => m.id !== id));
        toast.success('Field mapping deleted');
      } else {
        throw new Error('Failed to delete field mapping');
      }
    } catch (error) {
      console.error('Error deleting field mapping:', error);
      toast.error('Failed to delete field mapping');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Field Mappings"
        description="Configure how fields are mapped between ProductBoard and Azure DevOps"
        buttonText="Add Mapping"
        buttonIcon={PlusIcon}
        onButtonClick={addMapping}
      />

      <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Field Mappings</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Field mappings define how data is synchronized between ProductBoard and Azure DevOps.
                You can create different types of mappings:
              </p>
              <ul className="list-disc pl-5 mt-1">
                <li><strong>Direct:</strong> Maps fields directly without transformation</li>
                <li><strong>Transform:</strong> Applies transformations to field values</li>
                <li><strong>Lookup:</strong> Uses lookup tables to map values</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Card>
        {mappings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No field mappings defined yet. Click "Add Mapping" to create one.</p>
          </div>
        ) : (
          <MappingTable
            mappings={mappings}
            onDelete={deleteMapping}
            onUpdate={updateMapping}
          />
        )}
      </Card>
    </div>
  );
}
