'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, FileText } from 'lucide-react';
import { notifications } from '@mantine/notifications';

interface FileUploadProps {
  value: string | null;
  previewUrl: string | null;
  fileType: string | null;
  onChange: (value: string | null, previewUrl: string | null, fileType: string | null) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in bytes
  uploadUrl?: string;
  required?: boolean;
}

export function FileUpload({
  value,
  previewUrl,
  fileType,
  onChange,
  label,
  accept = 'image/png, image/jpeg, application/pdf',
  maxSize = 10 * 1024 * 1024, // 10MB
  uploadUrl = '/api/uploads/kyc',
  required = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate size
    if (file.size > maxSize) {
      notifications.show({
        title: 'Upload error',
        message: `File is too large. Max size is ${Math.round(maxSize / (1024 * 1024))}MB.`,
        color: 'red',
      });
      return;
    }

    // Validate format
    const allowedTypes = accept.split(',').map((t) => t.trim());
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const prefix = type.replace('/*', '');
        return file.type.startsWith(prefix);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      notifications.show({
        title: 'Upload error',
        message: 'Invalid file format. Please upload an accepted format.',
        color: 'red',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed (${response.status})`);
      }

      const result = await response.json();
      const isImage = file.type.startsWith('image/');
      onChange(JSON.stringify(result), isImage ? result.secureUrl : null, file.type);
    } catch (err) {
      console.error('File upload error:', err);
      const msg = err instanceof Error ? err.message : 'File upload failed. Please try again.';
      notifications.show({
        title: 'Upload error',
        message: msg,
        color: 'red',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFormatLabel = () => {
    return accept
      .split(',')
      .map((t) => {
        const parts = t.trim().split('/');
        return parts[1] ? parts[1].toUpperCase() : parts[0].toUpperCase();
      })
      .join(', ');
  };

  let displayFilename = '';
  if (value) {
    try {
      const parsed = JSON.parse(value);
      displayFilename = parsed.originalFilename || parsed.publicId || '';
    } catch {
      displayFilename = value.replace(/^kyc-docs\/\d+_(.+)$/, '$1');
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-[#737373]">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {value ? (
        <div className="border border-slate-100 bg-[#FAFAFA] rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {previewUrl ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                  <Image 
                    src={previewUrl} 
                    alt="Preview" 
                    width={48}
                    height={48}
                    unoptimized
                    className="w-full h-full object-cover" 
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-pink-50 text-instagram-pink flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                  {displayFilename}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {(fileType?.split('/')?.[1] || 'document').toUpperCase()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(null, null, null)}
              className="text-xs text-red-500 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              handleFile(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-2xl p-6 text-center hover:bg-slate-50 transition duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 w-full text-slate-500 ${
            isDragging ? 'border-instagram-pink bg-pink-50/30' : 'border-[#EFEFEF]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFile(file);
              }
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-instagram-pink border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold">Uploading...</span>
            </div>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-[#A3A3A3]" />
              <div>
                <p className="text-xs font-bold text-slate-700">Drag & drop files or click to upload</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supported formats: {getFormatLabel()} (Max {Math.round(maxSize / (1024 * 1024))}MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
