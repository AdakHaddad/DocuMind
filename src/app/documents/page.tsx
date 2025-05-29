"use client";
import React, { useState } from "react";
import DocumentUploader from "../../components/documentUploader";
import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle document upload and call the API
  const handleDocumentUploaded = async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    
    // Process each file
    for (const file of files) {
      const startTime = Date.now();
      // Add document card immediately with loading state
      const tempDoc = {
        documentName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
        processingTime: 'Processing...',
        status: 'processing'
      };
      setUploadedDocs((prev) => [tempDoc, ...prev]);

      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 1000);

        // Upload and process the file
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to process document');
        }

        // Update the document with processed data
        setUploadedDocs((prev) => prev.map(doc => 
          doc.documentName === file.name 
            ? {
                ...doc,
                processedData: result.processedData,
                processingTime: result.processedData.metadata.processing_time,
                pipelineOptions: result.processedData.metadata.pipeline_options,
                status: 'completed'
              }
            : doc
        ));
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setIsUploadModalOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
      } catch (error) {
        // Update the document with error state
        setUploadedDocs((prev) => prev.map(doc => 
          doc.documentName === file.name 
            ? {
                ...doc,
                processingTime: 'Failed',
                status: 'error',
                error: (error as Error).message
              }
            : doc
        ));
        setUploadError('Error processing file: ' + (error as Error).message);
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Filter documents by search query
  const filteredDocs = uploadedDocs.filter((doc) =>
    doc.documentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <header className="bg-documind-primary py-4 px-6 flex justify-center items-center">
        <div className="bg-white rounded-md px-6 py-2 shadow-md">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-800">Your</span>{" "}
            <span className="text-documind-primary">Documents</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-documind-secondary rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-documind-primary focus:border-transparent"
              />
            </div>
            <button className="bg-documind-primary text-white px-6 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors">
              Search
            </button>
          </div>

          {/* Document Grid */}
          {filteredDocs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <FileText className="mx-auto w-16 h-16 mb-4 text-documind-primary" />
              <p>No documents uploaded yet. Click "Upload New Document" to get started.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredDocs.map((doc, index) => (
              <div
                key={index}
                className={`border rounded-md p-4 ${
                  doc.status === 'processing' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : doc.status === 'error'
                    ? 'border-red-500 bg-red-50'
                    : 'border-documind-primary'
                }`}
                >
                  <Link href={`/overview`}>
                  <h3 className="text-gray-800 font-medium mb-2 truncate" title={doc.documentName}>{doc.documentName}</h3>
                <div className="flex justify-center items-center w-full aspect-square mb-3 bg-gray-100 rounded-md">
                  {doc.status === 'processing' ? (
                    <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />
                  ) : (
                    <FileText className="w-16 h-16 text-documind-primary" />
                  )}
                </div>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">
                      {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      {doc.status === 'processing' ? 'Processing...' : `Processed: ${new Date(doc.processedAt).toLocaleString()}`}
                    </span>
                    <br />
                    <span className={`text-xs ${
                      doc.status === 'error' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {doc.status === 'error' ? `Error: ${doc.error}` : 
                       doc.status === 'processing' ? 'Processing...' :
                       `Processing time: ${doc.processingTime || 'N/A'}`}
                    </span>
                    {doc.pipelineOptions && (
                      <>
                        <br />
                        <span className="text-xs text-gray-500">
                          OCR: {doc.pipelineOptions.ocr_enabled ? 'Enabled' : 'Disabled'}
                          {doc.pipelineOptions.num_threads && ` • ${doc.pipelineOptions.num_threads} threads`}
                        </span>
                      </>
                    )}
                  </div>
                  {doc.status === 'completed' && (
                    <div className="flex flex-col gap-2">
                      <button 
                        className="bg-documind-primary text-white px-4 py-2 rounded-md text-sm hover:bg-opacity-90 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Processed data:', doc.processedData);
                        }}
                      >
                        View Processed Content
                      </button>
                    </div>
                  )}
                  </Link>
              </div>
            ))}
          </div>
          )}
          {uploadError && (
            <div className="text-red-600 text-center mt-4">{uploadError}</div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#4a90e2] py-4 px-6 flex justify-center items-center">
        <button
          className="bg-white text-documind-text-primary text-lg px-6 py-2 rounded-md font-bold hover:bg-gray-200 hover:cursor-pointer transition-colors shadow-lg"
          onClick={() => setIsUploadModalOpen(true)}
        >
        Upload New Document
        </button>
      </footer>

      {/* Document Uploader Modal */}
      <DocumentUploader 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUpload={handleDocumentUploaded} 
      />
    </>
  );
}
