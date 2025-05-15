"use client";
import React, { useState } from "react";
import DocumentUploader from "@/src/components/DocumentUploader";
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
  const handleDocumentUploaded = (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    
    // Process each file
    files.forEach((file) => {
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

      // Simulate API delay
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Create dummy document data
        const dummyDoc = {
          documentName: file.name,
          totalFlashcards: 3,
          flashcards: [
            {
              question: "What is the main purpose of this document?",
              answer: "This is a demo document showing how flashcards work."
            },
            {
              question: "How many flashcards are generated?",
              answer: "Three flashcards are generated for this demo."
            },
            {
              question: "Is this a real document processing?",
              answer: "No, this is a demo with dummy data."
            }
          ]
        };
        
        setUploadedDocs((prev) => [dummyDoc, ...prev]);
        setIsUploadModalOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 2000);
    });
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
                className="border border-documind-primary rounded-md p-4"
                >
                  <Link href={`/overview`}>
                  <h3 className="text-gray-800 font-medium mb-2 truncate" title={doc.documentName}>{doc.documentName}</h3>
                <div className="flex justify-center items-center w-full aspect-square mb-3 bg-gray-100 rounded-md">
                  <FileText className="w-16 h-16 text-documind-primary" />
                </div>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">{doc.totalFlashcards ?? 0} flashcards generated</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    

                  </div>
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
          className="bg-white text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors shadow-md"
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
