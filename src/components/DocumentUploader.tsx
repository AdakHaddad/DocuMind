"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";

interface DocumentUploaderProps {
  onUpload: (files: File[]) => void;
  isOpen: boolean;
  onClose: () => void;
  allowedFileTypes?: string[];
}

export default function DocumentUploader({
  onUpload,
  isOpen,
  onClose,
  allowedFileTypes = [".pdf", ".jpeg", ".png", ".bmp", ".tiff", ".gif", ".docx", ".pptx", ".xlsx", ".xlsm", ".ppt"],

}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) {
        setIsDragging(true);
      }
    },
    [isDragging]
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      // Filter files by allowed types if specified
      const validFiles = allowedFileTypes.length
        ? files.filter((file) => {
            const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
            return allowedFileTypes.includes(extension);
          })
        : files;

      if (validFiles.length === 0) {
        alert("Please upload valid document files");
        return;
      }

      // estimate loading by interval
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return Math.min((prev || 0) + 10, 100);
        });
      }, 100);

      await onUpload(validFiles);
      onClose();
    },
    [allowedFileTypes, onClose, onUpload]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles]
  );

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div
            className={`border-2 ${
              isDragging ? "border-[#4a90e2] bg-blue-50" : "border-[#4a90e2]"
            } rounded-lg p-10 flex flex-col items-center justify-center transition-colors`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadProgress !== null ? (
              <div className="w-full">
                <div className="mb-2 text-center text-[#4a90e2] font-medium">
                  Uploading... {uploadProgress}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-[#4a90e2] h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <Upload size={48} className="text-[#4a90e2] mb-4" />
                <h3 className="text-[#4a90e2] text-xl font-medium mb-1">
                  Drag & Drop
                </h3>
                <p className="text-gray-700 font-medium mb-4">
                  to upload files
                </p>
                <button
                  onClick={handleBrowseClick}
                  className="bg-[#4a90e2] font-medium text-white px-6 py-2 rounded-md hover:bg-[#3a80d2] hover:cursor-pointer transition-colors"
                >
                  Browse files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept={allowedFileTypes.join(",")}
                  className="hidden"
                  multiple
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
