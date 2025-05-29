"use client";
import React, { useState } from "react";
import DocumentUploader from "@/src/components/DocumentUploader";
import {  Loader2, Upload, Eye, X, AlertCircle, CheckCircle2 } from "lucide-react";
// import Link from "next/link";

interface Document {
  documentName: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'error';
  processingStartTime?: string;
  processingEndTime?: string;
  processingTime?: number;
  error?: string;
  content?: string;
  metadata?: {
    filename: string;
    processed_at: string;
    processing_time: string;
    status: string;
    original_filename?: string;
    file_type?: string;
  };
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // const [setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Handle document upload and call the API
  const handleDocumentUploaded = async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];

    try {
      setIsUploading(true);
      setUploadError(null);
      const startTime = Date.now();
    
      // Create a temporary document object for immediate display
      const tempDoc: Document = {
        documentName: file.name,
        fileSize: file.size,
        status: 'processing',
        processingStartTime: new Date().toISOString(),
        processingTime: 0
      };

      // Add to documents list immediately
      setDocuments(prev => [tempDoc, ...prev]);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process document");
      }

      // Calculate processing time
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000; // Convert to seconds

      // Update the document with processed data
      setDocuments(prev => prev.map(doc => 
        doc.documentName === file.name
          ? {
              documentName: file.name,
              fileSize: file.size,
              status: 'completed',
              processingTime,
              processingEndTime: new Date().toISOString(),
              content: result.data.text,
              metadata: {
                ...result.data.metadata,
                original_filename: file.name,
                file_type: file.type
              }
            }
          : doc
      ));

      setIsUploadModalOpen(false);

    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document";
      setUploadError(errorMessage);
      
      // Update document status to error
      setDocuments(prev => prev.map(doc => 
        doc.documentName === file.name
          ? {
              ...doc,
              status: 'error',
              error: errorMessage
            }
          : doc
      ));
    } finally {
      setIsUploading(false);
      // setUploadProgress(0);
    }
  };

  // Filter documents by search query
  const filteredDocuments = documents.filter(doc =>
    doc.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Documents</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              disabled={isUploading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                isUploading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </div>
        {uploadError && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Upload failed</h3>
              <p className="text-sm text-red-700 mt-1">{uploadError}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 truncate" title={doc.documentName}>
                  {doc.documentName}
                </h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Size: {(doc.fileSize / 1024).toFixed(2)} KB
                  </p>
                  {doc.processingTime && (
                    <p className="text-sm text-gray-600">
                      Processed in: {doc.processingTime.toFixed(2)}s
                    </p>
                  )}
                  {doc.metadata?.processed_at && (
                    <p className="text-sm text-gray-600">
                      Processed at: {new Date(doc.metadata.processed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {doc.status === 'processing' && (
                  <div className="flex items-center gap-2 text-blue-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
                {doc.status === 'error' && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Failed</span>
                  </div>
                )}
                {doc.status === 'completed' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {doc.status === 'processing' && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div className="bg-blue-500 h-2.5 rounded-full w-full animate-pulse"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedDocument.documentName}</h2>
                {selectedDocument.metadata && (
                  <p className="text-sm text-gray-500 mt-1">
                    Processed: {new Date(selectedDocument.metadata.processed_at).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="prose max-w-none">
                {selectedDocument.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Uploader Modal */}
      <DocumentUploader
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleDocumentUploaded}
        allowedFileTypes={[".pdf", ".pptx"]}
      />
    </div>
  );
}
