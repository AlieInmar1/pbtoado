import React, { useState } from 'react';

interface FileUploadProps {
  accept?: string;
  onChange: (file: File | null) => void;
  className?: string;
}

export function FileUpload({ accept = 'image/*', onChange, className = '' }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    onChange(file);
  };

  return (
    <input
      type="file"
      accept={accept}
      onChange={handleFileChange}
      className={`block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-md file:border-0
        file:text-sm file:font-semibold
        file:bg-indigo-50 file:text-indigo-700
        hover:file:bg-indigo-100 ${className}`}
    />
  );
}
