import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface Template {
  id: string;
  name: string;
  description: string;
  template_data: any;
  created_at: string;
  updated_at: string;
}

/**
 * TemplateManagementPage allows users to view, create, edit, and delete story templates.
 * These templates can be used as starting points for new stories.
 */
export const TemplateManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    description: ''
  });
  
  // Load templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('story_templates')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setTemplates(data || []);
      } catch (err: any) {
        console.error('Error fetching templates:', err);
        setError(err.message || 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Handle creating a new template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name) {
      setError('Template name is required');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('story_templates')
        .insert({
          name: newTemplate.name,
          description: newTemplate.description || '',
          template_data: {}, // Empty template data for now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      setTemplates(prev => [data[0], ...prev]);
      setShowCreateModal(false);
      setNewTemplate({ name: '', description: '' });
    } catch (err: any) {
      console.error('Error creating template:', err);
      setError(err.message || 'Failed to create template');
    }
  };
  
  // Handle deleting a template
  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('story_templates')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
    }
  };
  
  // Handle using a template to create a new story
  const handleUseTemplate = (template: Template) => {
    navigate('/story-creator', { 
      state: { templateData: template.template_data }
    });
  };
  
  // Render create template modal
  const renderCreateModal = () => {
    if (!showCreateModal) return null;
    
    return (
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
          <div className="fixed inset-0 transition-opacity">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Template</h3>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        id="template-name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter template name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="template-description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="template-description"
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter template description"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleCreateTemplate}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplate({ name: '', description: '' });
                  setError(null);
                }}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render template cards
  const renderTemplates = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="spinner h-10 w-10 border-4 border-blue-500 border-r-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (templates.length === 0) {
      return (
        <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
          <p className="text-gray-500">No templates found.</p>
          <p className="text-sm text-gray-400 mt-2">Create a template to get started.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map(template => (
          <div key={template.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                <div className="flex">
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                {template.description || 'No description provided.'}
              </p>
              
              <div className="mt-4">
                <p className="text-xs text-gray-400">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Use Template
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="px-4 py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Story Templates</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage templates to quickly create new stories with predefined content.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Template
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        {renderTemplates()}
      </div>
      
      {renderCreateModal()}
    </div>
  );
};
