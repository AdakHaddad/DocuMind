"use client";
import React, { useEffect, useState } from "react";
import DocumentUploader from "@/src/components/DocumentUploader";
import { FileText } from "lucide-react";
import Link from "next/link";
import { SingleReport } from "@/src/app/api/learning/documents/route";

export interface DocumentObject {
  _id: string;
  title: string;
  slug: string; // Unique slug for the document
  owner: string; // Owner's slug
  content: string;
  summary: string;
  access: "public" | "private";
  reports: SingleReport[];
  driveFileUrl: string; // Google Drive file URL
  createdAt?: Date; // Optional timestamp field
  updatedAt?: Date; // Optional timestamp field
}

export default function Documents() {
  const [uploadedDocs, setUploadedDocs] = useState<DocumentObject[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocumentObject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter documents by search query
  useEffect(() => {
    const filteredDocs = uploadedDocs.filter(
      (doc) =>
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDocs(filteredDocs);
  }, [searchQuery, uploadedDocs]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/learning/documents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        window.location.href = "/login";
      }

      const data = await response.json();

      if (data) {
        const documents: DocumentObject[] = data;

        // sort data showing private first
        documents.sort((a, b) => {
          if (a.access === "private" && b.access === "public") return -1;
          if (a.access === "public" && b.access === "private") return 1;
          return 0; // Keep the original order for same access level
        });

        setUploadedDocs(documents);
      }
    };

    Promise.all([fetchData()]);
  }, []);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // const [isUploading, setIsUploading] = useState(false);
  // const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle document upload and call the API
  const handleDocumentUploaded = async (files: File[]) => {
    // setIsUploading(true);
    setUploadError(null);
    // setUploadProgress(0);

    // Process each file
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Upload and process the file
        const response = await fetch("/api/learning/documents", {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        // Refresh the page
        window.location.reload();
      } catch (error) {
        setUploadError("Error processing file: " + (error as Error).message);
      }
    }
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
          {filteredDocs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <FileText className="mx-auto w-16 h-16 mb-4 text-documind-primary" />
              <p>
                No documents uploaded yet. Click &quot;Upload New Document&quot;
                to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredDocs.map((doc, index) => (
                <div key={index}>
                  <Link
                    href={`/${doc.owner}/${doc.slug}`}
                    className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h3
                      className="text-gray-800 font-medium mb-2 truncate"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>
                    <div className="flex justify-center items-center w-full aspect-square mb-3 bg-gray-100 rounded-md">
                      {doc.driveFileUrl ? (
                        <iframe
                          src={`${doc.driveFileUrl}`}
                          className="w-full h-full rounded-md"
                          title={doc.title}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {doc.access === "public"
                        ? "Public Document"
                        : "Private Document"}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      {doc.summary.length > 100
                        ? doc.summary.substring(0, 100) + "..."
                        : doc.summary}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(doc.createdAt || "").toLocaleDateString()}
                    </p>
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
