"use client";
import React from "react";

import { useState } from "react";

export default function Flashcards() {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample document data
  const cards = Array(8).fill({
    question: "What is the definition of Lorem Ipsum and why does it have Dolor sit Amet?",
    thumbnail: "",
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-[#4a90e2] py-4 px-6 flex justify-around items-center">
        {/* Back & Doc Name */}
        <div className="flex gap-4 justify-center items-left">
          <button className="border-2 border-[#F5A623] bg-[#F5A623] text-white font-bold px-4 py-3 rounded-md hover:bg-gray-400 hover:border-gray-400 transition-colors">
                      {`<<`}
          </button>
          <div className="bg-white rounded-md px-6 py-2 shadow-md">
            <h1 className="text-3xl font-bold">
              <span className="text-gray-800">Modul 1 - Rumusan Masalah.pdf</span>
            </h1>
          </div>
        </div>
        {/* Rename Delete */}
        <div className="flex gap-4 justify-right items-right">
          <button className="border-2 border-white bg-transparent text-white px-6 py-3 rounded-md font-medium hover:bg-gray-400 hover:border-gray-400 hover:text-white transition-colors shadow-md">
              Rename
          </button>
          <button className="border-2 border-[#F5A623] bg-[#F5A623] text-white font-bold px-4 py-3 rounded-md hover:bg-gray-400 hover:border-gray-400 transition-colors">
                      Delete
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          {/* Search Bar */}
          {/* <div className="flex gap-4 mb-6">
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
          </div> */}

          {/* Document Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
              <div
                key={index}
                className="border-2 border-[#4a90e2] rounded-lg p-4"
              >
                <h3 className="text-gray-800 font-medium mb-2">{card.question}</h3>
                <div className="flex gap-2">
                  <button className="bg-[#4a90e2] text-white px-4 py-1 rounded-md flex-1 hover:bg-[#3a80d2] transition-colors">
                    View Answer
                  </button>
                  <button className="bg-[#F5A623] text-white px-4 py-1 rounded-md flex-1 hover:bg-gray-400 transition-colors">
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Buttons */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button className="border-3 border-[#4a90e2] bg-[#4a90e2] text-white px-6 py-2 rounded-md font-medium hover:bg-[#3a80d2] hover:border-[#3a80d2] transition-colors shadow-md">
            Regenerate
            </button>
            <button className="border-3 border-[#4a90e2] bg-white text-[#3a80d2] px-6 py-2 rounded-md font-medium hover:bg-gray-400 hover:border-gray-400 hover:text-white transition-colors shadow-md">
            Save Flash Cards
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#4a90e2] py-4 px-6 flex justify-center items-center space-x-4">
        <button className="bg-white text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-[#F5A623] transition-colors shadow-md">
          Overview
        </button>
        <button className="bg-white text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-[#F5A623] transition-colors shadow-md">
          Flash Cards
        </button>
        <button className="bg-white text-gray-800 px-6 py-2 rounded-md font-medium hover:bg-[#F5A623] transition-colors shadow-md">
          Quiz
        </button>
      </footer>
    </div>
  );
}
