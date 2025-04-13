import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import { toast } from 'sonner';

interface ScreenshotUploaderProps {
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
}

export function ScreenshotUploader({ onUpload, loading }: ScreenshotUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setProcessingStatus('Extracting text from image...');
      await onUpload(file);
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      toast.error('Failed to upload screenshot');
    } finally {
      setProcessingStatus('');
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">Upload ProductBoard Screenshot</h3>
        <div className="mb-4">
          <FileUpload 
            accept="image/*" 
            onChange={setFile} 
          />
        </div>
        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Process Screenshot'}
        </Button>
        
        {processingStatus && (
          <div className="mt-2 text-sm text-blue-600">
            {processingStatus}
          </div>
        )}
      </div>
    </Card>
  );
}
