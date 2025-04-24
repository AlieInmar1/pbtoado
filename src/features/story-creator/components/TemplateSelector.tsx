import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  is_default: boolean;
  fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string | null) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * TemplateSelector allows users to choose a template when creating a new story.
 * Templates provide pre-filled content, settings, and structure for stories.
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onCancel,
  loading = false
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Fetch templates from the database
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('story_templates')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        setTemplates(data || []);
        
        // Select default template if available
        const defaultTemplate = data?.find(t => t.is_default);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Failed to load templates. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Filtered and categorized templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = !activeCategory || template.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    templates.forEach(template => {
      if (template.category) {
        uniqueCategories.add(template.category);
      }
    });
    return Array.from(uniqueCategories);
  }, [templates]);
  
  // Handle template selection
  const handleSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };
  
  // Use the selected template
  const handleUseTemplate = () => {
    onSelectTemplate(selectedTemplate);
  };
  
  // Skip template selection
  const handleSkipTemplate = () => {
    onSelectTemplate(null);
  };
  
  // Set active category filter
  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="spinner h-8 w-8 border-4 border-blue-500 border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading templates...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-center">
        <svg className="mx-auto h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-red-800">Error Loading Templates</h3>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSkipTemplate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue Without Template
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Choose a Template</h2>
        <p className="text-gray-600">
          Start with a template to save time and ensure consistency.
          Templates include pre-filled content and recommended settings.
        </p>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={`px-3 py-1 text-xs rounded-full ${
                activeCategory === null
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-1 text-xs rounded-full ${
                  activeCategory === category
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Templates list */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? `No templates match "${searchTerm}"`
              : 'No templates available in this category'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleSkipTemplate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Without Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`border rounded-lg overflow-hidden transition-shadow cursor-pointer ${
                selectedTemplate === template.id
                  ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                  : 'border-gray-200 hover:shadow-md'
              }`}
              onClick={() => handleSelect(template.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {template.name}
                    </h3>
                    {template.is_default && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedTemplate === template.id && (
                        <svg
                          className="w-full h-full text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {template.description}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  Last updated: {new Date(template.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
                {Object.keys(template.fields || {}).length} fields pre-configured
              </div>
            </div>
          ))}
          
          {/* "No Template" option */}
          <div
            className={`border rounded-lg overflow-hidden transition-shadow cursor-pointer ${
              selectedTemplate === 'none'
                ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                : 'border-gray-200 hover:shadow-md'
            }`}
            onClick={() => setSelectedTemplate('none')}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Blank Story
                  </h3>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    selectedTemplate === 'none'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedTemplate === 'none' && (
                      <svg
                        className="w-full h-full text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Start from scratch with a blank story. No pre-filled content or settings.
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
              Empty template
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUseTemplate}
          disabled={!selectedTemplate || loading}
          className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            (!selectedTemplate || loading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-r-transparent"></span>
              Loading...
            </>
          ) : (
            selectedTemplate === 'none' ? 'Create Blank Story' : 'Use Selected Template'
          )}
        </button>
      </div>
    </div>
  );
};
