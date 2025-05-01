"use client";
import React, { useState } from "react";
import DocumentUploader from "../../components/documentUploader";
import { FileText } from "lucide-react"; 
export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Sample document data
  const documents = Array(8).fill({
    title: "Modul 1 - Pemben....pdf",
    thumbnail: "",
  });

  /*
  const handleDocumentUploaded = async (file: File) => {
    setIsUploading(true);

    try {
      // Create FormData for the API request
      const formData = new FormData();
      formData.append("file", file);

      // Send the file to your API endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload document");
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      // Close modal and reset state after successful upload
      setIsUploadModalOpen(false);

      // You'd typically reload the documents list here
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document: " + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };
  */
  // Temporary placeholder for handleDocumentUploaded
  const handleDocumentUploaded = (file: File) => {
    console.log("Document selected:", file.name);
    setIsUploadModalOpen(false);
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="border border-documind-primary rounded-md p-4"
              >
                <h3 className="text-gray-800 font-medium mb-2">{doc.title}</h3>
                {/* Replaced black square with lucide-react PDF icon */}
                <div className="flex justify-center items-center w-full aspect-square mb-3 bg-gray-100 rounded-md">
                  <FileText className="w-16 h-16 text-documind-primary" />
                </div>
                <div className="flex gap-2">
                  <button className="bg-documind-primary text-white px-4 py-1 rounded-md flex-1 hover:bg-opacity-90 transition-colors">
                    Review
                  </button>
                  <button className="border border-documind-primary text-documind-primary px-4 py-1 rounded-md flex-1 hover:bg-gray-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                  <svg
                    className="animate-spin h-10 w-10 text-documind-primary mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-gray-700 font-medium">
                    Processing document...
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    This may take a minute depending on file size.
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
