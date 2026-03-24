'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary, uploadMultipleToCloudinary } from '@/lib/cloudinary';

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  folder?: string;
  existingImages?: string[];
}

export default function ImageUpload({
  onUploadComplete,
  maxFiles = 5,
  folder = 'products',
  existingImages = [],
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingImages);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the max
    if (previewUrls.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    // Validate file types
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setError('');
    setUploading(true);

    try {
      // Upload to Cloudinary
      const uploadResults = await uploadMultipleToCloudinary(validFiles, folder);
      const newUrls = uploadResults.map((result) => result.secure_url);
      
      const updatedUrls = [...previewUrls, ...newUrls];
      setPreviewUrls(updatedUrls);
      onUploadComplete(updatedUrls);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload images';
      
      if (errorMessage.includes('Upload preset not found') || errorMessage.includes('upload preset')) {
        setError('❌ Upload preset "ml_default" not found in Cloudinary. Please create it: Settings → Upload → Upload presets → Add (set to Unsigned mode)');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Invalid Cloudinary credentials. Please check your .env.local file.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const updatedUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(updatedUrls);
    onUploadComplete(updatedUrls);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || previewUrls.length >= maxFiles}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Images'}
        </button>
        <span className="text-sm text-gray-600">
          {previewUrls.length} / {maxFiles} images
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-md font-medium">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previewUrls.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No images uploaded yet</p>
          <p className="text-sm text-gray-500">
            Click the upload button to add images
          </p>
        </div>
      )}
    </div>
  );
}
