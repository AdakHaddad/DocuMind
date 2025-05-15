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
  const handleDocumentUploaded = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    
    try {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
                  className="border border-documind-primary rounded-md p-4"
                >
                  <h3 className="text-gray-800 font-medium mb-2 truncate" title={doc.documentName}>{doc.documentName}</h3>
                  <div className="flex justify-center items-center w-full aspect-square mb-3 bg-gray-100 rounded-md">
                    <FileText className="w-16 h-16 text-documind-primary" />
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">{doc.totalFlashcards ?? 0} flashcards generated</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {doc.flashcards && doc.flashcards.length > 0 && (
                      <>
                        <Link 
                          href={`/documents/${doc.documentName}/flashcard`}
                          className="bg-documind-primary text-white px-4 py-2 rounded-md text-center hover:bg-opacity-90 transition-colors"
                        >
                          View Flashcards
                        </Link>
                        <details className="bg-gray-50 rounded p-2">
                          <summary className="cursor-pointer text-documind-primary font-medium">Preview Flashcards</summary>
                          <ul className="mt-2 space-y-2">
                            {doc.flashcards.map((card: any, idx: number) => (
                              <li key={idx} className="border rounded p-2 text-sm">
                                <strong>Q:</strong> {card.question}<br />
                                <strong>A:</strong> {card.answer}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </>
                    )}
                  </div>
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
      <footer className="bg-documind-primary py-4 px-6 flex justify-center items-center">
        <button
          className="bg-white text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors shadow-md"
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload New Document
        </button>
      </footer>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Upload Document
              </h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isUploading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Upload a document to generate flash cards. We support PDF and
                PPT files up to 10MB.
              </p>

              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="animate-spin h-10 w-10 text-documind-primary mb-4" />
                  <p className="text-gray-700 font-medium">
                    Processing document...
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    This may take a minute depending on file size.
                  </p>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                    <div 
                      className="bg-documind-primary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {uploadProgress}% complete
                  </p>
                </div>
              ) : (
                <DocumentUploader onDocumentUploaded={handleDocumentUploaded} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
