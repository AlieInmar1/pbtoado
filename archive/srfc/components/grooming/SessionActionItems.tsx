import React, { useState } from 'react';
import { 
  PlusIcon, 
  XMarkIcon, 
  CheckIcon, 
  PencilIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import type { GroomingSession } from '../../types/database';

interface ActionItem {
  description: string;
  assignee: string;
  due_date: string;
  status: 'pending' | 'completed';
}

interface SessionActionItemsProps {
  session: GroomingSession;
  onUpdateActionItems: (actionItems: ActionItem[]) => Promise<void>;
  disabled?: boolean;
}

export function SessionActionItems({
  session,
  onUpdateActionItems,
  disabled = false
}: SessionActionItemsProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>(session.action_items || []);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState<ActionItem>({
    description: '',
    assignee: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  const handleAddItem = async () => {
    if (!newItem.description || !newItem.assignee || loading) return;
    
    const updatedItems = [...actionItems, newItem];
    setLoading(true);
    
    try {
      await onUpdateActionItems(updatedItems);
      setActionItems(updatedItems);
      setNewItem({
        description: '',
        assignee: '',
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding action item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (index: number) => {
    if (loading) return;
    
    const updatedItems = [...actionItems];
    updatedItems[index] = newItem;
    
    setLoading(true);
    try {
      await onUpdateActionItems(updatedItems);
      setActionItems(updatedItems);
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating action item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (index: number) => {
    if (loading) return;
    
    const updatedItems = actionItems.filter((_, i) => i !== index);
    
    setLoading(true);
    try {
      await onUpdateActionItems(updatedItems);
      setActionItems(updatedItems);
    } catch (error) {
      console.error('Error removing action item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (index: number) => {
    if (loading) return;
    
    const updatedItems = [...actionItems];
    updatedItems[index] = {
      ...updatedItems[index],
      status: updatedItems[index].status === 'pending' ? 'completed' : 'pending',
    };
    
    setLoading(true);
    try {
      await onUpdateActionItems(updatedItems);
      setActionItems(updatedItems);
    } catch (error) {
      console.error('Error updating action item status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (index: number) => {
    setNewItem(actionItems[index]);
    setIsEditing(index);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Action Items</h3>
        {!isAdding && !isEditing && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={disabled || loading}
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Action Item
          </button>
        )}
      </div>

      {(isAdding || isEditing !== null) && (
        <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              {isEditing !== null ? 'Edit Action Item' : 'Add New Action Item'}
            </h4>
            <button
              onClick={() => {
                setIsAdding(false);
                setIsEditing(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-xs font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="assignee" className="block text-xs font-medium text-gray-700">
                Assignee
              </label>
              <input
                type="text"
                id="assignee"
                value={newItem.assignee}
                onChange={(e) => setNewItem({ ...newItem, assignee: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="due_date" className="block text-xs font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                value={newItem.due_date}
                onChange={(e) => setNewItem({ ...newItem, due_date: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={isEditing !== null ? () => handleUpdateItem(isEditing) : handleAddItem}
              disabled={!newItem.description || !newItem.assignee || loading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing !== null ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      {actionItems.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm">No action items yet</p>
          <p className="text-xs">Add action items to track follow-up tasks</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {actionItems.map((item, index) => (
            <li key={index} className="py-3">
              <div className="flex items-start">
                <button
                  onClick={() => handleToggleStatus(index)}
                  disabled={disabled || loading}
                  className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border ${
                    item.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300'
                  } mr-3 flex items-center justify-center disabled:opacity-50`}
                >
                  {item.status === 'completed' && <CheckIcon className="h-3 w-3" />}
                </button>
                
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                  }`}>
                    {item.description}
                  </p>
                  <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                    <span>Assignee: {item.assignee}</span>
                    <span>•</span>
                    <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0 flex items-center space-x-1">
                  <button
                    onClick={() => handleEditItem(index)}
                    disabled={disabled || loading || isAdding || isEditing !== null}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Edit action item"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    disabled={disabled || loading}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Remove action item"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
