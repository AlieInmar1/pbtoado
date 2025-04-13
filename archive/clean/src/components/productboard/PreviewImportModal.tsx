import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface RankingItem {
  storyId: string;
  rank: number;
  adoId?: string;
  name?: string;
}

interface PreviewImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardName: string;
  rankings: RankingItem[];
  loading: boolean;
  error?: string;
  onSave?: () => void;
  isSaving?: boolean;
}

export function PreviewImportModal({
  isOpen,
  onClose,
  boardName,
  rankings,
  loading,
  error,
  onSave,
  isSaving
}: PreviewImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Preview Import: {boardName}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 flex-grow">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-2 text-gray-600">Loading preview data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md">
              <h4 className="text-red-800 font-medium">Error Loading Preview</h4>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items found in this board. The board might be empty or the scraper might need to be updated.
            </div>
          ) : (
            <>
              <p className="mb-4 text-gray-600">
                This preview shows the items that would be imported from ProductBoard. 
                The rankings will be used to update the Stack Rank field in Azure DevOps.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ProductBoard ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azure DevOps ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rankings.map((item) => (
                      <tr key={item.storyId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.rank}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.storyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.adoId || (
                            <span className="text-yellow-600">Not mapped</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.name || (
                            <span className="text-gray-400">Not available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 bg-yellow-50 p-4 rounded-md">
                <h4 className="text-yellow-800 font-medium">Note</h4>
                <p className="text-yellow-700 mt-1">
                  Items without a mapped Azure DevOps ID will be skipped during the actual sync process.
                </p>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 p-4 border-t">
          {onSave && !loading && !error && rankings.length > 0 && (
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Rankings'
              )}
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
