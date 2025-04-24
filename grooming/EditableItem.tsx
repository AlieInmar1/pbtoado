import React, { useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EditableItemProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  isReadOnly?: boolean;
}

export function EditableItem({ value, onSave, onDelete, isReadOnly = false }: EditableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    if (isReadOnly) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (isReadOnly || !editValue.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly || !onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          rows={2}
          disabled={isLoading}
        />
        <div className="flex flex-col ml-2 space-y-1">
          <button
            onClick={handleSave}
            disabled={isLoading || !editValue.trim()}
            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
            title="Save"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            title="Cancel"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start group">
      <p className="text-sm text-gray-900 flex-1">{value}</p>
      {!isReadOnly && (
        <div className="flex ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
