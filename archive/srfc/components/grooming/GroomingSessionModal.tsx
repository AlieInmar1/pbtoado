import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabase';

const sessionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  session_date: z.string().min(1, 'Date is required'),
  duration_minutes: z.number().min(15, 'Duration must be at least 15 minutes'),
  session_type: z.enum(['product', 'technical', 'refinement']),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface GroomingSessionModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function GroomingSessionModal({ onClose, onCreated }: GroomingSessionModalProps) {
  const { currentWorkspace } = useWorkspace();
  const { db } = useDatabase();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      session_type: 'product',
      duration_minutes: 60,
      session_date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
    },
  });

  const onSubmit = async (data: SessionFormData) => {
    if (!currentWorkspace || !db) return;

    setLoading(true);
    try {
      await db.groomingSessions.create({
        ...data,
        workspace_id: currentWorkspace.id,
        status: 'planned',
        // No facilitator_id is provided, which is now allowed since we made it nullable
      });

      toast.success('Grooming session created successfully');
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating grooming session:', error);
      toast.error('Failed to create grooming session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">New Grooming Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <Input
            label="Session Name"
            value={watch('name') || ''}
            onChange={(e) => setValue('name', e.target.value)}
            error={errors.name?.message}
            placeholder="e.g., Sprint 23 Grooming"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Date & Time"
              value={watch('session_date') || ''}
              onChange={(e) => setValue('session_date', e.target.value)}
              error={errors.session_date?.message}
            />

            <Input
              type="number"
              label="Duration (minutes)"
              value={watch('duration_minutes') || ''}
              onChange={(e) => setValue('duration_minutes', parseInt(e.target.value))}
              error={errors.duration_minutes?.message}
              min={15}
              step={15}
            />
          </div>

          <Select
            label="Session Type"
            value={watch('session_type') || 'product'}
            onChange={(e) => setValue('session_type', e.target.value as 'product' | 'technical' | 'refinement')}
            error={errors.session_type?.message}
            options={[
              { value: 'product', label: 'Product Grooming' },
              { value: 'technical', label: 'Technical Grooming' },
              { value: 'refinement', label: 'Refinement' },
            ]}
          />

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
