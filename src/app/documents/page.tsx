"use client";
import React from "react";

import { useState } from "react";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample document data
  const documents = Array(8).fill({
    title: "Modul 1 - Pemben....pdf",
    thumbnail: "/placeholder.svg?height=200&width=200",
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-[#4a90e2] py-4 px-6 flex justify-center items-center">
        <div className="bg-white rounded-md px-6 py-2 shadow-md">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-800">Your</span>{" "}
            <span className="text-[#4a90e2]">Documents</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-[#f0ad4e] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
              />
            </div>
            <button className="bg-[#4a90e2] text-white px-6 py-2 rounded-md font-medium hover:bg-[#3a80d2] transition-colors">
              Search
            </button>
          </div>

          {/* Document Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="border border-[#4a90e2] rounded-md p-4"
              >
                <h3 className="text-gray-800 font-medium mb-2">{doc.title}</h3>
                <div className="bg-black w-full aspect-square mb-3"></div>
                <div className="flex gap-2">
                  <button className="bg-[#4a90e2] text-white px-4 py-1 rounded-md flex-1 hover:bg-[#3a80d2] transition-colors">
                    Review
                  </button>
                  <button className="border border-[#4a90e2] text-[#4a90e2] px-4 py-1 rounded-md flex-1 hover:bg-gray-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#4a90e2] py-4 px-6 flex justify-center items-center">
        <button className="bg-white text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors shadow-md">
          Upload New Document
        </button>
      </footer>
    </div>
  );
}
