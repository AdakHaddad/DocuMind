"use client";

import React, { useState, useRef } from "react";

interface DocumentUploaderProps {
  onDocumentUploaded: (file: File) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentUploaded,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        onDocumentUploaded(file);
      } else {
        alert("Please upload a PDF or PPT file");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isValidFileType(file)) {
        onDocumentUploaded(file);
      } else {
        alert("Please upload a PDF or PPT file");
      }
    }
  };

  const isValidFileType = (file: File) => {
    const acceptedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    return acceptedTypes.includes(file.type);
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-8 transition-colors
        ${dragActive ? "border-black bg-gray-50" : "border-gray-300"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.ppt,.pptx"
        onChange={handleChange}
      />

      <svg
        className="w-12 h-12 mb-3 text-gray-400"
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
        />
      </svg>

      <p className="mb-2 text-sm text-gray-600">
        <span className="font-medium">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500">PDF or PPT files (max 10MB)</p>

      <button
        type="button"
        onClick={onButtonClick}
        className="mt-4 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
      >
        Choose File
      </button>
    </div>
  );
};

export default DocumentUploader;
