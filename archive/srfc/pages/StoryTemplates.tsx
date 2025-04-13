import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { toast } from 'sonner';
import { PageHeader } from '../components/admin/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { StoryTemplateModal } from '../components/stories/StoryTemplateModal';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { StoryTemplate } from '../types/database';

export function StoryTemplates() {
  const { currentWorkspace } = useWorkspace();
  const { db, loading: dbLoading, error: dbError } = useDatabase();
  const [templates, setTemplates] = useState<StoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [currentWorkspace, db]);

  async function loadTemplates() {
    if (!currentWorkspace || !db) return;

    try {
      const templates = await db.storyTemplates.getAll(currentWorkspace.id);
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (template: StoryTemplate) => {
    try {
      const success = await db?.storyTemplates.delete(template.id);
      if (!success) throw new Error('Failed to delete template');
      
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Story Templates"
        buttonText="New Template"
        buttonIcon={PlusIcon}
        onButtonClick={() => {
          setSelectedTemplate(null);
          setShowModal(true);
        }}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map(template => (
          <Card key={template.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowModal(true);
                    }}
                    className="text-gray-400 hover:text-indigo-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-gray-500 mb-4">{template.description}</p>
              )}

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Level:</span>{' '}
                  <span className="text-gray-600 capitalize">{template.level}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Title Template:</span>{' '}
                  <span className="text-gray-600">{template.template_data.title_template}</span>
                </div>
                {template.template_data.product_line && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Product Line:</span>{' '}
                    <span className="text-gray-600">{template.template_data.product_line}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showModal && (
        <StoryTemplateModal
          template={selectedTemplate || undefined}
          onClose={() => setShowModal(false)}
          onSave={loadTemplates}
        />
      )}
    </div>
  );
}