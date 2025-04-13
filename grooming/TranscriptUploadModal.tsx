import React, { useState } from 'react';
import { XMarkIcon, DocumentTextIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useFunctions } from '../../contexts/FunctionContext';
import type { GroomingSession } from '../../types/database';

interface TranscriptUploadModalProps {
  session: GroomingSession;
  onClose: () => void;
  onUploaded: () => void;
}

export function TranscriptUploadModal({ session, onClose, onUploaded }: TranscriptUploadModalProps) {
  const { db } = useDatabase();
  const { functions } = useFunctions();
  
  const [transcript, setTranscript] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setTranscript(content);
        setIsUploading(false);
      } catch (err) {
        setError('Failed to read file. Please try again.');
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };
  
  const handleSubmit = async () => {
    if (!transcript.trim() || !db || !functions) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // First, save the transcript to the session
      await db.groomingSessions.updateTranscript(session.id, transcript);
      
      // Then, call the analyze-transcript function to process it
      const result = await functions.analyzeTranscript({
        sessionId: session.id,
        transcript,
      });
      
      // Call the callback to refresh the session data
      onUploaded();
      onClose();
    } catch (err) {
      console.error('Error processing transcript:', err);
      setError('Failed to process transcript. Please try again.');
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload Session Transcript</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-500 mb-4">
            Upload a transcript of your grooming session. The AI will analyze it to extract discussion points, decisions, and action items.
          </p>
          
          {!transcript ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop a text file here, or click to select a file
              </p>
              <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                Select File
                <input
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">
                Supported formats: .txt, .md, .doc, .docx
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Transcript Preview</h3>
                <button
                  onClick={() => setTranscript('')}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</pre>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isUploading || isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Process Transcript'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
