import React, { useState } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface GroomingSessionModalProps {
  onClose: () => void;
  onCreated: () => void;
  existingSession?: any;
}

export function GroomingSessionModal({ onClose, onCreated, existingSession }: GroomingSessionModalProps) {
  const { currentWorkspace } = useWorkspace();
  const { groomingSessions } = useDatabase();
  
  const [formData, setFormData] = useState({
    name: existingSession?.name || '',
    session_date: existingSession?.session_date ? new Date(existingSession.session_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    duration_minutes: existingSession?.duration_minutes || 60,
    session_type: existingSession?.session_type || 'product',
    status: existingSession?.status || 'planned'
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return;
    }
    
    setLoading(true);
    
    try {
      const sessionData = {
        ...formData,
        workspace_id: currentWorkspace.id,
        action_items: existingSession?.action_items || [],
        session_date: new Date(formData.session_date).toISOString()
      };
      
      if (existingSession) {
        // Update existing session
        await groomingSessions.update(existingSession.id, sessionData);
        toast.success('Grooming session updated');
      } else {
        // Create new session
        await groomingSessions.create(sessionData);
        toast.success('Grooming session created');
      }
      
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error saving grooming session:', error);
      toast.error('Failed to save grooming session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={existingSession ? 'Edit Grooming Session' : 'Create New Grooming Session'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Session Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            placeholder="Sprint 1 Refinement"
          />
        </div>
        
        <div>
          <label htmlFor="session_date" className="block text-sm font-medium text-gray-700">
            Date and Time
          </label>
          <input
            type="datetime-local"
            id="session_date"
            name="session_date"
            value={formData.session_date}
            onChange={handleChange}
            required
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration_minutes"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            required
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            min="15"
            step="15"
          />
        </div>
        
        <div>
          <label htmlFor="session_type" className="block text-sm font-medium text-gray-700">
            Session Type
          </label>
          <select
            id="session_type"
            name="session_type"
            value={formData.session_type}
            onChange={handleChange}
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          >
            <option value="product">Product Refinement</option>
            <option value="technical">Technical Refinement</option>
            <option value="refinement">Story Refinement</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : existingSession ? 'Update Session' : 'Create Session'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
