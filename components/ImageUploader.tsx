
import React, { useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageUpload: (image: HTMLImageElement) => void;
  onUploadError: (message: string) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onUploadError, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      onUploadError('Please upload an image file (JPG or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageUpload(img);
      };
      img.onerror = () => {
        onUploadError('Failed to load image. Please try a different file.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      onUploadError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, [onImageUpload, onUploadError]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
      // Clear the input value to allow re-uploading the same file
      e.target.value = '';
    }
  }, [handleFile]);

  return (
    <div
      className={`
        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center
        ${isDragging ? 'border-blue-500 bg-gray-700' : 'border-gray-600 bg-gray-800'}
        transition-all duration-200 ease-in-out cursor-pointer
        hover:border-blue-400 hover:bg-gray-700
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input
        id="fileInput"
        type="file"
        accept="image/jpeg, image/png"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isLoading}
      />
      <svg
        className={`w-12 h-12 mb-3 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        ></path>
      </svg>
      <p className={`mb-2 text-lg font-semibold ${isDragging ? 'text-blue-300' : 'text-gray-200'}`}>
        Upload your image
      </p>
      <p className="text-sm text-gray-400">Drag & drop or click to browse (JPG, PNG)</p>
      {isLoading && <p className="text-blue-400 mt-2">Loading image...</p>}
    </div>
  );
};

export default ImageUploader;